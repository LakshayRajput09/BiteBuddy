from typing import List, Optional, Tuple, Dict, Any
from schemas import (
    PreferenceQuery,
    StructuredConstraints,
    StructuredPreferences,
    FoodOut,
    RecommendationCard,
    MealCombination,
    RecommendationResult
)
from database import Food

# Mood to tags/category mapping for soft scoring
MOOD_KEYWORDS = {
    "tired": ["comfort-food", "gut-friendly", "energy-boost", "comforting", "nostalgic", "homely"],
    "exhausted": ["comfort-food", "gut-friendly", "energy-boost", "comforting"],
    "stressed": ["cooling", "soothing", "exam-calm", "caffeine", "invigorating", "comfort"],
    "exam": ["caffeine", "energy-boost", "exam-calm", "cooling", "light-breakfast"],
    "hungry": ["heavy-meal", "filling", "hearty", "heavy", "indulgent", "protein-rich"],
    "starving": ["heavy-meal", "filling", "hearty", "heavy", "protein-rich"],
    "rushed": ["quick-bite", "grab-and-go", "crispy", "tea-time"],
    "hurried": ["quick-bite", "grab-and-go"],
    "celebrating": ["chef-special", "rich", "indulgent", "sweet-tooth", "cheat-meal"],
    "happy": ["chef-special", "rich", "sweet-tooth", "flavorful"],
    "sick": ["gut-friendly", "light", "steamed", "oil-free", "soothing"],
    "quick bite": ["quick-bite", "grab-and-go", "snack"],
    "comfort food": ["comfort-food", "homely", "comforting", "nostalgic"],
    "healthy": ["healthy", "steamed", "oil-free", "low-calorie", "light"],
    "high protein": ["high-protein", "protein-rich", "protein"],
    "light meal": ["light", "low-calorie", "digestible"],
    "treat myself": ["indulgent", "chef-special", "rich", "sweet-tooth"],
    "energy boost": ["energy-boost", "caffeine", "invigorating"]
}

# Incompatible pairs for contradiction detection
NON_VEGAN_WORDS = ["paneer", "cheese", "curd", "yogurt", "butter", "ghee", "milk", "egg", "chicken", "meat", "custard", "lassi"]
NON_VEG_WORDS = ["chicken", "egg", "meat", "fish", "mutton"]
JAIN_INCOMPATIBLE_WORDS = ["onion", "garlic", "potato", "carrot", "beetroot", "chicken", "egg"]


def check_conflicts(query: PreferenceQuery) -> Optional[str]:
    """
    Detects contradictory constraints in user preferences before querying.
    E.g. 'vegan paneer', 'vegan chicken', 'jain chicken', negative budget.
    """
    if query.budget is not None and query.budget < 0:
        return "Budget cannot be negative. Please provide a valid positive budget."

    if query.time_limit is not None and query.time_limit <= 0:
        return "Preparation time must be a positive number of minutes."

    diet_lower = (query.diet or "").strip().lower()
    cravings_lower = [c.lower() for c in (query.cravings or [])]

    if "vegan" in diet_lower:
        for non_vegan in NON_VEGAN_WORDS:
            if any(non_vegan in c for c in cravings_lower) or non_vegan in diet_lower:
                return (
                    f"Notice: You requested a vegan diet, but '{non_vegan}' contains animal or dairy products. "
                    f"Our canteen makes traditional {non_vegan} with dairy. "
                    f"Would you prefer a 100% plant-based vegan option (like Aloo Corn Roll, Poha, or Veg Hakka Noodles), "
                    f"or a vegetarian {non_vegan} dish?"
                )

    if "jain" in diet_lower:
        for non_jain in ["chicken", "egg", "meat", "onion", "garlic"]:
            if any(non_jain in c for c in cravings_lower):
                return (
                    f"Notice: You requested a Jain diet, but mentioned '{non_jain}'. "
                    f"Jain meals exclude all root vegetables, onions, garlic, and meats. "
                    f"Would you like our Jain Dal Khichdi, Jain Sandwich, or Jain Buttermilk?"
                )

    if "vegetarian" in diet_lower and not ("non-veg" in diet_lower or "non vegetarian" in diet_lower):
        for non_veg in NON_VEG_WORDS:
            if any(non_veg in c for c in cravings_lower):
                return (
                    f"Notice: You specified a vegetarian diet, but also requested '{non_veg}'. "
                    f"Would you like vegetarian recommendations, or would you like to switch to non-vegetarian?"
                )

    return None


