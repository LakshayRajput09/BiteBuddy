import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from database import init_db, SessionLocal, Food, Order, OrderItem
from seed_data import seed_database


@pytest.fixture(scope="module")
def client():
    init_db()
    seed_database()
    db = SessionLocal()
    db.query(OrderItem).delete()
    db.query(Order).delete()
    db.commit()
    db.close()
    with TestClient(app) as c:
        yield c
    db = SessionLocal()
    db.query(OrderItem).delete()
    db.query(Order).delete()
    db.commit()
    db.close()


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_get_menu(client):
    res = client.get("/menu")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 30
    assert any(item["name"] == "Paneer Kathi Roll" for item in data)


def test_put_menu_availability(client):
    # Toggle availability for item 1
    res = client.put("/menu/1/availability", json={"available": False})
    assert res.status_code == 200
    assert res.json()["available"] is False

    # Restore availability
    res = client.put("/menu/1/availability", json={"available": True})
    assert res.status_code == 200
    assert res.json()["available"] is True


def test_post_recommend_direct(client):
    payload = {
        "budget": 80.0,
        "diet": "vegetarian",
        "taste": ["spicy"],
        "time_limit": 15
    }
    res = client.post("/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["top_pick"] is not None
    assert data["top_pick"]["item"]["price"] <= 80.0
    assert data["top_pick"]["item"]["vegetarian"] is True
    assert len(data["alternatives"]) >= 2


def test_chat_immediate_recommendation_without_budget_nagging(client):
    # User message with taste/craving but no budget (Section 13: recommend immediately without nagging)
    res = client.post("/chat", json={"message": "I want something spicy and tasty"})
    assert res.status_code == 200
    data = res.json()
    assert data["is_clarification"] is False
    assert data["recommendation"] is not None
    assert data["recommendation"]["item"]["spicy"] is True
    # Strictly top 3 recommendations (1 top pick + max 2 alternatives)
    assert len(data["alternatives"]) <= 2


def test_chat_edge_case_contradiction_vegan_paneer(client):
    # Conflicting requirement: vegan + paneer
    res = client.post("/chat", json={"message": "I want vegan paneer roll under ₹100"})
    assert res.status_code == 200
    data = res.json()
    assert data["is_clarification"] is True
    assert data["clarification_type"] == "conflict"
    assert "vegan" in data["reply_text"].lower()
    assert "paneer" in data["reply_text"].lower()


def test_chat_edge_case_negative_budget(client):
    # Negative budget
    res = client.post("/chat", json={"message": "Give me something for -₹50"})
    assert res.status_code == 200
    data = res.json()
    assert data["is_clarification"] is True
    assert data["clarification_type"] == "validation_error"


def test_chat_full_flow_and_conversational_refinement(client):
    # Turn 1: "I'm tired, have ₹120, want something spicy and vegetarian, and only have 10 minutes."
    res1 = client.post(
        "/chat",
        json={"message": "I'm tired, have ₹120, want something spicy and vegetarian, and only have 10 minutes."}
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["is_clarification"] is False
    assert data1["recommendation"] is not None
    assert data1["recommendation"]["item"]["vegetarian"] is True
    assert data1["recommendation"]["item"]["price"] <= 120.0
    session_id = data1["session_id"]
    first_item_name = data1["recommendation"]["item"]["name"]

    # Turn 2: Conversational Refinement "I don't want rolls" (or whatever was recommended)
    category = data1["recommendation"]["item"]["category"].lower()
    exclusion_keyword = "rolls" if "roll" in category else "noodles"
    res2 = client.post(
        "/chat",
        json={"message": f"I don't want {exclusion_keyword}", "session_id": session_id}
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["is_clarification"] is False
    assert data2["recommendation"] is not None
    # Prior budget and diet should still be enforced!
    assert data2["recommendation"]["item"]["price"] <= 120.0
    assert data2["recommendation"]["item"]["vegetarian"] is True
    # And exclusion applied
    assert exclusion_keyword not in data2["recommendation"]["item"]["name"].lower()


def test_multi_role_auth(client):
    import uuid
    unique_email = f"priya_{uuid.uuid4().hex[:6]}@college.edu"
    # 1. Register student
    reg_student = {
        "name": "Priya Sharma",
        "email": unique_email,
        "password": "password123",
        "role": "student"
    }
    r1 = client.post("/auth/register", json=reg_student)
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["user"]["role"] == "student"
    assert d1["user"]["email"] == unique_email

    # 2. Login student
    login_res = client.post("/auth/login", json={"email": unique_email, "password": "password123"})
    assert login_res.status_code == 200
    assert login_res.json()["user"]["name"] == "Priya Sharma"

    # 3. Demo login student (Lakshay)
    demo_s = client.post("/auth/demo-login", json={"role": "student"})
    assert demo_s.status_code == 200
    assert demo_s.json()["user"]["id"] == "student_lakshay"
    assert demo_s.json()["user"]["role"] == "student"

    # 4. Demo login owner (Chef Ramesh)
    demo_o = client.post("/auth/demo-login", json={"role": "cafeteria_owner"})
    assert demo_o.status_code == 200
    assert demo_o.json()["user"]["id"] == "owner_ramesh"
    assert demo_o.json()["user"]["role"] == "cafeteria_owner"

    # 5. Demo login with custom name
    demo_custom = client.post("/auth/demo-login", json={"role": "student", "name": "Aditya Roy"})
    assert demo_custom.status_code == 200
    assert demo_custom.json()["user"]["name"] == "Aditya Roy"

    # 6. Update name endpoint
    update_name_res = client.put("/auth/update-name", json={"user_id": "student_lakshay", "name": "Lakshay"})
    assert update_name_res.status_code == 200
    assert update_name_res.json()["name"] == "Lakshay"


def test_orders_dynamic_macros_and_frozen_integrity(client):
    # Item 1: Paneer Kathi Roll (Price 75, Calories 340, Protein 18, Carbs 32, Fat 16)
    # Item 29: Fresh Lime Soda (Price 30, Calories 80, Protein 0, Carbs 20, Fat 0)
    order_payload = {
        "student_id": "student_lakshay",
        "items": [
            {"food_id": 1, "quantity": 2},  # 2 * 75 = 150, 2 * 18 = 36g protein, 2 * 340 = 680 kcal
            {"food_id": 29, "quantity": 1}  # 1 * 30 = 30, 0g protein, 80 kcal
        ]
    }
    res = client.post("/orders", json=order_payload)
    assert res.status_code == 200
    order = res.json()
    assert order["total_price"] == 180.0
    assert order["total_calories"] == 760.0
    assert order["total_protein"] == 36.0
    assert order["total_carbs"] == 84.0
    assert order["total_fat"] == 32.0
    order_id = order["id"]

    # Now Cafeteria Owner edits Item 1: increases price to ₹99 and changes protein to 30g
    client.put("/owner/menu/1", json={"price": 99.0, "protein": 30.0, "calories": 500.0})

    # Fetch historical order: It MUST still reflect the frozen original values (180 INR, 36g protein, 760 kcal)
    order_check = client.get(f"/orders/{order_id}")
    assert order_check.status_code == 200
    frozen_order = order_check.json()
    assert frozen_order["total_price"] == 180.0
    assert frozen_order["total_protein"] == 36.0
    assert frozen_order["total_calories"] == 760.0

    # Restore Item 1
    client.put("/owner/menu/1", json={"price": 75.0, "protein": 18.0, "calories": 340.0})


def test_todays_nutrition_starts_zero_and_only_increases_on_order(client):
    # Ensure zero orders
    db = SessionLocal()
    db.query(OrderItem).delete()
    db.query(Order).delete()
    db.commit()
    db.close()

    # 1. Before ordering, today's nutrition MUST be strictly 0
    res = client.get("/student/nutrition?user_id=student_lakshay")
    assert res.status_code == 200
    nutrition = res.json()
    assert nutrition["consumed_calories"] == 0.0
    assert nutrition["consumed_protein"] == 0.0
    assert nutrition["consumed_carbs"] == 0.0
    assert nutrition["consumed_fat"] == 0.0
    assert len(nutrition["meals_today"]) == 0

    # 2. Place an order for 1x Paneer Kathi Roll (item_id 1: 340 cal, 18 prot, 32 carb, 16 fat)
    order_res = client.post("/orders", json={
        "student_id": "student_lakshay",
        "items": [{"food_id": 1, "quantity": 1}]
    })
    assert order_res.status_code == 200

    # 3. Today's nutrition MUST now reflect ONLY the placed order
    res_after = client.get("/student/nutrition?user_id=student_lakshay")
    assert res_after.status_code == 200
    nutrition_after = res_after.json()
    assert nutrition_after["consumed_calories"] == 340.0
    assert nutrition_after["consumed_protein"] == 18.0
    assert nutrition_after["consumed_carbs"] == 32.0
    assert nutrition_after["consumed_fat"] == 16.0
    assert len(nutrition_after["meals_today"]) == 1
    assert nutrition_after["meals_today"][0]["name"] == "Paneer Kathi Roll"


def test_owner_menu_crud_and_stats(client):
    # 1. Get Stats
    stats_res = client.get("/owner/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_items"] >= 30
    assert stats["available_items"] >= 20
    assert "popular_items" in stats
    assert len(stats["orders_trend"]) > 0

    # 2. Add New Food Item with macros
    new_food = {
        "name": "Tofu Scramble Toast",
        "description": "Crisp sourdough topped with turmeric spiced organic tofu scramble and microgreens.",
        "category": "Snacks",
        "price": 80.0,
        "ingredients": "tofu,sourdough bread,bell peppers,turmeric,nutritional yeast",
        "serving_size": "2 toasts",
        "vegetarian": True,
        "vegan": True,
        "jain": True,
        "spicy": True,
        "sweet": False,
        "preparation_time": 6,
        "available": True,
        "cuisine": "Continental",
        "calories": 280.0,
        "protein": 19.0,
        "carbohydrates": 32.0,
        "fat": 8.0,
        "fiber": 5.0,
        "sugar": 2.0,
        "sodium": 340.0
    }
    create_res = client.post("/owner/menu", json=new_food)
    assert create_res.status_code == 200
    created = create_res.json()
    new_id = created["item_id"]
    assert created["protein"] == 19.0

    # 3. Toggle Availability
    avail_res = client.patch(f"/owner/menu/{new_id}/availability", json={"available": False})
    assert avail_res.status_code == 200
    assert avail_res.json()["available"] is False

    # 4. Delete Food
    del_res = client.delete(f"/owner/menu/{new_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"


def test_section_28_demo_scenario(client):
    # 1. Reset item 1 to available
    client.put("/menu/1/availability", json={"available": True})

    # Student preferences from Section 28:
    # Vegetarian, Spicy, Budget ₹120, Time limit 10 min, High protein
    payload = {
        "budget": 120.0,
        "diet": "vegetarian",
        "taste": ["spicy"],
        "time_limit": 10,
        "protein_goal": "high"
    }

    res = client.post("/recommend", json=payload)
    assert res.status_code == 200
    rec = res.json()
    assert rec["top_pick"] is not None
    assert rec["top_pick"]["item"]["name"] == "Paneer Kathi Roll"
    assert rec["top_pick"]["item"]["vegetarian"] is True
    assert rec["top_pick"]["item"]["spicy"] is True
    assert rec["top_pick"]["item"]["preparation_time"] <= 10
    assert rec["combo"] is not None
    # Paneer Kathi Roll (₹75) + Fresh Lime Soda (₹30) = ₹105
    assert rec["combo"]["total_price"] == 105.0
    assert rec["combo"]["max_prep_time"] == 8
    assert rec["combo"]["total_calories"] == 420.0
    assert rec["combo"]["total_protein"] == 18.0
    assert rec["combo"]["total_carbs"] == 52.0
    assert rec["combo"]["total_fat"] == 16.0

    # Student places order for this combo
    order_res = client.post("/orders", json={
        "student_id": "student_lakshay",
        "items": [
            {"food_id": rec["top_pick"]["item"]["item_id"], "quantity": 1},
            {"food_id": rec["combo"]["side_item"]["item_id"], "quantity": 1}
        ]
    })
    assert order_res.status_code == 200

    # 2. Cafeteria Owner changes Paneer Kathi Roll availability to Unavailable
    client.put("/menu/1/availability", json={"available": False})

    # 3. Next recommendation must avoid Paneer Kathi Roll and recommend an alternative!
    res_after = client.post("/recommend", json=payload)
    assert res_after.status_code == 200
    rec_after = res_after.json()
    assert rec_after["top_pick"] is not None
    assert rec_after["top_pick"]["item"]["name"] != "Paneer Kathi Roll"
    assert rec_after["top_pick"]["item"]["available"] is True
    assert rec_after["top_pick"]["item"]["vegetarian"] is True

    # Restore item 1
    client.put("/menu/1/availability", json={"available": True})


def test_chat_greetings_and_inquiries(client):
    # 1. Greeting intent
    res = client.post("/chat", json={"message": "Hello!"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] in ["greeting", "GREETING"]
    assert "BiteBuddy" in data["reply_text"]
    assert len(data["suggested_followups"]) > 0

    # 2. Nutrition inquiry: highest protein
    res2 = client.post("/chat", json={"message": "What has the highest protein?"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["intent"] in ["nutrition_inquiry", "ASK_NUTRITION"]
    assert "protein" in data2["reply_text"].lower()
    assert len(data2["matched_items"]) > 0
    assert len(data2["suggested_followups"]) > 0

    # 3. Menu inquiry: cheapest item
    res3 = client.post("/chat", json={"message": "What is the cheapest item?"})
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["intent"] in ["menu_inquiry", "ASK_PRICE", "SEARCH_FOOD"]
    assert len(data3["matched_items"]) > 0

    # 4. Menu inquiry: dishes with paneer
    res4 = client.post("/chat", json={"message": "What dishes have paneer?"})
    assert res4.status_code == 200
    data4 = res4.json()
    assert data4["intent"] in ["menu_inquiry", "ASK_FOOD_DETAILS", "SEARCH_FOOD"]
    assert any("paneer" in item["name"].lower() for item in data4["matched_items"])


def test_chat_off_menu_item_unavailable(client):
    # 1. Direct query for pizza (mapped in OFF_MENU_FOOD_MAP)
    res_pizza = client.post("/chat", json={"message": "Do you have pizza?"})
    assert res_pizza.status_code == 200
    data_pizza = res_pizza.json()
    assert data_pizza["intent"] == "off_menu"
    assert "not available on our canteen menu" in data_pizza["reply_text"].lower()
    assert "pizza" in data_pizza["reply_text"].lower()
    assert len(data_pizza["matched_items"]) > 0
    # Available alternatives should be returned (e.g. Cheese Grilled Sandwich)
    assert any(item["available"] for item in data_pizza["matched_items"])

    # 2. Query for burger under budget
    res_burger = client.post("/chat", json={"message": "I want a burger under ₹100"})
    assert res_burger.status_code == 200
    data_burger = res_burger.json()
    assert data_burger["intent"] == "off_menu"
    assert "not available on our canteen menu" in data_burger["reply_text"].lower()
    assert "burger" in data_burger["reply_text"].lower()
    assert len(data_burger["matched_items"]) > 0

    # 3. Query for sushi (uncommon / international food not in canteen)
    res_sushi = client.post("/chat", json={"message": "Can I get sushi?"})
    assert res_sushi.status_code == 200
    data_sushi = res_sushi.json()
    assert data_sushi["intent"] == "off_menu"
    assert "not available on our canteen menu" in data_sushi["reply_text"].lower()
    assert "sushi" in data_sushi["reply_text"].lower()

    # 4. Query for tacos (Mexican food not in canteen)
    res_taco = client.post("/chat", json={"message": "Do you serve tacos?"})
    assert res_taco.status_code == 200
    data_taco = res_taco.json()
    assert data_taco["intent"] == "off_menu"
    assert "not available on our canteen menu" in data_taco["reply_text"].lower()


def test_chat_irrelevant_query(client):
    # 1. Technical / Coding question
    res1 = client.post("/chat", json={"message": "Write a python script to reverse a linked list"})
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["intent"] in ["irrelevant", "IRRELEVANT"]
    assert "not relevant" in data1["reply_text"].lower()
    assert len(data1["matched_items"]) == 0

    # 2. Math / Homework question
    res2 = client.post("/chat", json={"message": "Can you solve 3x + 15 = 45?"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["intent"] in ["irrelevant", "IRRELEVANT"]
    assert "not relevant" in data2["reply_text"].lower()

    # 3. World trivia / Politics
    res3 = client.post("/chat", json={"message": "Who is the president of France?"})
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["intent"] in ["irrelevant", "IRRELEVANT"]
    assert "not relevant" in data3["reply_text"].lower()

    # 4. Non-canteen everyday advice
    res4 = client.post("/chat", json={"message": "How do I fix a flat tire on my car?"})
    assert res4.status_code == 200
    data4 = res4.json()
    assert data4["intent"] in ["irrelevant", "IRRELEVANT"]
    assert "not relevant" in data4["reply_text"].lower()


def test_chat_sold_out_on_menu_item_unavailable_and_recommends(client):
    # 1. Set Paneer Kathi Roll (item 1) to Unavailable
    client.put("/menu/1/availability", json={"available": False})

    # 2. Student asks for Paneer Kathi Roll
    res = client.post("/chat", json={"message": "Can I get a Paneer Kathi Roll?"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "unavailable_item"
    # Must FIRST tell user it is unavailable / sold out:
    assert "unavailable" in data["reply_text"].lower() or "sold out" in data["reply_text"].lower()
    assert "paneer kathi roll" in data["reply_text"].lower()
    # Must THEN recommend available alternatives:
    assert "recommend" in data["reply_text"].lower() or "alternative" in data["reply_text"].lower()
    assert len(data["matched_items"]) > 0
    # Every recommended alternative MUST be currently available!
    for item in data["matched_items"]:
        assert item["available"] is True
        assert item["name"] != "Paneer Kathi Roll"

    # 3. Restore Paneer Kathi Roll to Available
    client.put("/menu/1/availability", json={"available": True})

    # 4. When available, inquiry confirms it is in stock!
    res_avail = client.post("/chat", json={"message": "Is Paneer Kathi Roll available?"})
    assert res_avail.status_code == 200
    data_avail = res_avail.json()
    assert "available right now" in data_avail["reply_text"].lower() or "in stock" in data_avail["reply_text"].lower()


def test_chat_comparison_matrix(client):
    # Student compares Maggi and Paneer Roll
    res = client.post("/chat", json={"message": "Maggi vs Paneer Roll"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "COMPARE_FOOD"
    assert data["response_type"] == "COMPARISON"
    assert data["comparison"] is not None
    assert "Paneer Kathi Roll" in [data["comparison"]["dish_a"]["name"], data["comparison"]["dish_b"]["name"]]
    assert "Classic Masala Maggi" in [data["comparison"]["dish_a"]["name"], data["comparison"]["dish_b"]["name"]]
    assert len(data["comparison"]["highlights"]) > 0
    assert "protein" in data["comparison"]["verdict"].lower()


def test_chat_order_action_integration(client):
    # 1. First get a recommendation
    res1 = client.post("/chat", json={"message": "Suggest a spicy snack under ₹100"})
    assert res1.status_code == 200
    data1 = res1.json()
    session_id = data1["session_id"]
    top_item_name = data1["recommendation"]["item"]["name"]

    # 2. Student says "Add the first one to my order"
    res2 = client.post("/chat", json={"message": "Add the first one to my order", "session_id": session_id})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["intent"] == "ORDER_FOOD"
    assert data2["response_type"] == "ORDER_CONFIRMATION"
    assert data2["order_action"] is not None
    assert data2["order_action"]["action_type"] == "add_to_order"
    assert data2["order_action"]["item"]["name"] == top_item_name
    assert "added" in data2["reply_text"].lower()


def test_chat_reference_resolution_macros(client):
    # 1. Initial recommendation
    res1 = client.post("/chat", json={"message": "Show high protein options under ₹150"})
    assert res1.status_code == 200
    data1 = res1.json()
    session_id = data1["session_id"]
    top_item = data1["recommendation"]["item"]

    # 2. Student asks "How much protein does the first one have?"
    res2 = client.post(
        "/chat",
        json={"message": "How much protein does the first one have?", "session_id": session_id}
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["intent"] == "ASK_NUTRITION"
    assert data2["response_type"] == "NUTRITION_RESULT"
    assert top_item["name"].lower() in data2["reply_text"].lower()
    assert f"{int(top_item['protein'])}g" in data2["reply_text"]


def test_chat_mind_changing_and_refinements(client):
    # 1. Turn 1: High protein meal under ₹150
    res1 = client.post("/chat", json={"message": "High protein meal under ₹150"})
    assert res1.status_code == 200
    data1 = res1.json()
    session_id = data1["session_id"]

    # 2. Turn 2: "Not noodles"
    res2 = client.post("/chat", json={"message": "Not noodles", "session_id": session_id})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["recommendation"] is not None
    assert "noodle" not in data2["recommendation"]["item"]["name"].lower()

    # 3. Turn 3: "Make it cheaper"
    res3 = client.post("/chat", json={"message": "Make it cheaper", "session_id": session_id})
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["recommendation"] is not None
    # Price should be lower than previous budget
    assert data3["recommendation"]["item"]["price"] <= 115.0

    # 4. Turn 4: "Forget my previous preference"
    res4 = client.post("/chat", json={"message": "Forget my previous preference", "session_id": session_id})
    assert res4.status_code == 200
    data4 = res4.json()
    assert "reset" in data4["reply_text"].lower()


def test_chat_greeting_and_help(client):
    # Greeting
    res_greet = client.post("/chat", json={"message": "Hello!"})
    assert res_greet.status_code == 200
    assert res_greet.json()["intent"] == "GREETING"
    assert "BiteBuddy" in res_greet.json()["reply_text"]

    # Help
    res_help = client.post("/chat", json={"message": "Help"})
    assert res_help.status_code == 200
    assert res_help.json()["intent"] == "HELP"
    assert "Recommend Meals" in res_help.json()["reply_text"]


# ==================================================
# Phase 21: 15 Real Database Scenario Tests
# ==================================================

def test_phase_21_scenarios(client):
    # Reset all items to available
    for i in range(1, 35):
        client.put(f"/menu/{i}/availability", json={"available": True})

    # TEST 1: User: "What should I eat?" -> Top available relevant foods
    res1 = client.post("/chat", json={"message": "What should I eat?", "session_id": "p21_t1"})
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["recommendation"] is not None
    assert d1["recommendation"]["item"]["available"] is True
    assert len(d1["recommendations"]) <= 3

    # TEST 2: User: "Something under ₹50." -> EVERY recommendation <= ₹50
    res2 = client.post("/chat", json={"message": "Something under ₹50.", "session_id": "p21_t2"})
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["recommendation"] is not None
    for rec in d2["recommendations"]:
        assert rec["item"]["price"] <= 50.0

    # TEST 3: User: "I'm vegetarian." -> NO non-vegetarian foods
    res3 = client.post("/chat", json={"message": "I'm vegetarian.", "session_id": "p21_t3"})
    assert res3.status_code == 200
    d3 = res3.json()
    assert d3["recommendation"] is not None
    for rec in d3["recommendations"]:
        assert rec["item"]["vegetarian"] is True

    # TEST 4: User: "Vegetarian and under ₹50." -> intersection of both filters
    res4 = client.post("/chat", json={"message": "Vegetarian and under ₹50.", "session_id": "p21_t4"})
    assert res4.status_code == 200
    d4 = res4.json()
    assert d4["recommendation"] is not None
    for rec in d4["recommendations"]:
        assert rec["item"]["vegetarian"] is True
        assert rec["item"]["price"] <= 50.0

    # TEST 5: User: "Something spicy under ₹100." -> spicy AND price <= 100
    res5 = client.post("/chat", json={"message": "Something spicy under ₹100.", "session_id": "p21_t5"})
    assert res5.status_code == 200
    d5 = res5.json()
    assert d5["recommendation"] is not None
    assert d5["recommendation"]["item"]["spicy"] is True
    assert d5["recommendation"]["item"]["price"] <= 100.0

    # TEST 6: User: "I have 5 minutes." -> prep_time <= 5
    res6 = client.post("/chat", json={"message": "I have 5 minutes.", "session_id": "p21_t6"})
    assert res6.status_code == 200
    d6 = res6.json()
    assert d6["recommendation"] is not None
    for rec in d6["recommendations"]:
        assert rec["item"]["preparation_time"] <= 5

    # TEST 7: User: "High protein." -> rank by protein among available foods
    res7 = client.post("/chat", json={"message": "High protein.", "session_id": "p21_t7"})
    assert res7.status_code == 200
    d7 = res7.json()
    assert d7["recommendation"] is not None
    assert d7["recommendation"]["item"]["protein"] >= 14.0

    # TEST 8: User: "Show me something cheaper." -> retain previous constraints
    # Turn A: budget 120
    client.post("/chat", json={"message": "I have ₹120 and want vegetarian", "session_id": "p21_t8"})
    res8 = client.post("/chat", json={"message": "Show me something cheaper", "session_id": "p21_t8"})
    assert res8.status_code == 200
    d8 = res8.json()
    assert d8["recommendation"] is not None
    assert d8["recommendation"]["item"]["vegetarian"] is True
    assert d8["recommendation"]["item"]["price"] <= 95.0

    # TEST 9: User: "Is Paneer Roll available?" -> database availability value
    res9 = client.post("/chat", json={"message": "Is Paneer Roll available?"})
    assert res9.status_code == 200
    assert "available" in res9.json()["reply_text"].lower()

    # TEST 10: User: "How much protein is in Paneer Roll?" -> database protein value
    res10 = client.post("/chat", json={"message": "How much protein is in Paneer Roll?"})
    assert res10.status_code == 200
    # Paneer Kathi Roll has 18g protein
    assert "18" in res10.json()["reply_text"]

    # TEST 11: User: "Maggi vs Paneer Roll." -> database values only
    res11 = client.post("/chat", json={"message": "Maggi vs Paneer Roll"})
    assert res11.status_code == 200
    assert res11.json()["response_type"] == "COMPARISON"
    assert res11.json()["comparison"] is not None

    # TEST 12: User: "Give me a meal under ₹100." -> valid combo <= ₹100
    res12 = client.post("/chat", json={"message": "Give me a meal under ₹100."})
    assert res12.status_code == 200
    d12 = res12.json()
    if d12.get("combo"):
        assert d12["combo"]["total_price"] <= 100.0

    # TEST 13: User: "I'm allergic to peanuts." -> foods containing peanuts/nuts excluded
    res13 = client.post("/chat", json={"message": "I'm allergic to peanuts."})
    assert res13.status_code == 200
    d13 = res13.json()
    for rec in d13["recommendations"]:
        assert rec["item"]["contains_nuts"] is False
        assert "peanut" not in rec["item"]["ingredients"].lower()

    # TEST 14: User: "Give me something under ₹10 with 50g protein." -> No fake recommendation if none exists
    res14 = client.post("/chat", json={"message": "Give me something under ₹10 with 50g protein."})
    assert res14.status_code == 200
    d14 = res14.json()
    assert d14["response_type"] == "NO_MATCH"
    assert d14["recommendations"] == []
    assert d14["failing_constraints"] is not None
    assert "budget" in d14["failing_constraints"]
    assert len(d14["quick_actions"]) > 0

    # TEST 15: User: "I want something that doesn't exist." -> honest no-result response
    res15 = client.post("/chat", json={"message": "I want something that doesn't exist under ₹5."})
    assert res15.status_code == 200
    d15 = res15.json()
    assert d15["response_type"] == "NO_MATCH"
    assert d15["recommendations"] == []


def test_expanded_menu_items(client):
    """Verify expanded 50-dish canteen menu and specific inquiries on new dishes."""
    # 1. Check /menu returns all 50 dishes
    res = client.get("/menu")
    assert res.status_code == 200
    menu = res.json()
    assert len(menu) == 50

    # 2. Check newly added items are present
    names = [item["name"] for item in menu]
    new_dishes = [
        "Amritsari Chole Kulche",
        "Mumbai Pav Bhaji",
        "Soya Chaap Tikka Roll",
        "Paneer Butter Masala Rice Bowl",
        "Dal Makhani Rice Bowl",
        "Chicken Curry Rice Bowl",
        "Mysore Masala Dosa",
        "Medu Vada Sambar (2 pcs)",
        "Peri Peri French Fries",
        "Bombay Masala Toast Sandwich",
        "Chilli Garlic Noodles",
        "Peri Peri Maggi",
        "Oreo Chocolate Thick Shake",
        "Kesar Badam Milk (Chilled)",
        "Lemon Iced Tea",
        "Spongy Rasgulla (2 pcs)"
    ]
    for dish in new_dishes:
        assert dish in names, f"{dish} missing from menu"

    # 3. Direct inquiry on newly added Pav Bhaji
    res_pb = client.post("/chat", json={"message": "Do you have pav bhaji?"})
    assert res_pb.status_code == 200
    d_pb = res_pb.json()
    assert "Mumbai Pav Bhaji" in d_pb["reply_text"]
    assert "₹70" in d_pb["reply_text"]

    # 4. Direct inquiry on Chole Kulche
    res_ck = client.post("/chat", json={"message": "Do you have chole kulche?"})
    assert res_ck.status_code == 200
    d_ck = res_ck.json()
    assert "Amritsari Chole Kulche" in d_ck["reply_text"]
    assert "₹65" in d_ck["reply_text"]

    # 5. Direct inquiry on French Fries
    res_ff = client.post("/chat", json={"message": "Do you serve french fries?"})
    assert res_ff.status_code == 200
    d_ff = res_ff.json()
    assert "Peri Peri French Fries" in d_ff["reply_text"]
    assert "₹55" in d_ff["reply_text"]






