import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from database import init_db, SessionLocal, Food
from seed_data import seed_database


@pytest.fixture(scope="module")
def client():
    init_db()
    seed_database()
    with TestClient(app) as c:
        yield c


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


def test_chat_edge_case_no_budget(client):
    # User message with no budget specified on initial turn
    res = client.post("/chat", json={"message": "I want something spicy and tasty"})
    assert res.status_code == 200
    data = res.json()
    assert data["is_clarification"] is True
    assert data["clarification_type"] == "missing_budget"
    assert "budget" in data["reply_text"].lower()


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
    assert data["intent"] == "greeting"
    assert "BiteBuddy" in data["reply_text"]
    assert len(data["suggested_followups"]) > 0

    # 2. Nutrition inquiry: highest protein
    res2 = client.post("/chat", json={"message": "What has the highest protein?"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["intent"] == "nutrition_inquiry"
    assert "protein" in data2["reply_text"].lower()
    assert len(data2["matched_items"]) > 0
    assert len(data2["suggested_followups"]) > 0

    # 3. Menu inquiry: cheapest item
    res3 = client.post("/chat", json={"message": "What is the cheapest item?"})
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["intent"] == "menu_inquiry"
    assert len(data3["matched_items"]) > 0

    # 4. Menu inquiry: dishes with paneer
    res4 = client.post("/chat", json={"message": "What dishes have paneer?"})
    assert res4.status_code == 200
    data4 = res4.json()
    assert data4["intent"] == "menu_inquiry"
    assert any("paneer" in item["name"].lower() for item in data4["matched_items"])