# ==================================================
# Phase 4, 5, 8: Modular Hard Filtering Functions
# ==================================================

def filter_by_availability(foods: List[Food]) -> Tuple[List[Food], List[Tuple[Food, str]]]:
    """Hard filter: available == True."""
    passed = []
    removed = []
    for f in foods:
        if f.available:
            passed.append(f)
        else:
            removed.append((f, f"'{f.name}' is currently unavailable/sold out in canteen"))
    return passed, removed


def filter_by_price(foods: List[Food], max_price: Optional[float]) -> Tuple[List[Food], List[Tuple[Food, str]]]:
    """Hard filter: price <= max_price."""
    if max_price is None:
        return list(foods), []
    passed = []
    removed = []
    for f in foods:
        if f.price <= max_price:
            passed.append(f)
        else:
            diff = int(f.price - max_price)
            removed.append((f, f"₹{int(f.price)} exceeds budget of ₹{int(max_price)} (by ₹{diff})"))
    return passed, removed


def filter_by_time(foods: List[Food], max_time: Optional[int]) -> Tuple[List[Food], List[Tuple[Food, str]]]:
    """Hard filter: preparation_time <= max_time."""
    if max_time is None:
        return list(foods), []
    passed = []
    removed = []
    for f in foods:
        if f.preparation_time <= max_time:
            passed.append(f)
        else:
            diff = f.preparation_time - max_time
            removed.append((f, f"Prep time {f.preparation_time}m exceeds limit of {max_time}m (by {diff}m)"))
    return passed, removed


def filter_by_diet(foods: List[Food], diets: List[str]) -> Tuple[List[Food], List[Tuple[Food, str]]]:
    """Hard filter: strict diet compliance."""
    if not diets:
        return list(foods), []
    diets_clean = [d.strip().lower() for d in diets if d.strip()]
    if not diets_clean:
        return list(foods), []

    wants_vegan = any(d in ["vegan", "plant-based"] for d in diets_clean)
    wants_jain = any(d == "jain" for d in diets_clean)
    wants_veg = any(d in ["vegetarian", "veg", "pure veg"] for d in diets_clean) and not any(d in ["non-veg", "non-vegetarian"] for d in diets_clean)
    wants_non_veg = any(d in ["non-veg", "non-vegetarian"] for d in diets_clean)

    passed = []
    removed = []
    for f in foods:
        if wants_vegan and not f.vegan:
            removed.append((f, "Not 100% plant-based / vegan (contains dairy or animal products)"))
            continue
        if wants_jain and not f.jain:
            removed.append((f, "Not Jain compliant (contains root vegetables, onion, or garlic)"))
            continue
        if wants_veg and not f.vegetarian:
            removed.append((f, "Non-vegetarian dish excluded for vegetarian diet"))
            continue
        passed.append(f)
    return passed, removed


def filter_by_allergy(foods: List[Food], allergies: List[str]) -> Tuple[List[Food], List[Tuple[Food, str]]]:
    """Hard filter: strict allergy exclusions based on DB flags and ingredients."""
    if not allergies:
        return list(foods), []
    allergies_clean = [a.strip().lower() for a in allergies if a.strip()]
    if not allergies_clean:
        return list(foods), []

    passed = []
    removed = []
    for f in foods:
        f_text = f"{f.name} {f.ingredients} {f.category} {f.tags}".lower()
        has_allergy = False
        allergy_reason = ""

        for a in allergies_clean:
            # Nut / Peanut allergy
            if any(n in a for n in ["nut", "peanut", "groundnut", "walnut", "cashew", "almond", "pistachio"]):
                if f.contains_nuts or any(n in f_text for n in ["peanut", "peanuts", "groundnut", "walnut", "cashew", "almond", "pistachio"]):
                    has_allergy = True
                    allergy_reason = f"Contains nuts/peanuts (allergy exclusion for '{a}')"
                    break
            # Dairy / Lactose allergy
            elif any(d in a for d in ["dairy", "milk", "lactose", "cheese", "paneer"]):
                if f.contains_dairy or any(d in f_text for d in ["milk", "cheese", "paneer", "butter", "ghee", "curd", "yogurt", "cream"]):
                    has_allergy = True
                    allergy_reason = f"Contains dairy (allergy exclusion for '{a}')"
                    break
            # Gluten / Wheat allergy
            elif any(g in a for g in ["gluten", "wheat", "maida"]):
                if f.contains_gluten or any(g in f_text for g in ["wheat", "maida", "gluten", "bread", "pav", "roti"]):
                    has_allergy = True
                    allergy_reason = f"Contains gluten/wheat (allergy exclusion for '{a}')"
                    break
            # Egg allergy
            elif "egg" in a:
                if f.contains_egg or "egg" in f_text:
                    has_allergy = True
                    allergy_reason = f"Contains egg (allergy exclusion for '{a}')"
                    break
            elif a in f_text:
                has_allergy = True
                allergy_reason = f"Contains '{a}' (allergen exclusion)"
                break

        if has_allergy:
            removed.append((f, allergy_reason))
        else:
            passed.append(f)
    return passed, removed


