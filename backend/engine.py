from typing import List, Optional, Tuple, Dict, Any
from schemas import (
    PreferenceQuery,
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
    taste_str = " ".join([t.lower() for t in (query.taste or [])])

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


def apply_hard_filters(foods: List[Food], query: PreferenceQuery) -> Tuple[List[Food], List[str]]:
    """
    Strict deterministic hard filtering:
    - price <= budget
    - diet compliance (vegetarian / vegan / jain / non-veg)
    - allergy restrictions (dairy, gluten, nuts, egg)
    - preparation_time <= time_limit
    - available == True
    - exclusions (no noodles, no onion, etc.)
    """
    filtered = []
    filter_reasons_logged = []

    diet_clean = (query.diet or "").strip().lower()
    exclusions_clean = [e.strip().lower() for e in (query.exclusions or []) if e.strip()]

    for item in foods:
        # 1. Availability check (HARD)
        if not item.available:
            continue

        # 2. Budget check (HARD)
        if query.budget is not None and item.price > query.budget:
            continue

        # 3. Preparation time check (HARD)
        if query.time_limit is not None and item.preparation_time > query.time_limit:
            continue

        # 4. Dietary constraint check (STRICT deterministic DB flags)
        if diet_clean in ["vegan", "plant-based"]:
            if not item.vegan:
                continue
        elif diet_clean == "jain":
            if not item.jain:
                continue
        elif diet_clean in ["vegetarian", "veg"]:
            if not item.vegetarian:
                continue
        elif diet_clean in ["non-veg", "non-vegetarian"]:
            if item.vegetarian:
                pass  # Non-veg eaters can eat veg, but non-veg ranks higher in scoring

        # 5. Allergy and Specific Exclusions (HARD)
        item_text = f"{item.name} {item.ingredients} {item.category} {item.tags}".lower()
        excluded = False
        for excl in exclusions_clean:
            if excl in ["no dairy", "dairy free", "lactose free", "no milk"]:
                if item.contains_dairy:
                    excluded = True
                    break
            elif excl in ["gluten free", "no gluten"]:
                if item.contains_gluten:
                    excluded = True
                    break
            elif excl in ["nut allergy", "no nuts", "peanut free"]:
                if item.contains_nuts:
                    excluded = True
                    break
            elif excl in ["no egg", "eggless"]:
                if item.contains_egg:
                    excluded = True
                    break
            elif excl in item_text:
                excluded = True
                break

        if excluded:
            continue

        filtered.append(item)

    return filtered, filter_reasons_logged


def calculate_score(item: Food, query: PreferenceQuery) -> Tuple[float, Dict[str, float], List[str]]:
    """
    Scoring algorithm:
    Hard constraints filter beforehand.
    Soft ranking factors:
      - 30% preference match
      - 20% budget fit
      - 15% dietary compatibility
      - 15% time fit
      - 10% mood/craving
      - 10% nutrition goal match
    If user has no nutrition goals, redistribute nutrition weight proportionally across the other 5 factors.
    """
    reasons = []

    # 1. PreferenceMatch
    pref_score = 0.5  # baseline
    tastes = [t.lower() for t in (query.taste or [])]
    if "spicy" in tastes:
        if item.spicy:
            pref_score += 0.3
            reasons.append("🌶️ Spicy kick matching your taste preference")
        else:
            pref_score -= 0.1
    if "sweet" in tastes:
        if item.sweet:
            pref_score += 0.3
            reasons.append("🍯 Sweet treat matching your craving")
        else:
            pref_score -= 0.1

    if query.cuisine:
        if query.cuisine.lower() in item.cuisine.lower():
            pref_score += 0.2
            reasons.append(f"🍛 Authentic {item.cuisine} cuisine")

    pref_score = max(0.0, min(1.0, pref_score))

    # 2. BudgetFit
    if query.budget is not None and query.budget > 0:
        ratio = item.price / query.budget
        # Best sweet spot for a college meal is 50% to 75% of budget, leaving room for a drink/side
        if 0.50 <= ratio <= 0.75:
            budget_score = 0.95
            remaining = query.budget - item.price
            reasons.append(f"💰 ₹{int(item.price)} fits within ₹{int(query.budget)} (₹{int(remaining)} leftover)")
        elif ratio < 0.50:
            budget_score = 0.70 + (ratio * 0.4)
            remaining = query.budget - item.price
            reasons.append(f"💰 Budget friendly at ₹{int(item.price)} (₹{int(remaining)} leftover)")
        else:
            budget_score = max(0.6, 0.90 - (ratio - 0.75) * 0.5)
            reasons.append(f"💰 Fits your ₹{int(query.budget)} budget at ₹{int(item.price)}")
    else:
        budget_score = 0.8
        reasons.append(f"💰 Great value at ₹{int(item.price)}")
    budget_score = max(0.0, min(1.0, budget_score))

    # 3. DietaryMatch
    diet_score = 0.8
    diet_clean = (query.diet or "").strip().lower()
    if diet_clean == "vegan" and item.vegan:
        diet_score = 1.0
        reasons.append("🌿 100% Plant-Based / Vegan certified")
    elif diet_clean == "jain" and item.jain:
        diet_score = 1.0
        reasons.append("🕊️ Strict Jain friendly (no root vegetables, onion, or garlic)")
    elif diet_clean in ["vegetarian", "veg"] and item.vegetarian:
        diet_score = 1.0
        reasons.append("🌱 100% Vegetarian verified from ingredients")
    elif diet_clean in ["non-veg", "non-vegetarian"]:
        if not item.vegetarian:
            diet_score = 1.0
            reasons.append("🍗 Hearty non-vegetarian meal")
        else:
            diet_score = 0.6
    else:
        if item.vegetarian:
            reasons.append("🌱 Pure vegetarian")
    diet_score = max(0.0, min(1.0, diet_score))

    # 4. TimeFit
    if query.time_limit is not None and query.time_limit > 0:
        time_score = 1.0 - (item.preparation_time / query.time_limit) * 0.4
        reasons.append(f"⏱️ Ready in {item.preparation_time} mins (under your {query.time_limit} min limit)")
    else:
        time_score = 1.0 - min(item.preparation_time / 25.0, 0.4)
        reasons.append(f"⏱️ Fast prep: {item.preparation_time} mins")
    time_score = max(0.0, min(1.0, time_score))

    # 5. MoodCravingMatch
    mood_score = 0.5
    mood_clean = (query.mood or "").strip().lower()
    cravings_clean = [c.strip().lower() for c in (query.cravings or []) if c.strip()]

    item_tags = (item.tags or "").lower()
    item_desc = f"{item.name} {item.ingredients} {item.category}".lower()

    if mood_clean:
        matched_tags = MOOD_KEYWORDS.get(mood_clean, [])
        if any(tag in item_tags for tag in matched_tags):
            mood_score += 0.3
            reasons.append(f"✨ Comforting match when feeling {mood_clean}")

    for craving in cravings_clean:
        if craving in item_desc:
            mood_score += 0.3
            reasons.append(f"🎯 Satisfies your craving for '{craving}'")
            break

    mood_score = max(0.0, min(1.0, mood_score))

    # 6. NutritionGoalMatch (10%)
    has_nutrition_goals = bool(
        query.protein_goal or query.calorie_goal or
        (mood_clean in ["high protein", "healthy", "light meal"])
    )

    nutrition_score = 0.5
    if has_nutrition_goals:
        # Check protein alignment
        wants_high_protein = (
            (query.protein_goal and "high" in query.protein_goal.lower()) or
            (mood_clean == "high protein") or
            (query.protein_goal and any(c.isdigit() for c in query.protein_goal))
        )
        wants_low_calorie = (
            mood_clean in ["light meal", "healthy"] or
            (query.calorie_goal is not None and query.calorie_goal < 400)
        )

        if wants_high_protein:
            if item.protein >= 15.0:
                nutrition_score = 1.0
                reasons.append(f"💪 High protein ({int(item.protein)}g) supporting your fitness goal")
            elif item.protein >= 10.0:
                nutrition_score = 0.8
                reasons.append(f"💪 Good protein match ({int(item.protein)}g)")
            else:
                nutrition_score = 0.4
        elif wants_low_calorie:
            if item.calories <= 300:
                nutrition_score = 1.0
                reasons.append(f"🥗 Light calorie count ({int(item.calories)} kcal)")
            elif item.calories <= 450:
                nutrition_score = 0.8
            else:
                nutrition_score = 0.4
        else:
            nutrition_score = 0.7
            if item.protein >= 10.0:
                reasons.append(f"⚡ Balanced nutrition ({int(item.protein)}g protein, {int(item.calories)} kcal)")

    nutrition_score = max(0.0, min(1.0, nutrition_score))

    # Weight distribution
    if has_nutrition_goals:
        # 30% Pref, 20% Budget, 15% Diet, 15% Time, 10% Mood, 10% Nutrition
        total_score = (
            pref_score * 0.30
            + budget_score * 0.20
            + diet_score * 0.15
            + time_score * 0.15
            + mood_score * 0.10
            + nutrition_score * 0.10
        )
    else:
        # Redistribute 10% proportionally across other 5 factors:
        # 30/90 = 0.333, 20/90 = 0.222, 15/90 = 0.167, 15/90 = 0.167, 10/90 = 0.111
        total_score = (
            pref_score * (30.0 / 90.0)
            + budget_score * (20.0 / 90.0)
            + diet_score * (15.0 / 90.0)
            + time_score * (15.0 / 90.0)
            + mood_score * (10.0 / 90.0)
        )

    breakdown = {
        "preference_match": round(pref_score, 2),
        "budget_fit": round(budget_score, 2),
        "dietary_match": round(diet_score, 2),
        "time_fit": round(time_score, 2),
        "mood_craving_match": round(mood_score, 2),
        "nutrition_match": round(nutrition_score, 2) if has_nutrition_goals else 0.0,
    }

    return total_score, breakdown, reasons


def find_meal_combination(
    top_item: Food,
    available_foods: List[Food],
    query: PreferenceQuery
) -> Optional[MealCombination]:
    """
    Pairs the top main meal with a complementary side or beverage
    that fits strictly within remaining budget and time constraints.
    Dynamically computes total price, prep time, and cumulative macros.
    """
    if query.budget is None:
        remaining_budget = 40.0  # reasonable allowance if budget open
    else:
        remaining_budget = query.budget - top_item.price

    if remaining_budget < 15.0:
        return None  # Cheapest beverage/side is ₹15

    # Look for beverage or light snack
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

        # Diet check
        if diet_clean == "vegan" and not side.vegan:
            continue
        if diet_clean == "jain" and not side.jain:
            continue
        if diet_clean in ["vegetarian", "veg"] and not side.vegetarian:
            continue

        # Exclusions check
        side_text = f"{side.name} {side.category} {side.ingredients}".lower()
        if any(ex in side_text for ex in exclusions_clean):
            continue

        compatible_sides.append(side)

    if not compatible_sides:
        return None

    # Priority:
    # If top item is spicy or heavy food, strongly prefer cooling Beverages (e.g. Fresh Lime Soda, Chaas, Cold Coffee)
    def side_priority(s: Food):
        score = 0.0
        if top_item.category in ["Roll", "Rice", "Noodles", "Snacks", "Chinese"]:
            if s.category == "Beverages":
                score += 15.0
                if "lime" in s.name.lower() or "soda" in s.name.lower():
                    score += 5.0  # Fresh Lime Soda perfect palate cleanser for spicy roll
            elif s.category == "Sweets":
                score += 5.0

        # Leave a reasonable leftover margin
        score -= (remaining_budget - s.price) * 0.05
        return score

    compatible_sides.sort(key=side_priority, reverse=True)
    best_side = compatible_sides[0]

    total_price = top_item.price + best_side.price
    max_time = max(top_item.preparation_time, best_side.preparation_time)
    leftover = (query.budget - total_price) if query.budget else 0.0

    return MealCombination(
        main_item=FoodOut.model_validate(top_item),
        side_item=FoodOut.model_validate(best_side),
        total_price=total_price,
        max_prep_time=max_time,
        budget_remaining=max(0.0, leftover),
        description=f"{top_item.name} + {best_side.name}",
        total_calories=round(top_item.calories + best_side.calories, 1),
        total_protein=round(top_item.protein + best_side.protein, 1),
        total_carbs=round(top_item.carbohydrates + best_side.carbohydrates, 1),
        total_fat=round(top_item.fat + best_side.fat, 1)
    )


def generate_recommendations(
    foods: List[Food],
    query: PreferenceQuery
) -> RecommendationResult:
    """
    Main recommendation pipeline:
    1. Check for contradictions/conflicts
    2. Filter hard constraints
    3. If empty, attempt soft-preference relaxation (keep hard constraints)
    4. Score and rank items with nutrition awareness
    5. Find combo pairing with dynamic cumulative macros
    6. Pick 2-3 diverse alternatives
    7. Return structured result
    """
    conflict_msg = check_conflicts(query)
    if conflict_msg:
        return RecommendationResult(
            explanation=conflict_msg,
            conflict_detected=conflict_msg
        )

    # Hard filtering
    filtered_items, _ = apply_hard_filters(foods, query)

    relaxation_notes = None
    is_snack_only = False

    # Edge Case: Budget is very low (< ₹40)
    if query.budget is not None and query.budget < 40:
        is_snack_only = True

    # If no items match hard constraints
    if not filtered_items:
        # Check if the budget itself was too low
        cheapest_available = min((f.price for f in foods if f.available), default=15.0)
        if query.budget is not None and query.budget < cheapest_available:
            return RecommendationResult(
                explanation=f"Your budget of ₹{int(query.budget)} is below our lowest priced item (₹{int(cheapest_available)}). Try increasing your budget slightly.",
                structured_filters_applied=query.model_dump()
            )

        # Check if time limit was too tight
        fastest_prep = min((f.preparation_time for f in foods if f.available), default=2)
        if query.time_limit is not None and query.time_limit < fastest_prep:
            return RecommendationResult(
                explanation=f"No items can be prepared under {query.time_limit} minutes. Our quickest items (like Masala Chai or Chaas) take at least {fastest_prep} minutes.",
                structured_filters_applied=query.model_dump()
            )

        return RecommendationResult(
            explanation="There are currently no items matching all your strict criteria. Please try adjusting your budget, time limit, or exclusions.",
            structured_filters_applied=query.model_dump()
        )

    # Score each item
    scored_items = []
    for item in filtered_items:
        score, breakdown, reasons = calculate_score(item, query)
        match_pct = int(round(score * 100))
        card = RecommendationCard(
            item=FoodOut.model_validate(item),
            score=round(score, 3),
            match_percentage=match_pct,
            reasons=reasons,
            score_breakdown=breakdown
        )
        scored_items.append((card, item))

    # Rank descending by score
    scored_items.sort(key=lambda x: x[0].score, reverse=True)

    top_card, top_item = scored_items[0]

    # Select 2-3 alternatives with category variety
    alternatives: List[RecommendationCard] = []
    seen_categories = {top_item.category}

    for card, item in scored_items[1:]:
        if len(alternatives) >= 3:
            break
        if item.category not in seen_categories:
            alternatives.append(card)
            seen_categories.add(item.category)

    if len(alternatives) < 3:
        for card, item in scored_items[1:]:
            if len(alternatives) >= 3:
                break
            if card not in alternatives:
                alternatives.append(card)

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

    return RecommendationResult(
        top_pick=top_card,
        combo=combo,
        alternatives=alternatives,
        explanation=explanation,
        structured_filters_applied=query.model_dump(),
        is_snack_only=is_snack_only,
        relaxation_notes=unavailable_notice
    )
