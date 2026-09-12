import os
import sys
import asyncio
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from canteen_db import init_canteen_db, get_all_menu_items, MenuItem, SessionLocal
from canteen_engine import (
    classify_intent,
    handle_canteen_qa,
    handle_canteen_recommendation,
    handle_canteen_chat,
    cosine_similarity,
    extract_constraints
)
import groq_service


@pytest.fixture(scope="module")
def client():
    init_canteen_db()
    with TestClient(app) as c:
        yield c


# -------------------------------------------------------------------------
# 1. Data Layer Tests
# -------------------------------------------------------------------------

def test_database_seeding_and_schema():
    init_canteen_db()
    items = get_all_menu_items()
    # Must have >= 20 items per spec
    assert len(items) >= 20

    # Verify each item has required schema fields
    required_fields = [
        "id", "name", "price", "cuisine_tags", "dietary_tags",
        "available_time", "popularity_score", "ingredients", "description"
    ]
    for item in items:
        for f in required_fields:
            assert f in item, f"Missing {f} in item {item.get('name')}"
        assert isinstance(item["cuisine_tags"], list)
        assert isinstance(item["dietary_tags"], list)
        assert isinstance(item["ingredients"], list)
        assert item["price"] > 0

    # Verify mix of cuisines: Indian, Chinese, Snacks, Beverages
    cuisines = {c.lower() for item in items for c in item["cuisine_tags"]}
    assert "indian" in cuisines
    assert "chinese" in cuisines
    assert "snack" in cuisines or "street food" in cuisines


# -------------------------------------------------------------------------
# 2. Intent Classification Tests
# -------------------------------------------------------------------------

def test_intent_classification():
    async def run():
        # Factual questions
        q1 = await classify_intent("what's under ₹50 and veg?")
        assert q1 == "question"

        q2 = await classify_intent("is the fried rice spicy?")
        assert q2 == "question"

        q3 = await classify_intent("how much does masala dosa cost?")
        assert q3 == "question"

        # Recommendation requests
        r1 = await classify_intent("I want something light and not too expensive")
        assert r1 == "recommendation_request"

        r2 = await classify_intent("recommend a healthy breakfast")
        assert r2 == "recommendation_request"

        r3 = await classify_intent("suggest something sweet to drink")
        assert r3 == "recommendation_request"

    asyncio.run(run())


# -------------------------------------------------------------------------
# 3. Factual Q&A Handler Tests
# -------------------------------------------------------------------------

def test_qa_structured_budget_and_veg():
    async def run():
        res = await handle_canteen_qa("what's under ₹50 and veg?")
        assert res["intent"] == "question"
        assert res["count"] > 0
        for item in res["matched_items"]:
            assert item["price"] <= 50.0
            assert "veg" in [t.lower() for t in item["dietary_tags"]]

    asyncio.run(run())


def test_qa_specific_dish_fried_rice():
    async def run():
        res = await handle_canteen_qa("is the fried rice spicy?")
        assert res["intent"] == "question"
        assert res["count"] >= 1
        matched_names = [i["name"] for i in res["matched_items"]]
        assert "Veg Fried Rice" in matched_names

        # Grounded answer contains information about mild spice
        reply = res["reply_text"].lower()
        assert "mild" in reply or "not overly spicy" in reply
        assert "70" in reply or "veg" in reply

    asyncio.run(run())


def test_qa_unlisted_dish_never_hallucinates():
    async def run():
        res = await handle_canteen_qa("do you have sushi or pepperoni pizza?")
        assert res["intent"] == "question"
        assert res["count"] == 0
        assert "not available on our canteen menu" in res["reply_text"].lower()

    asyncio.run(run())


# -------------------------------------------------------------------------
# 4. Content-Based Cosine Recommendation Tests
# -------------------------------------------------------------------------

def test_recommendation_cosine_similarity():
    async def run():
        res = await handle_canteen_recommendation("I want something light and not too expensive")
        assert res["intent"] == "recommendation_request"
        # Must return top 3 matches
        assert len(res["matched_items"]) == 3

        # Price of items should fit the "not too expensive" budget (<= 60)
        for item in res["matched_items"]:
            assert item["price"] <= 60.0

        # Explanation text must be present and mention the top item
        top_item = res["matched_items"][0]
        assert top_item["name"].lower() in res["reply_text"].lower()

    asyncio.run(run())


def test_recommendation_spicy_constraint():
    async def run():
        res = await handle_canteen_recommendation("suggest something spicy to eat under 100")
        assert res["intent"] == "recommendation_request"
        assert len(res["matched_items"]) <= 3
        # Should contain spicy or medium items
        for item in res["matched_items"]:
            assert item["price"] <= 100.0
            assert item.get("spice_level") in ["spicy", "medium"]

    asyncio.run(run())


def test_cosine_similarity_math():
    # Identical vectors -> 1.0
    assert pytest.approx(cosine_similarity([1.0, 2.0], [1.0, 2.0])) == 1.0
    # Orthogonal vectors -> 0.0
    assert pytest.approx(cosine_similarity([1.0, 0.0], [0.0, 1.0])) == 0.0
    # Zero vector -> 0.0
    assert cosine_similarity([0.0, 0.0], [1.0, 2.0]) == 0.0


# -------------------------------------------------------------------------
# 5. Full End-to-End Chat & API Endpoint Tests
# -------------------------------------------------------------------------

def test_canteen_chat_endpoint_qa(client):
    res = client.post("/api/canteen/chat", json={"message": "what's under ₹50 and veg?"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "question"
    assert len(data["matched_items"]) > 0
    assert "reply_text" in data


def test_canteen_chat_endpoint_recommendation(client):
    res = client.post("/api/canteen/chat", json={"message": "I want something light and not too expensive"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "recommendation_request"
    assert len(data["matched_items"]) == 3
    assert "reply_text" in data


def test_canteen_menu_endpoint(client):
    res = client.get("/api/canteen/menu?max_price=50&diet=veg")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    for it in data:
        assert it["price"] <= 50
        assert "veg" in [t.lower() for t in it["dietary_tags"]]


def test_canteen_intent_endpoint(client):
    res = client.post("/api/canteen/intent", json={"message": "recommend food for dinner"})
    assert res.status_code == 200
    assert res.json()["intent"] == "recommendation_request"