def filter_by_exclusions(foods: List[Food], exclusions: List[str]) -> Tuple[List[Food], List[Tuple[Food, str]]]:
    """Hard filter: explicitly excluded ingredients or dishes."""
    if not exclusions:
        return list(foods), []
    excl_clean = [e.strip().lower() for e in exclusions if e.strip()]
    if not excl_clean:
        return list(foods), []

    passed = []
    removed = []
    for f in foods:
        f_text = f"{f.name} {f.ingredients} {f.category} {f.tags}".lower()
        excluded = False
        excl_reason = ""
        for e in excl_clean:
            if e in ["dairy", "no dairy"]:
                if f.contains_dairy:
                    excluded = True
                    excl_reason = "Contains dairy (explicitly excluded)"
                    break
            elif e in ["gluten", "no gluten"]:
                if f.contains_gluten:
                    excluded = True
                    excl_reason = "Contains gluten (explicitly excluded)"
                    break
            elif e in ["egg", "no egg", "eggless"]:
                if f.contains_egg:
                    excluded = True
                    excl_reason = "Contains egg (explicitly excluded)"
                    break
            elif e in ["nuts", "no nuts"]:
                if f.contains_nuts:
                    excluded = True
                    excl_reason = "Contains nuts (explicitly excluded)"
                    break
            elif e in f_text:
                excluded = True
                excl_reason = f"Contains '{e}' (explicitly excluded)"
                break

        if excluded:
            removed.append((f, excl_reason))
        else:
            passed.append(f)
    return passed, removed


def filter_foods(foods: List[Food], constraints: StructuredConstraints) -> Tuple[List[Food], List[Dict[str, Any]]]:
    """
    Combined deterministic hard filter pipeline:
    Availability -> Budget -> Time -> Diet -> Allergies -> Exclusions.
    Returns (surviving_foods, removed_log)
    """
    all_removed = []

    # 1. Availability
    avail_passed, avail_removed = filter_by_availability(foods)
    for f, r in avail_removed:
        all_removed.append({
            "item_id": f.item_id,
            "name": f.name,
            "price": f.price,
            "preparation_time": f.preparation_time,
            "reason": r
        })

    # 2. Price
    price_passed, price_removed = filter_by_price(avail_passed, constraints.max_price)
    for f, r in price_removed:
        all_removed.append({
            "item_id": f.item_id,
            "name": f.name,
            "price": f.price,
            "preparation_time": f.preparation_time,
            "reason": r
        })

    # 3. Preparation Time
    time_passed, time_removed = filter_by_time(price_passed, constraints.max_preparation_time)
    for f, r in time_removed:
        all_removed.append({
            "item_id": f.item_id,
            "name": f.name,
            "price": f.price,
            "preparation_time": f.preparation_time,
            "reason": r
        })

    # 4. Diet
    diet_passed, diet_removed = filter_by_diet(time_passed, constraints.diet)
    for f, r in diet_removed:
        all_removed.append({
            "item_id": f.item_id,
            "name": f.name,
            "price": f.price,
            "preparation_time": f.preparation_time,
            "reason": r
        })

    # 5. Allergies
    allergy_passed, allergy_removed = filter_by_allergy(diet_passed, constraints.allergies)
    for f, r in allergy_removed:
        all_removed.append({
            "item_id": f.item_id,
            "name": f.name,
            "price": f.price,
            "preparation_time": f.preparation_time,
            "reason": r
        })

    # 6. Exclusions
    surviving, excl_removed = filter_by_exclusions(allergy_passed, constraints.exclusions)
    for f, r in excl_removed:
        all_removed.append({
            "item_id": f.item_id,
            "name": f.name,
            "price": f.price,
            "preparation_time": f.preparation_time,
            "reason": r
        })

    return surviving, all_removed


