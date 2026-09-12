import os
import sys
import asyncio
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from database import init_db
from seed_data import seed_database
from schemas import (
    StructuredIntent,
    StructuredConstraints,
    StructuredPreferences,
    RecommendationCard,
    FoodOut,
)
import llm_service


@pytest.fixture(scope="module")
def client():
    init_db()
    seed_database()
    with TestClient(app) as c:
        yield c


def test_llm_status_endpoint(client):
    res = client.get("/api/llm/status")
    assert res.status_code == 200
    data = res.json()
    assert "configured" in data
    assert "gemini_configured" in data
    assert "model" in data
    assert "provider" in data


def test_parse_to_structured_intent_rule_based_fallback():
    async def run_test():
        with patch.dict(os.environ, {}, clear=True):
            intent = await llm_service.parse_to_structured_intent("I want veg lunch under 80 rupees in 10 mins")
            assert intent.llm_provider == "rule_based"
            assert intent.constraints.max_price == 80.0
            assert intent.constraints.max_preparation_time == 10
            assert "vegetarian" in intent.constraints.diet
    asyncio.run(run_test())


def test_parse_to_structured_intent_gemini_success():
    async def run_test():
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{
                        "text": '{"intent": "recommendation", "target_item_name": null, "constraints": {"diet": ["vegetarian"], "allergies": [], "max_price": 90.0, "max_preparation_time": 15, "exclusions": []}, "preferences": {"cuisine": "Indian", "spicy": true, "high_protein": true, "craving": "paneer", "mood": "hungry"}}'
                    }]
                }
            }]
        }

        with patch.dict(os.environ, {"GEMINI_API_KEY": "dummy_test_key"}):
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_response
                intent = await llm_service.parse_to_structured_intent("Spicy paneer under 90 high protein")
                assert "gemini" in intent.llm_provider
                assert intent.intent == "recommendation"
                assert intent.constraints.max_price == 90.0
                assert intent.preferences.spicy is True
                assert intent.preferences.high_protein is True

    asyncio.run(run_test())


def test_parse_to_structured_intent_gemini_api_error_fallback():
    async def run_test():
        with patch.dict(os.environ, {"GEMINI_API_KEY": "dummy_test_key"}):
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                mock_post.side_effect = Exception("API connection timed out")
                intent = await llm_service.parse_to_structured_intent("quick veg snack under 50")
                assert intent.llm_provider == "rule_based"
                assert intent.constraints.max_price == 50.0
                assert "vegetarian" in intent.constraints.diet

    asyncio.run(run_test())


def test_generate_grounded_explanation_fallback():
    async def run_test():
        dummy_item = FoodOut(
            item_id=1,
            name="Paneer Kathi Roll",
            category="Rolls",
            price=80.0,
            ingredients="Paneer, onions, paratha wrap",
            available=True,
            preparation_time=8,
            spicy=False,
            sweet=False,
            cuisine="North Indian",
            calories=350.0,
            protein=14.0,
            carbohydrates=38.0,
            fat=16.0,
            jain=False,
            vegetarian=True,
            vegan=False
        )
        dummy_card = RecommendationCard(
            item=dummy_item,
            score=95.0,
            match_percentage=95,
            reasons=["Fits budget (₹80)", "Within 8 mins"]
        )
        intent = StructuredIntent(
            intent="recommendation",
            constraints=StructuredConstraints(max_price=100.0),
            preferences=StructuredPreferences(spicy=True),
            llm_provider="rule_based"
        )

        with patch.dict(os.environ, {}, clear=True):
            explanation = await llm_service.generate_grounded_explanation([dummy_card], intent)
            assert "Paneer Kathi Roll" in explanation
            assert "₹80" in explanation

    asyncio.run(run_test())


def test_generate_grounded_explanation_gemini_grounding_validation():
    async def run_test():
        dummy_item = FoodOut(
            item_id=1,
            name="Paneer Kathi Roll",
            category="Rolls",
            price=80.0,
            ingredients="Paneer, onions, paratha wrap",
            available=True,
            preparation_time=8,
            spicy=False,
            sweet=False,
            cuisine="North Indian",
            calories=350.0,
            protein=14.0,
            carbohydrates=38.0,
            fat=16.0,
            jain=False,
            vegetarian=True,
            vegan=False
        )
        dummy_card = RecommendationCard(
            item=dummy_item,
            score=95.0,
            match_percentage=95,
            reasons=["Fits budget (₹80)"]
        )
        intent = StructuredIntent(
            intent="recommendation",
            constraints=StructuredConstraints(max_price=100.0),
            preferences=StructuredPreferences(),
            llm_provider="gemini-1.5-flash"
        )

        mock_hallucinated_response = MagicMock()
        mock_hallucinated_response.status_code = 200
        mock_hallucinated_response.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{
                        "text": "I suggest you order some Pizza and Burgers from the other stall!"
                    }]
                }
            }]
        }

        with patch.dict(os.environ, {"GEMINI_API_KEY": "dummy_test_key"}):
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_hallucinated_response
                explanation = await llm_service.generate_grounded_explanation([dummy_card], intent)
                # Grounding validator rejects the hallucinated response and falls back to template
                assert "Paneer Kathi Roll" in explanation

    asyncio.run(run_test())


def test_chat_endpoint_includes_llm_provider(client):
    payload = {"message": "I want something healthy and high protein"}
    res = client.post("/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "debug_info" in data
    assert data["debug_info"] is not None
    assert "llm_provider" in data["debug_info"]
    assert data["debug_info"]["llm_provider"] in ["rule_based", "gemini-1.5-flash"]
