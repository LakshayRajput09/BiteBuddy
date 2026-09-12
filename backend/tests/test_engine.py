import os
import sys
import pytest

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import Food, init_db, SessionLocal
from seed_data import seed_database
from schemas import PreferenceQuery
from engine import (
    apply_hard_filters,
    calculate_score,
    generate_recommendations,
    check_conflicts,
    find_meal_combination
)


@pytest.fixture(scope="module")
def db_session():
    init_db()
    seed_database()
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture(scope="module")
def all_foods(db_session):
    return db_session.query(Food).all()


def test_budget_filtering(all_foods):
    """Ensure hard constraint: price <= budget."""
    query = PreferenceQuery(budget=50.0)
    filtered, _ = apply_hard_filters(all_foods, query)
    assert len(filtered) > 0
    for item in filtered:
        assert item.price <= 50.0, f"Item {item.name} costs {item.price} which exceeds budget 50.0"

    result = generate_recommendations(all_foods, query)
    assert result.top_pick is not None
    assert result.top_pick.item.price <= 50.0
    for alt in result.alternatives:
        assert alt.item.price <= 50.0


def test_dietary_filtering_vegetarian(all_foods):
    """Ensure hard constraint: vegetarian only returns vegetarian=True items."""
    query = PreferenceQuery(diet="vegetarian")
    filtered, _ = apply_hard_filters(all_foods, query)
    for item in filtered:
        assert item.vegetarian is True, f"Non-veg item {item.name} found in vegetarian filter"

    result = generate_recommendations(all_foods, query)
    assert result.top_pick.item.vegetarian is True
    for alt in result.alternatives:
        assert alt.item.vegetarian is True


def test_dietary_filtering_vegan(all_foods):
    """Ensure hard constraint: vegan only returns vegan=True items."""
    query = PreferenceQuery(diet="vegan")
    filtered, _ = apply_hard_filters(all_foods, query)
    assert len(filtered) > 0
    for item in filtered:
        assert item.vegan is True, f"Non-vegan item {item.name} found in vegan filter"
        # Verify no dairy ingredients
        ing_lower = item.ingredients.lower()
        for dairy in ["paneer", "cheese", "milk", "butter", "ghee", "curd"]:
            assert dairy not in ing_lower, f"Found {dairy} in vegan item {item.name}"


def test_dietary_filtering_jain(all_foods):
    """Ensure hard constraint: jain returns jain=True items without root vegetables."""
    query = PreferenceQuery(diet="jain")
    filtered, _ = apply_hard_filters(all_foods, query)
    assert len(filtered) > 0
    for item in filtered:
        assert item.jain is True, f"Non-jain item {item.name} found in jain filter"


def test_time_filtering(all_foods):
    """Ensure hard constraint: preparation_time <= time_limit."""
    query = PreferenceQuery(time_limit=8)
    filtered, _ = apply_hard_filters(all_foods, query)
    assert len(filtered) > 0
    for item in filtered:
        assert item.preparation_time <= 8, f"Item {item.name} prep time {item.preparation_time} > 8 mins"


def test_availability_filtering(all_foods):
    """Ensure unavailable items are never returned in recommendations."""
    # Find an item to test
    target = next(f for f in all_foods if f.available and f.price <= 60)
    original_available = target.available
    try:
        target.available = False
        query = PreferenceQuery(budget=60.0)
        filtered, _ = apply_hard_filters(all_foods, query)
        filtered_ids = [f.item_id for f in filtered]
        assert target.item_id not in filtered_ids

        result = generate_recommendations(all_foods, query)
        assert result.top_pick.item.item_id != target.item_id
        alt_ids = [alt.item.item_id for alt in result.alternatives]
        assert target.item_id not in alt_ids
    finally:
        target.available = original_available


def test_conflicting_requirements_vegan_paneer():
    """Ensure contradiction detection triggers for vegan + paneer."""
    query = PreferenceQuery(diet="vegan", cravings=["paneer"])
    conflict = check_conflicts(query)
    assert conflict is not None
    assert "vegan" in conflict.lower()
    assert "paneer" in conflict.lower()

    # And engine returns structured conflict
    result = generate_recommendations([], query)
    assert result.conflict_detected is not None


def test_conflicting_requirements_negative_budget():
    """Ensure negative budget is rejected."""
    with pytest.raises(ValueError):
        PreferenceQuery(budget=-50.0)


def test_prompt_case_study(all_foods):
    """
    Test case from prompt:
    'Vegetarian, ₹100, spicy, 10 minutes'
    """
    query = PreferenceQuery(
        diet="vegetarian",
        budget=100.0,
        taste=["spicy"],
        time_limit=10
    )
    result = generate_recommendations(all_foods, query)
    assert result.top_pick is not None
    top = result.top_pick.item
    assert top.vegetarian is True
    assert top.price <= 100.0
    assert top.preparation_time <= 10
    assert top.spicy is True or "spicy" in top.tags.lower()

    assert len(result.alternatives) >= 2
    for alt in result.alternatives:
        assert alt.item.vegetarian is True
        assert alt.item.price <= 100.0
        assert alt.item.preparation_time <= 10


def test_combo_pairing_within_budget(all_foods):
    """Ensure combo total price does not exceed budget."""
    query = PreferenceQuery(
        budget=100.0,
        diet="vegetarian",
        time_limit=15
    )
    result = generate_recommendations(all_foods, query)
    if result.combo:
        assert result.combo.total_price <= 100.0
        assert result.combo.main_item.vegetarian is True
        assert result.combo.side_item.vegetarian is True
        assert result.combo.max_prep_time <= 15


def test_low_budget_snack(all_foods):
    """Ensure budget under ₹40 is flagged as snack only."""
    query = PreferenceQuery(budget=25.0)
    result = generate_recommendations(all_foods, query)
    assert result.is_snack_only is True
    assert result.top_pick.item.price <= 25.0


def test_exclusion_filter(all_foods):
    """Ensure exclusions (e.g. 'noodles') remove noodles items."""
    query = PreferenceQuery(exclusions=["noodles"])
    filtered, _ = apply_hard_filters(all_foods, query)
    for item in filtered:
        assert "noodles" not in item.category.lower()
        assert "noodles" not in item.name.lower()