def filter_by_multiple_constraints(foods: List[Food], constraints: StructuredConstraints) -> Tuple[List[Food], List[Dict[str, Any]]]:
    """Alias for Phase 22 test suite."""
    return filter_foods(foods, constraints)


def apply_hard_filters(foods: List[Food], query: PreferenceQuery) -> Tuple[List[Food], List[str]]:
    """Backward compatibility wrapper for PreferenceQuery."""
    diets = [query.diet] if query.diet and query.diet != "any" else []
    constraints = StructuredConstraints(
        max_price=query.budget,
        max_preparation_time=query.time_limit,
        diet=diets,
        allergies=[],
        exclusions=query.exclusions or []
    )
    surviving, removed = filter_foods(foods, constraints)
    return surviving, [r["reason"] for r in removed]


# ==================================================
# Phase 11, 17: Deterministic Scoring & Ranking
# ==================================================

def calculate_match_score(
    item: Food,
    constraints: StructuredConstraints,
    preferences: StructuredPreferences
) -> Tuple[float, int, Dict[str, float], List[str]]:
    """
    Deterministic scoring:
    Preference match: 30%
    Budget fit: 20%
    Diet match: 20%
    Time fit: 15%
    Nutrition: 10%
    Craving/mood: 5%

    IMPORTANT RULE: If a user does not specify a category, do not penalize the food!
    """
    reasons = []

    # 1. Preference Match (Taste & Cuisine) - 30%
    pref_score = 1.0  # default unpenalized
    if preferences.spicy is True:
        if item.spicy:
            pref_score = 1.0
            reasons.append("🌶️ Spicy kick matching your preference")
        else:
            pref_score = 0.3
    elif preferences.spicy is False:
        if not item.spicy:
            pref_score = 1.0
            reasons.append("🌿 Mild, non-spicy preparation")
        else:
            pref_score = 0.3

    if preferences.sweet is True:
        if item.sweet:
            pref_score = min(1.0, pref_score + 0.3)
            reasons.append("🍯 Sweet treat matching your craving")
        elif preferences.spicy is None:
            pref_score = 0.3

    if preferences.cuisine:
        if preferences.cuisine.lower() in item.cuisine.lower():
            pref_score = min(1.0, pref_score + 0.2)
            reasons.append(f"🍛 Authentic {item.cuisine} cuisine")

    # 2. Budget Fit - 20%
    if constraints.max_price is not None and constraints.max_price > 0:
        ratio = item.price / constraints.max_price
        if 0.50 <= ratio <= 0.85:
            budget_score = 1.0
            remaining = int(constraints.max_price - item.price)
            reasons.append(f"💰 ₹{int(item.price)} fits within ₹{int(constraints.max_price)} (₹{remaining} leftover)")
        elif ratio < 0.50:
            budget_score = 0.85
            remaining = int(constraints.max_price - item.price)
            reasons.append(f"💰 Great value at ₹{int(item.price)} (₹{remaining} leftover)")
        else:
            budget_score = 0.75
            reasons.append(f"💰 Exactly within your ₹{int(constraints.max_price)} budget at ₹{int(item.price)}")
    else:
        # Not specified -> NO PENALTY
        budget_score = 1.0
        reasons.append(f"💰 ₹{int(item.price)}")

    # 3. Diet Match - 20%
    if constraints.diet:
        diet_clean = [d.lower() for d in constraints.diet]
        if "vegan" in diet_clean:
            diet_score = 1.0
            reasons.append("🌿 100% Plant-Based / Vegan certified")
        elif "jain" in diet_clean:
            diet_score = 1.0
            reasons.append("🕊️ Strict Jain friendly")
        elif any(d in ["vegetarian", "veg"] for d in diet_clean):
            diet_score = 1.0
            reasons.append("🌱 100% Vegetarian verified")
        elif any(d in ["non-veg", "non-vegetarian"] for d in diet_clean):
            if not item.vegetarian:
                diet_score = 1.0
                reasons.append("🍗 Non-vegetarian meal")
            else:
                diet_score = 0.7
                reasons.append("🌱 Vegetarian option")
        else:
            diet_score = 1.0
    else:
        # Not specified -> NO PENALTY
        diet_score = 1.0

    # 4. Time Fit - 15%
    if constraints.max_preparation_time is not None and constraints.max_preparation_time > 0:
        ratio = item.preparation_time / constraints.max_preparation_time
        time_score = max(0.5, 1.0 - ratio * 0.3)
        reasons.append(f"⏱️ Ready in {item.preparation_time} mins (within {constraints.max_preparation_time}m)")
    else:
        # Not specified -> NO PENALTY
        time_score = 1.0
        reasons.append(f"⏱️ Prep: {item.preparation_time} mins")

    # 5. Nutrition Goal Match - 10%
    has_nutrition_goal = preferences.high_protein or preferences.low_calorie
    if has_nutrition_goal:
        if preferences.high_protein:
            if item.protein >= 20.0:
                nutrition_score = 1.0
                reasons.append(f"💪 High protein: {int(item.protein)}g")
            elif item.protein >= 12.0:
                nutrition_score = 0.85
                reasons.append(f"💪 Good protein: {int(item.protein)}g")
            else:
                nutrition_score = 0.4
        elif preferences.low_calorie:
            if item.calories <= 300:
                nutrition_score = 1.0
                reasons.append(f"🥗 Light calorie: {int(item.calories)} kcal")
            elif item.calories <= 450:
                nutrition_score = 0.8
            else:
                nutrition_score = 0.4
        else:
            nutrition_score = 1.0
    else:
        # Not specified -> NO PENALTY
        nutrition_score = 1.0

    # 6. Craving / Mood Match - 5%
    has_mood_or_craving = bool(preferences.mood or preferences.craving)
    mood_clean = (preferences.mood or "").lower().strip()
    craving_clean = (preferences.craving or "").lower().strip()
    item_desc = f"{item.name} {item.ingredients} {item.category} {item.tags}".lower()

    if has_mood_or_craving:
        mood_score = 0.5
        if mood_clean:
            matched_tags = MOOD_KEYWORDS.get(mood_clean, [])
            if any(t in item_desc for t in matched_tags):
                mood_score = 1.0
                reasons.append(f"✨ Comforting match when feeling {mood_clean}")
        if craving_clean and craving_clean in item_desc:
            mood_score = 1.0
            reasons.append(f"🎯 Matches craving for '{craving_clean}'")
    else:
        # Not specified -> NO PENALTY
        mood_score = 1.0

    # Weighted calculation
    total_score = (
        pref_score * 0.30
        + budget_score * 0.20
        + diet_score * 0.20
        + time_score * 0.15
        + nutrition_score * 0.10
        + mood_score * 0.05
    )
    total_score = max(0.0, min(1.0, total_score))
    match_percentage = int(round(total_score * 100))

    breakdown = {
        "preference_match": round(pref_score, 2),
        "budget_fit": round(budget_score, 2),
        "dietary_match": round(diet_score, 2),
        "time_fit": round(time_score, 2),
        "nutrition_match": round(nutrition_score, 2),
        "mood_craving_match": round(mood_score, 2),
    }

    return total_score, match_percentage, breakdown, reasons


