import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import init_db, SessionLocal, Food
from schemas import (
    StructuredConstraints, StructuredPreferences, StructuredIntent,
    FoodOut, RecommendationCard
)
from engine import (
    filter_by_availability,
    filter_by_price,
    filter_by_time,
    filter_by_diet,
    filter_by_allergy,
    filter_by_exclusions,
    filter_foods,
    filter_by_multiple_constraints,
    calculate_match_score,
    rank_foods,
    get_top_recommendations,
    calculate_combo_total,
    calculate_nutrition_total,
    diagnose_no_match
)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def all_foods(db_session):
    return db_session.query(Food).all()


# ==================================================
# Phase 22: Unit Tests for Recommendation Engine
# ==================================================

def test_filter_by_availability(all_foods):
    # Temporarily mark one item as unavailable for testing
    foods = list(all_foods)
    foods[0].available = False
    passed, removed = filter_by_availability(foods)
    assert foods[0] not in passed
    assert len(removed) == 1
    assert removed[0][0].item_id == foods[0].item_id
    # Restore
    foods[0].available = True


def test_filter_by_price(all_foods):
    # Test strict filter under ₹50
    passed, removed = filter_by_price(all_foods, max_price=50.0)
    for f in passed:
        assert f.price <= 50.0
    for f, reason in removed:
        assert f.price > 50.0
        assert "exceeds budget" in reason


def test_filter_by_time(all_foods):
    # Test strict prep time filter <= 5 mins
    passed, removed = filter_by_time(all_foods, max_time=5)
    for f in passed:
        assert f.preparation_time <= 5
    for f, reason in removed:
        assert f.preparation_time > 5
        assert "exceeds limit" in reason


def test_filter_by_diet(all_foods):
    # Test vegetarian
    passed_veg, removed_veg = filter_by_diet(all_foods, diets=["vegetarian"])
    for f in passed_veg:
        assert f.vegetarian is True
    for f, reason in removed_veg:
        assert f.vegetarian is False
        assert "Non-vegetarian" in reason

    # Test vegan
    passed_vegan, removed_vegan = filter_by_diet(all_foods, diets=["vegan"])
    for f in passed_vegan:
        assert f.vegan is True

    # Test jain
    passed_jain, removed_jain = filter_by_diet(all_foods, diets=["jain"])
    for f in passed_jain:
        assert f.jain is True


def test_filter_by_allergy(all_foods):
    # Test peanut / nut allergy
    passed, removed = filter_by_allergy(all_foods, allergies=["peanut", "nuts"])
    for f in passed:
        assert f.contains_nuts is False
        assert "peanut" not in f.ingredients.lower()
    # Indori Poha and Brownie must be in removed
    removed_names = [f.name for f, _ in removed]
    assert "Indori Poha" in removed_names
    assert "Chocolate Walnut Brownie" in removed_names


def test_filter_by_exclusions(all_foods):
    # Test exclude noodles
    passed, removed = filter_by_exclusions(all_foods, exclusions=["noodles"])
    for f in passed:
        assert "noodle" not in f.name.lower()
        assert "maggi" not in f.name.lower()
    removed_names = [f.name for f, _ in removed]
    assert "Classic Masala Maggi" in removed_names
    assert "Veg Hakka Noodles" in removed_names


def test_filter_by_multiple_constraints(all_foods):
    # Vegetarian AND under ₹50 AND <= 5 mins
    constraints = StructuredConstraints(
        max_price=50.0,
        max_preparation_time=5,
        diet=["vegetarian"],
        allergies=[],
        exclusions=[]
    )
    passed, removed = filter_by_multiple_constraints(all_foods, constraints)
    assert len(passed) > 0
    for f in passed:
        assert f.price <= 50.0
        assert f.preparation_time <= 5
        assert f.vegetarian is True


def test_calculate_match_score_unspecified_not_penalized(all_foods):
    # Phase 11 invariant: If user only says "I want spicy food", do not penalize for budget, time, or nutrition
    constraints = StructuredConstraints(max_price=None, max_preparation_time=None, diet=[], allergies=[])
    preferences = StructuredPreferences(spicy=True)

    # Find a spicy item
    spicy_item = next(f for f in all_foods if f.spicy)
    score, pct, breakdown, reasons = calculate_match_score(spicy_item, constraints, preferences)

    # Budget, time, and diet should be full 1.0 (no penalty)
    assert breakdown["budget_fit"] == 1.0
    assert breakdown["time_fit"] == 1.0
    assert breakdown["dietary_match"] == 1.0
    assert breakdown["preference_match"] == 1.0
    assert pct >= 90


def test_rank_foods(all_foods):
    constraints = StructuredConstraints(max_price=100.0, max_preparation_time=15)
    preferences = StructuredPreferences(high_protein=True)
    cards = rank_foods(all_foods, constraints, preferences)
    assert len(cards) == len(all_foods)
    # Highest protein cards should be at top
    assert cards[0].item.protein >= cards[-1].item.protein


def test_get_top_recommendations_count(all_foods):
    constraints = StructuredConstraints(max_price=100.0)
    preferences = StructuredPreferences()
    cards = rank_foods(all_foods, constraints, preferences)

    # If 3 or more available, returns exactly 3
    top3 = get_top_recommendations(cards, max_count=3)
    assert len(top3) == 3

    # If only 1 exists, returns 1
    top1 = get_top_recommendations(cards[:1], max_count=3)
    assert len(top1) == 1

    # If 0 exists, returns 0
    top0 = get_top_recommendations([], max_count=3)
    assert len(top0) == 0


def test_calculate_combo_total(all_foods):
    item_a = next(f for f in all_foods if f.name == "Paneer Kathi Roll")
    item_b = next(f for f in all_foods if f.name == "Fresh Lime Soda (Sweet/Salt)")
    totals = calculate_combo_total(item_a, item_b)
    assert totals["total_price"] == round(item_a.price + item_b.price, 2)
    assert totals["max_prep_time"] == max(item_a.preparation_time, item_b.preparation_time)
    assert totals["total_calories"] == round(item_a.calories + item_b.calories, 1)
    assert totals["total_protein"] == round(item_a.protein + item_b.protein, 1)


def test_calculate_nutrition_total(all_foods):
    items = all_foods[:3]
    nut_totals = calculate_nutrition_total(items)
    assert nut_totals["total_protein"] == round(sum(f.protein for f in items), 1)
    assert nut_totals["total_calories"] == round(sum(f.calories for f in items), 1)


def test_diagnose_no_match(all_foods):
    # Under ₹10 with 50g protein (impossible in canteen)
    constraints = StructuredConstraints(max_price=10.0)
    preferences = StructuredPreferences(high_protein=True)

    diagnosis = diagnose_no_match(all_foods, constraints, preferences)
    assert "budget" in diagnosis["failures"]
    assert diagnosis["failures"]["budget"]["lowest_available"] >= 15.0
    assert len(diagnosis["actions"]) > 0
    # Check closest match is provided and labeled
    assert diagnosis["closest_match"] is not None
    assert diagnosis["closest_match"].item.price >= 15.0