def calculate_score(item: Food, query: PreferenceQuery) -> Tuple[float, Dict[str, float], List[str]]:
    """Backward compatibility wrapper for PreferenceQuery scoring."""
    diets = [query.diet] if query.diet and query.diet != "any" else []
    constraints = StructuredConstraints(
        max_price=query.budget,
        max_preparation_time=query.time_limit,
        diet=diets,
        allergies=[],
        exclusions=query.exclusions or []
    )
    tastes = [t.lower() for t in (query.taste or [])]
    preferences = StructuredPreferences(
        spicy=True if "spicy" in tastes else (False if "mild" in tastes else None),
        sweet=True if "sweet" in tastes else None,
        high_protein=True if (query.protein_goal and "high" in query.protein_goal.lower()) else None,
        cuisine=query.cuisine,
        mood=query.mood,
        craving=query.cravings[0] if query.cravings else None
    )
    score, _, breakdown, reasons = calculate_match_score(item, constraints, preferences)
    return score, breakdown, reasons


def rank_foods(
    foods: List[Food],
    constraints: StructuredConstraints,
    preferences: StructuredPreferences
) -> List[RecommendationCard]:
    """Scores and ranks foods strictly descending by match score."""
    cards = []
    for f in foods:
        score, pct, breakdown, reasons = calculate_match_score(f, constraints, preferences)
        card = RecommendationCard(
            item=FoodOut.model_validate(f),
            score=round(score, 3),
            match_percentage=pct,
            reasons=reasons,
            score_breakdown=breakdown
        )
        cards.append(card)

    if preferences.high_protein:
        cards.sort(key=lambda c: (c.score, c.item.protein), reverse=True)
    else:
        cards.sort(key=lambda c: c.score, reverse=True)
    return cards


# ==================================================
# Phase 12: Recommendation Count (Strictly <= 3)
# ==================================================

def get_top_recommendations(
    scored_cards: List[RecommendationCard],
    max_count: int = 3
) -> List[RecommendationCard]:
    """
    Phase 12: Return maximum 3 recommendations.
    If 1 valid food exists: Return 1.
    If 2 valid foods exist: Return 2.
    If zero valid foods exist: Return zero recommendations.
    NEVER manufacture additional recommendations.
    """
    return scored_cards[:max_count]


# ==================================================
# Phase 22, 25: Calculation & Combos
# ==================================================

def calculate_combo_total(main_item: Food, side_item: Food) -> Dict[str, float]:
    """Calculates cumulative price, time, and macros for a combo."""
    return {
        "total_price": round(main_item.price + side_item.price, 2),
        "max_prep_time": max(main_item.preparation_time, side_item.preparation_time),
        "total_calories": round((main_item.calories or 0.0) + (side_item.calories or 0.0), 1),
        "total_protein": round((main_item.protein or 0.0) + (side_item.protein or 0.0), 1),
        "total_carbs": round((main_item.carbohydrates or 0.0) + (side_item.carbohydrates or 0.0), 1),
        "total_fat": round((main_item.fat or 0.0) + (side_item.fat or 0.0), 1),
    }


def calculate_nutrition_total(items: List[Food]) -> Dict[str, float]:
    """Calculates sum of macros for a list of foods."""
    return {
        "total_calories": round(sum(f.calories or 0.0 for f in items), 1),
        "total_protein": round(sum(f.protein or 0.0 for f in items), 1),
        "total_carbs": round(sum(f.carbohydrates or 0.0 for f in items), 1),
        "total_fat": round(sum(f.fat or 0.0 for f in items), 1),
    }


def find_meal_combination(
    top_item: Food,
    available_foods: List[Food],
    query: PreferenceQuery
) -> Optional[MealCombination]:
    """Deterministic combo calculation using PreferenceQuery."""
    if query.budget is None:
        remaining_budget = 40.0
    else:
        remaining_budget = query.budget - top_item.price

    if remaining_budget < 15.0:
        return None

    diet_clean = (query.diet or "").strip().lower()
    exclusions_clean = [e.strip().lower() for e in (query.exclusions or []) if e.strip()]

    compatible_sides = []
    for side in available_foods:
        if side.item_id == top_item.item_id:
            continue
        if side.category not in ["Beverages", "Sweets", "Snacks"]:
            continue
        if side.price > remaining_budget:
            continue
        if query.time_limit is not None and side.preparation_time > query.time_limit:
            continue
        if not side.available:
            continue

        if diet_clean == "vegan" and not side.vegan:
            continue
        if diet_clean == "jain" and not side.jain:
            continue
        if diet_clean in ["vegetarian", "veg"] and not side.vegetarian:
            continue

        side_text = f"{side.name} {side.category} {side.ingredients}".lower()
        if any(ex in side_text for ex in exclusions_clean):
            continue

        compatible_sides.append(side)

    if not compatible_sides:
        return None

    def side_priority(s: Food):
        score = 0.0
        if top_item.category in ["Roll", "Rice", "Noodles", "Snacks", "Chinese"]:
            if s.category == "Beverages":
                score += 15.0
                if "lime" in s.name.lower() or "soda" in s.name.lower():
                    score += 5.0
            elif s.category == "Sweets":
                score += 5.0
        score -= (remaining_budget - s.price) * 0.05
        return score

    compatible_sides.sort(key=side_priority, reverse=True)
    best_side = compatible_sides[0]

    totals = calculate_combo_total(top_item, best_side)
    leftover = (query.budget - totals["total_price"]) if query.budget else 0.0

    return MealCombination(
        main_item=FoodOut.model_validate(top_item),
        side_item=FoodOut.model_validate(best_side),
        total_price=totals["total_price"],
        max_prep_time=totals["max_prep_time"],
        budget_remaining=max(0.0, leftover),
        description=f"{top_item.name} + {best_side.name}",
        total_calories=totals["total_calories"],
        total_protein=totals["total_protein"],
        total_carbs=totals["total_carbs"],
        total_fat=totals["total_fat"]
    )


# ==================================================
# Phase 13, 14: Strict No-Match Diagnosis & Closest Match
# ==================================================

def diagnose_no_match(
    all_foods: List[Food],
    constraints: StructuredConstraints,
    preferences: StructuredPreferences
) -> Dict[str, Any]:
    """
    Identifies failing constraints when 0 items survive filtering.
    Finds closest available match that violates constraints by the smallest margin.
    Generates interactive action suggestions: [Increase Budget], [Increase Time], [Show Closest Match].
    """
    available_foods = [f for f in all_foods if f.available]
    failures = {}

    # Check budget
    if constraints.max_price is not None:
        min_price = min((f.price for f in available_foods), default=0.0)
        if constraints.max_price < min_price:
            failures["budget"] = {
                "user_budget": constraints.max_price,
                "lowest_available": min_price,
                "difference": round(min_price - constraints.max_price, 2)
            }

    # Check time
    if constraints.max_preparation_time is not None:
        min_time = min((f.preparation_time for f in available_foods), default=0)
        if constraints.max_preparation_time < min_time:
            failures["time"] = {
                "user_time": constraints.max_preparation_time,
                "fastest_available": min_time,
                "difference": min_time - constraints.max_preparation_time
            }

    # Check diet
    if constraints.diet:
        diet_matches, _ = filter_by_diet(available_foods, constraints.diet)
        if not diet_matches:
            failures["diet"] = {
                "user_diet": constraints.diet,
                "message": f"No dishes in canteen match diet: {', '.join(constraints.diet)}"
            }

    # Check protein
    if preferences.high_protein:
        max_protein = max((f.protein for f in available_foods), default=0.0)
        failures["protein"] = {
            "requested": "high protein",
            "highest_available": max_protein
        }

    # Find closest match
    # Safety first: closest match MUST still respect diet and allergies
    safe_candidates, _ = filter_by_allergy(available_foods, constraints.allergies)
    safe_candidates, _ = filter_by_diet(safe_candidates, constraints.diet)
    safe_candidates, _ = filter_by_exclusions(safe_candidates, constraints.exclusions)

    closest_card = None
    if safe_candidates:
        def penalty(f: Food) -> float:
            p = 0.0
            if constraints.max_price is not None and f.price > constraints.max_price:
                p += (f.price - constraints.max_price) * 1.5
            if constraints.max_preparation_time is not None and f.preparation_time > constraints.max_preparation_time:
                p += (f.preparation_time - constraints.max_preparation_time) * 3.0
            return p

        safe_candidates.sort(key=penalty)
        best_candidate = safe_candidates[0]
        reasons = []
        if constraints.max_price is not None and best_candidate.price > constraints.max_price:
            diff = int(best_candidate.price - constraints.max_price)
            reasons.append(f"⚠️ ₹{diff} over your ₹{int(constraints.max_price)} budget")
        if constraints.max_preparation_time is not None and best_candidate.preparation_time > constraints.max_preparation_time:
            diff = best_candidate.preparation_time - constraints.max_preparation_time
            reasons.append(f"⚠️ Takes {diff} mins longer than your {constraints.max_preparation_time}m limit")
        reasons.append(f"₹{int(best_candidate.price)} • {best_candidate.preparation_time} mins")

        closest_card = RecommendationCard(
            item=FoodOut.model_validate(best_candidate),
            score=0.5,
            match_percentage=50,
            reasons=reasons,
            score_breakdown={"closest_match": 1.0}
        )

    # Action suggestions
    actions = []
    if "budget" in failures:
        suggested_b = failures["budget"]["lowest_available"]
        actions.append(f"Increase budget to ₹{int(suggested_b)}")
    elif constraints.max_price is not None:
        actions.append(f"Increase budget to ₹{int(constraints.max_price + 30)}")

    if "time" in failures:
        suggested_t = failures["time"]["fastest_available"]
        actions.append(f"Increase time to {suggested_t} mins")
    elif constraints.max_preparation_time is not None:
        actions.append(f"Increase time to {constraints.max_preparation_time + 5} mins")

    if closest_card:
        actions.append(f"Show closest match ({closest_card.item.name})")

    return {
        "failures": failures,
        "closest_match": closest_card,
        "actions": actions
    }


# ==================================================
# Recommendation Pipeline
# ==================================================

def generate_recommendations(
    foods: List[Food],
    query: PreferenceQuery
) -> RecommendationResult:
    """
    Main recommendation pipeline:
    1. Check for contradictions/conflicts
    2. Filter hard constraints
    3. Score and rank items
    4. Return Top 3 (1 if 1, 2 if 2, 0 if 0)
    5. Find combo pairing
    6. Return structured result
    """
    conflict_msg = check_conflicts(query)
    if conflict_msg:
        return RecommendationResult(
            explanation=conflict_msg,
            conflict_detected=conflict_msg
        )

    diets = [query.diet] if query.diet and query.diet != "any" else []
    constraints = StructuredConstraints(
        max_price=query.budget,
        max_preparation_time=query.time_limit,
        diet=diets,
        allergies=[],
        exclusions=query.exclusions or []
    )
    tastes = [t.lower() for t in (query.taste or [])]
    preferences = StructuredPreferences(
        spicy=True if "spicy" in tastes else (False if "mild" in tastes else None),
        sweet=True if "sweet" in tastes else None,
        high_protein=True if (query.protein_goal and "high" in query.protein_goal.lower()) else None,
        cuisine=query.cuisine,
        mood=query.mood,
        craving=query.cravings[0] if query.cravings else None
    )

    filtered_items, _ = filter_foods(foods, constraints)

    # If no items match hard constraints
    if not filtered_items:
        diagnosis = diagnose_no_match(foods, constraints, preferences)
        explanation = "I couldn't find an available canteen item that satisfies all your criteria."
        if "budget" in diagnosis["failures"]:
            b_info = diagnosis["failures"]["budget"]
            explanation = f"Your budget of ₹{int(b_info['user_budget'])} is below our lowest priced available item (₹{int(b_info['lowest_available'])})."
        elif "time" in diagnosis["failures"]:
            t_info = diagnosis["failures"]["time"]
            explanation = f"No canteen dishes can be prepared in {t_info['user_time']} minutes. Our quickest items take at least {t_info['fastest_available']} minutes."

        return RecommendationResult(
            explanation=explanation,
            structured_filters_applied=query.model_dump()
        )

    # Score and rank items
    ranked_cards = rank_foods(filtered_items, constraints, preferences)
    top_cards = get_top_recommendations(ranked_cards, max_count=3)

    top_card = top_cards[0]
    top_item = next(f for f in filtered_items if f.item_id == top_card.item.item_id)
    alternatives = top_cards[1:]

    # Combination logic
    combo = find_meal_combination(top_item, foods, query)

    # Check if user specifically craved/requested an item that is currently marked unavailable
    cravings_clean = [c.strip().lower() for c in (query.cravings or []) if c.strip()]
    unavailable_matches = [
        f for f in foods
        if not f.available and any(c in f.name.lower() or c in f.category.lower() for c in cravings_clean)
    ]
    unavailable_notice = None
    if unavailable_matches:
        unavail_name = unavailable_matches[0].name
        unavailable_notice = (
            f"Notice: '{unavail_name}' is currently out of stock at the canteen. "
            f"We've recommended the closest available substitute ({top_item.name}) that matches your criteria."
        )

    # Build clear, grounded explanation
    explanation = f"Recommended **{top_item.name}** because it matches your requirements: " + ", ".join(top_card.reasons[:4]) + "."
    if combo:
        explanation += f" Paired with **{combo.side_item.name}** for a complete meal ({int(combo.total_calories)} kcal, {int(combo.total_protein)}g protein) at ₹{int(combo.total_price)}."

    is_snack_only = bool(query.budget is not None and query.budget < 40)

    return RecommendationResult(
        top_pick=top_card,
        combo=combo,
        alternatives=alternatives,
        explanation=explanation,
        structured_filters_applied=query.model_dump(),
        is_snack_only=is_snack_only,
        relaxation_notes=unavailable_notice
    )
