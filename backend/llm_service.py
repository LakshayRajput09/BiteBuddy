import os
import re
import json
from typing import Optional, Dict, Any, Tuple, List
import httpx
from schemas import PreferenceQuery, RecommendationCard, MealCombination

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# Common food items/categories for exclusion parsing
EXCLUSION_WORDS = [
    "noodles", "maggi", "roll", "rolls", "rice", "biryani",
    "sandwich", "paneer", "chicken", "egg", "eggs", "dairy",
    "onion", "garlic", "potato", "spicy", "sweet", "fried",
    "dosa", "chole", "bhature", "tea", "coffee", "cheese"
]

CRAVING_PATTERNS = [
    (r"\b(paneer)\b", "paneer"),
    (r"\b(cheese)\b", "cheese"),
    (r"\b(chocolate|brownie)\b", "chocolate"),
    (r"\b(maggi|noodles?)\b", "noodles"),
    (r"\b(biryani)\b", "biryani"),
    (r"\b(rice|rajma|khichdi)\b", "rice"),
    (r"\b(sandwich)\b", "sandwich"),
    (r"\b(roll|kathi roll)\b", "roll"),
    (r"\b(dosa|idli)\b", "south indian"),
    (r"\b(samosa|vada pav|cutlet)\b", "snack"),
    (r"\b(coffee|cold coffee)\b", "coffee"),
    (r"\b(chai|tea)\b", "chai"),
    (r"\b(lassi|buttermilk|chaas|soda)\b", "beverage"),
    (r"\b(sweet|gulab jamun|dessert|custard)\b", "sweet"),
]

MOOD_PATTERNS = [
    (r"\b(tired|exhausted|sleepy|drained|lethargic|fatigued)\b", "tired"),
    (r"\b(stress(ed)?|anxious|exam|studying|test)\b", "stressed"),
    (r"\b(hungry|starving|famished|heavy meal|filling)\b", "hungry"),
    (r"\b(rush(ed)?|hurr(y|ied)|quick|in a hurry|late|fast)\b", "rushed"),
    (r"\b(celebrat(ing|ion)|happy|party|cheat day|treat)\b", "celebrating"),
    (r"\b(sick|unwell|fever|light meal|soothing)\b", "sick"),
]


def extract_preferences_rule_based(message: str) -> PreferenceQuery:
    """
    Robust rule-based parser for canteen requests.
    Extracts budget, diet, taste, mood, cravings, time_limit, exclusions.
    """
    text = message.strip()
    lower = text.lower()

    # 1. Invalid input validation: Negative budget
    if re.search(r"-\s*₹?\s*\d+|₹\s*-\s*\d+|budget\s*:\s*-\d+", lower):
        raise ValueError("Budget cannot be negative")

    # 2. Budget extraction
    # Patterns: ₹100, 100rs, 100 rupees, under 100, below 120, max 80, budget 100, 100 bucks, have 120
    budget = None
    budget_match = (
        re.search(r"(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)", lower) or
        re.search(r"(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees|bucks)", lower) or
        re.search(r"(?:under|below|within|budget(?:\s*of|\s*is|\s*:)?|max(?:imum)?|have)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)", lower) or
        re.search(r"\b(\d{2,4})\s*(?:budget|only)\b", lower)
    )
    if budget_match:
        try:
            budget = float(budget_match.group(1))
        except (ValueError, TypeError):
            budget = None

    # 3. Time limit extraction
    # Patterns: 10 mins, 10 minutes, 5 min, within 15m, 10 min break
    time_limit = None
    time_match = (
        re.search(r"(\d+)\s*(?:mins?|minutes?)\b", lower) or
        re.search(r"(?:in|within)\s*(\d+)\s*(?:mins?|minutes?|m)\b", lower) or
        re.search(r"(\d+)\s*m\b(?:\s*break|\s*limit)", lower)
    )
    if time_match:
        try:
            time_limit = int(time_match.group(1))
        except (ValueError, TypeError):
            time_limit = None

    # 4. Dietary extraction
    diet = None
    if re.search(r"\b(vegan|plant-based)\b", lower):
        diet = "vegan"
    elif re.search(r"\b(jain)\b", lower):
        diet = "jain"
    elif re.search(r"\b(non-?veg|non-?vegetarian|chicken|meat|egg)\b", lower):
        diet = "non-vegetarian"
    elif re.search(r"\b(veg|vegetarian|pure veg)\b", lower):
        diet = "vegetarian"

    # 5. Taste extraction
    tastes = []
    if re.search(r"\b(spicy|teekha|hot|masaledar|chilli)\b", lower):
        tastes.append("spicy")
    if re.search(r"\b(sweet|meetha|dessert)\b", lower):
        tastes.append("sweet")
    if re.search(r"\b(tangy|chatpata|sour)\b", lower):
        tastes.append("tangy")
    if re.search(r"\b(crispy|crunchy)\b", lower):
        tastes.append("crispy")
    if re.search(r"\b(mild|non-spicy|not spicy|less spicy)\b", lower):
        tastes.append("mild")

    # 6. Mood extraction
    mood = None
    for pattern, mood_name in MOOD_PATTERNS:
        if re.search(pattern, lower):
            mood = mood_name
            break

    # 7. Cravings extraction
    cravings = []
    for pattern, craving_name in CRAVING_PATTERNS:
        if re.search(pattern, lower):
            # Avoid picking craving if it was explicitly negated/excluded
            if not re.search(rf"(?:no|don'?t\s+want|without|exclude)\s+{craving_name}", lower):
                cravings.append(craving_name)

    # 8. Exclusions extraction
    # Patterns: "no noodles", "don't want rolls", "without dairy", "no onion", "skip rice"
    exclusions = []
    excl_patterns = [
        r"(?:no|without|skip|exclude|avoid|don'?t\s+want)\s+([a-zA-Z]+)",
        r"not\s+([a-zA-Z]+)"
    ]
    for pattern in excl_patterns:
        matches = re.finditer(pattern, lower)
        for m in matches:
            word = m.group(1).strip()
            # Normalize common food words
            if word in EXCLUSION_WORDS or any(ex in word for ex in EXCLUSION_WORDS):
                if word not in exclusions:
                    exclusions.append(word)

    # 9. Cuisine extraction
    cuisine = None
    if re.search(r"\b(south indian|dosa|idli|sambar)\b", lower):
        cuisine = "South Indian"
    elif re.search(r"\b(chinese|indo-chinese|hakka|schezwan|manchurian)\b", lower):
        cuisine = "Indo-Chinese"
    elif re.search(r"\b(north indian|punjabi|mughlai|biryani)\b", lower):
        cuisine = "North Indian"

    # 10. Protein & Nutrition goals
    protein_goal = None
    if re.search(r"\b(high protein|more protein|protein rich|protein)\b", lower):
        protein_goal = "high"

    return PreferenceQuery(
        budget=budget,
        diet=diet,
        taste=tastes,
        mood=mood,
        cravings=cravings,
        time_limit=time_limit,
        cuisine=cuisine,
        exclusions=exclusions,
        protein_goal=protein_goal
    )


async def extract_preferences_with_gemini(message: str) -> Optional[PreferenceQuery]:
    """
    Calls Google Gemini API for natural language extraction if GEMINI_API_KEY is present.
    Falls back to None if call fails or key is empty.
    """
    if not GEMINI_API_KEY:
        return None

    prompt = f"""
You are a food preference extractor for a college canteen assistant.
Extract structured food preferences from the user's message.
Output ONLY valid JSON adhering strictly to this schema:
{{
  "budget": float or null (in INR rupees, e.g. 120.0),
  "diet": string or null ("vegetarian", "vegan", "jain", "non-vegetarian", or null),
  "taste": list of strings (e.g. ["spicy"], ["sweet"], ["tangy"]),
  "mood": string or null (e.g. "tired", "stressed", "hungry", "rushed", "celebrating"),
  "cravings": list of strings (e.g. ["paneer", "biryani", "coffee"]),
  "time_limit": integer or null (in minutes),
  "cuisine": string or null,
  "exclusions": list of strings (e.g. ["noodles", "dairy", "onion"] if user says "no noodles" or "without dairy")
}}

User message: "{message}"
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text_content)
                return PreferenceQuery(**parsed)
    except Exception as e:
        print(f"Gemini extraction fallback triggered: {e}")

    return None


async def extract_user_preferences(message: str) -> PreferenceQuery:
    """
    Extracts preferences: tries Gemini if configured, otherwise uses deterministic rule parser.
    """
    # Check invalid input first
    if re.search(r"-\s*₹?\s*\d+|₹\s*-\s*\d+", message):
        raise ValueError("Budget cannot be negative")

    gemini_result = await extract_preferences_with_gemini(message)
    if gemini_result is not None:
        return gemini_result

    return extract_preferences_rule_based(message)


def generate_explanation_text(
    top_pick: RecommendationCard,
    combo: Optional[MealCombination],
    query: PreferenceQuery,
    turn_type: str = "initial",
    unavailable_notice: Optional[str] = None
) -> str:
    """
    Generates a student-friendly, warm, transparent explanation grounded
    in the deterministic checklist reasons without making medical claims.
    """
    item = top_pick.item
    parts = []

    if unavailable_notice:
        parts.append(f"⚠️ {unavailable_notice}")

    # Greeting / Opening
    if turn_type == "refinement":
        parts.append(f"Got it! Based on your updated preference, how about the **{item.name}**?")
    else:
        parts.append(f"I recommend the **{item.name}** from our {item.category} counter!")

    # Value & Budget
    if query.budget:
        remaining = query.budget - item.price
        if remaining > 0:
            parts.append(f"At ₹{int(item.price)}, it leaves you with ₹{int(remaining)} to spare from your ₹{int(query.budget)} budget.")
        else:
            parts.append(f"It fits right within your ₹{int(query.budget)} budget at ₹{int(item.price)}.")
    else:
        parts.append(f"It's priced at ₹{int(item.price)}.")

    # Prep time
    if query.time_limit:
        parts.append(f"It takes just {item.preparation_time} minutes to prepare, comfortably within your {query.time_limit}-minute window.")
    else:
        parts.append(f"Prep time is roughly {item.preparation_time} minutes.")

    # Mood / Taste
    if query.mood:
        parts.append(f"It's a comforting, popular canteen choice when you're feeling {query.mood}.")
    if "spicy" in (query.taste or []):
        parts.append("It packs that spicy kick you were craving.")

    # Combo mention
    if combo:
        parts.append(
            f"💡 **Combo Suggestion**: You can pair it with a {combo.side_item.name} "
            f"for a complete meal at just ₹{int(combo.total_price)} (₹{int(combo.budget_remaining)} left)!"
        )

    return " ".join(parts)


def classify_chat_intent(message: str) -> str:
    """
    Classifies student message into:
    - 'greeting'
    - 'nutrition_inquiry'
    - 'menu_inquiry'
    - 'recommendation'
    """
    lower = message.strip().lower()

    # If it specifies budget or time limit or explicit meal craving, prefer recommendation
    has_budget = bool(re.search(r"(?:₹|rs\.?|inr|\brupees\b|\bbucks\b|\bunder\s*\d+|\bmax\s*\d+)", lower))
    has_time = bool(re.search(r"\b\d+\s*(?:mins?|minutes?|m)\b", lower))
    has_meal_request = bool(re.search(r"\b(hungry|want|give\s+me|suggest|recommend|craving|lunch|dinner|breakfast|snack|meal)\b", lower))

    # 1. Greeting / Bot identity / Help (only if no budget or explicit meal order)
    if not has_budget and not has_time and not has_meal_request:
        if re.match(r"^(hi|hello|hey|greetings|hola|sup|good morning|good afternoon|good evening|yo)[\s!.,?]*$", lower) or lower in [
            "help", "who are you", "what can you do", "what is bitebuddy", "options", "commands"
        ]:
            return "greeting"

    # 2. Nutrition inquiries
    if re.search(r"\b(highest|most|max)\s+protein\b", lower) or \
       re.search(r"\b(lowest|least|min)\s+(calories?|cals?|fat)\b", lower) or \
       re.search(r"\bhow\s+much\s+(protein|calories?|carbs?|fat)\b", lower) or \
       re.search(r"\b(macros?|nutrition\s+facts?)\b", lower):
        return "nutrition_inquiry"

    # 3. Specific menu inquiries (asking about specific ingredients, availability, cheapest item)
    if re.search(r"\b(cheapest|lowest\s+price)\b", lower) or \
       re.search(r"\bwhat\s+(dishes|items|food)\s+(have|has|contain)\b", lower) or \
       re.search(r"\bdo\s+you\s+have\b", lower) or \
       re.search(r"\bis\s+.*\s+(available|in\s+stock)\b", lower) or \
       re.search(r"\bwhat\s+are\s+the\s+ingredients\b", lower) or \
       re.search(r"\bshow\s+(all\s+)?(drinks|beverages|desserts|sweets)\b", lower):
        return "menu_inquiry"

    return "recommendation"


def generate_suggested_followups(
    top_pick: Optional[RecommendationCard] = None,
    combo: Optional[MealCombination] = None,
    query: Optional[PreferenceQuery] = None,
    clarification_type: Optional[str] = None,
    intent: Optional[str] = None,
    matched_items: Optional[List[Any]] = None
) -> List[str]:
    """
    Generates 3-4 smart, contextual follow-up query chips.
    """
    if clarification_type == "missing_budget":
        return ["Under ₹50 quick bite", "Under ₹100 lunch", "Under ₹150 full meal", "No budget limit"]

    if clarification_type == "conflict":
        return ["Show Vegetarian options", "Show Vegan options", "Show dishes under ₹100"]

    if clarification_type == "no_match":
        return ["Increase budget to ₹150", "Allow up to 15 mins prep", "Show all vegetarian items"]

    if intent == "greeting":
        return [
            "Under ₹120 spicy lunch",
            "High protein vegetarian meal",
            "Ready in under 10 minutes",
            "Show budget snacks under ₹50"
        ]

    if intent == "nutrition_inquiry":
        return [
            "Add top pick to order",
            "Show other high protein options",
            "Under ₹100 meal",
            "Pair with a drink"
        ]

    if intent == "menu_inquiry":
        return [
            "Add to my order",
            "Show spicy alternatives",
            "Dishes under ₹80",
            "What's ready in 5 minutes?"
        ]

    # Recommendation follow-ups
    chips: List[str] = []
    if top_pick:
        price = top_pick.item.price
        if price > 50:
            chips.append(f"Under ₹{int(price)} cheaper option")
        if combo:
            chips.append(f"Add {combo.side_item.name} combo")
        else:
            chips.append("Pair with a beverage")

        if top_pick.item.vegetarian:
            chips.append("Make it 100% vegan")
        else:
            chips.append("Show vegetarian only")

        if query and "spicy" in (query.taste or []):
            chips.append("Something less spicy")
        else:
            chips.append("Make it spicy")

        chips.append(f"How much protein in {top_pick.item.name}?")

    return chips[:4]


def handle_menu_inquiry(message: str, foods: List[Any]) -> Tuple[str, List[Any], List[str]]:
    """
    Answers direct questions about menu items, ingredients, availability, cheapest item.
    """
    lower = message.lower()
    matched: List[Any] = []

    # 1. Cheapest item inquiry
    if re.search(r"\b(cheapest|lowest\s+price)\b", lower):
        available_foods = [f for f in foods if f.available]
        if available_foods:
            sorted_by_price = sorted(available_foods, key=lambda x: x.price)
            cheapest = sorted_by_price[0]
            matched = sorted_by_price[:3]
            reply = (
                f"The most budget-friendly item in the canteen right now is **{cheapest.name}** "
                f"at just **₹{int(cheapest.price)}** ({int(cheapest.calories or 0)} kcal, ready in {cheapest.preparation_time} min). "
                f"Here are our top value picks:"
            )
            return reply, matched, ["Add to order", "Dishes under ₹50", "High protein under ₹100"]

    # 2. Availability check: "is cold coffee available?", "do you have samosa?"
    for f in foods:
        if f.name.lower() in lower or (len(f.name) > 4 and f.name.lower()[:5] in lower):
            status = "in stock and available right now! 🎉" if f.available else "currently sold out / unavailable 😔."
            reply = (
                f"**{f.name}** is {status}\n\n"
                f"• **Price**: ₹{int(f.price)}\n"
                f"• **Prep time**: {f.preparation_time} mins\n"
                f"• **Nutrition**: {int(f.calories or 0)} kcal | {int(f.protein or 0)}g Protein | {int(f.carbohydrates or 0)}g Carbs"
            )
            matched = [f]
            return reply, matched, [f"Add {f.name} to order", "Show similar items", "Dishes under ₹100"]

    # 3. Ingredient search: "what items have paneer", "dishes with cheese"
    ingr_match = re.search(r"\b(paneer|cheese|egg|chicken|maggi|rice|potato|aloo|mushroom|chocolate)\b", lower)
    if ingr_match:
        target_ingr = ingr_match.group(1)
        matched = [f for f in foods if target_ingr in f.name.lower() or (f.ingredients and target_ingr in f.ingredients.lower())]
        if matched:
            reply = f"Here are the canteen dishes featuring **{target_ingr.title()}**:"
            return reply, matched[:4], [f"Best {target_ingr} under ₹100", "Show nutrition details", "Order top pick"]

    # 4. Category search: "show drinks / beverages / desserts"
    if re.search(r"\b(drink|beverage|soda|coffee|tea|chai|lassi)\b", lower):
        matched = [f for f in foods if f.category.lower() in ["beverage", "beverages"] or "drink" in (f.tags or "").lower()]
        reply = "Here are our refreshing drinks and beverages:"
        return reply, matched[:4], ["Pair with a snack", "Under ₹40 drinks", "Cold beverages only"]

    if re.search(r"\b(dessert|sweet|gulab jamun)\b", lower):
        matched = [f for f in foods if f.category.lower() in ["dessert", "desserts", "sweet"] or "sweet" in (f.tags or "").lower()]
        reply = "Here are the sweet treats and desserts currently on the menu:"
        return reply, matched[:4], ["Add dessert to order", "Under ₹50 sweets", "Back to main menu"]

    # Default fallback menu search by words
    words = [w for w in lower.split() if len(w) > 3 and w not in ["what", "have", "show", "tell", "about", "with", "canteen", "dishes", "items"]]
    for w in words:
        for f in foods:
            if (w in f.name.lower() or (f.tags and w in f.tags.lower())) and f not in matched:
                matched.append(f)
    if matched:
        reply = "Here are the canteen items matching your query:"
        return reply, matched[:4], ["Add to order", "Dishes under ₹100", "What's fastest?"]

    return (
        "I couldn't find an exact menu match for that. Would you like me to recommend a meal based on your budget or cravings?",
        [],
        ["Under ₹100 lunch", "Quick snacks", "High protein items", "Browse full menu"]
    )


def handle_nutrition_inquiry(message: str, foods: List[Any]) -> Tuple[str, List[Any], List[str]]:
    """
    Answers direct questions about nutrition, macros, highest protein, lowest calories.
    """
    lower = message.lower()
    available_foods = [f for f in foods if f.available]

    # 1. Highest protein inquiry
    if re.search(r"\b(highest|most|max|high)\s+protein\b", lower):
        if "veg" in lower or "vegetarian" in lower:
            candidates = [f for f in available_foods if f.vegetarian]
        else:
            candidates = available_foods

        sorted_by_protein = sorted(candidates, key=lambda x: x.protein or 0, reverse=True)
        top = sorted_by_protein[0] if sorted_by_protein else None
        if top:
            matched = sorted_by_protein[:3]
            reply = (
                f"The highest protein dish right now is **{top.name}** with **{int(top.protein or 0)}g of protein** "
                f"({int(top.calories or 0)} kcal, ₹{int(top.price)}).\n\n"
                f"Here are our top high-protein canteen items:"
            )
            return reply, matched, [f"Add {top.name} to order", "Under ₹100 protein", "Pair with a beverage"]

    # 2. Lowest calorie inquiry
    if re.search(r"\b(lowest|least|min|low)\s+(calories?|cals?)\b", lower):
        sorted_by_cals = sorted([f for f in available_foods if (f.calories or 0) > 0], key=lambda x: x.calories or 999)
        top = sorted_by_cals[0] if sorted_by_cals else None
        if top:
            matched = sorted_by_cals[:3]
            reply = (
                f"The lowest calorie option is **{top.name}** at just **{int(top.calories or 0)} kcal** "
                f"(₹{int(top.price)}, {int(top.protein or 0)}g protein).\n\n"
                f"Here are our lightest canteen options:"
            )
            return reply, matched, [f"Add {top.name} to order", "Show light snacks", "Under ₹50"]

    # 3. Macro check for a specific dish
    for f in foods:
        if f.name.lower() in lower or (len(f.name) > 4 and f.name.lower()[:5] in lower):
            reply = (
                f"📊 **Nutritional breakdown for {f.name}** (approx. per serving):\n\n"
                f"• **Calories**: {int(f.calories or 0)} kcal\n"
                f"• **Protein**: {int(f.protein or 0)}g\n"
                f"• **Carbohydrates**: {int(f.carbohydrates or 0)}g\n"
                f"• **Total Fat**: {int(f.fat or 0)}g\n"
                f"• **Dietary Fiber**: {int(f.fiber or 0)}g\n"
                f"• **Price**: ₹{int(f.price)} | **Prep Time**: {f.preparation_time} min"
            )
            return reply, [f], [f"Add {f.name} to order", "Pair with a drink", "Show alternatives"]

    # Fallback to general high protein
    sorted_by_protein = sorted(available_foods, key=lambda x: x.protein or 0, reverse=True)
    return (
        "Here are our most nutrient-dense options ranked by protein content:",
        sorted_by_protein[:3],
        ["Under ₹100 high protein", "Vegetarian protein", "Add top pick to order"]
    )


# Common off-menu foods students ask for with curated canteen alternatives
OFF_MENU_FOOD_MAP = {
    "pizza": {
        "name": "Pizza",
        "alternatives": ["Cheese Grilled Sandwich", "Classic Masala Maggi", "Chilli Paneer Dry"]
    },
    "pizzas": {
        "name": "Pizza",
        "alternatives": ["Cheese Grilled Sandwich", "Classic Masala Maggi", "Chilli Paneer Dry"]
    },
    "burger": {
        "name": "Burger",
        "alternatives": ["Mumbai Vada Pav", "Cheese Grilled Sandwich", "Paneer Kathi Roll"]
    },
    "burgers": {
        "name": "Burgers",
        "alternatives": ["Mumbai Vada Pav", "Cheese Grilled Sandwich", "Paneer Kathi Roll"]
    },
    "cheeseburger": {
        "name": "Cheeseburger",
        "alternatives": ["Mumbai Vada Pav", "Cheese Grilled Sandwich"]
    },
    "pasta": {
        "name": "Pasta",
        "alternatives": ["Veg Hakka Noodles", "Classic Masala Maggi", "Cheese Grilled Sandwich"]
    },
    "pastas": {
        "name": "Pasta",
        "alternatives": ["Veg Hakka Noodles", "Classic Masala Maggi", "Cheese Grilled Sandwich"]
    },
    "macaroni": {
        "name": "Macaroni",
        "alternatives": ["Classic Masala Maggi", "Veg Hakka Noodles"]
    },
    "spaghetti": {
        "name": "Spaghetti",
        "alternatives": ["Veg Hakka Noodles", "Classic Masala Maggi"]
    },
    "lasagna": {
        "name": "Lasagna",
        "alternatives": ["Cheese Grilled Sandwich", "Chilli Paneer Dry"]
    },
    "momo": {
        "name": "Momos",
        "alternatives": ["Chilli Paneer Dry", "Veg Hakka Noodles", "Schezwan Fried Rice"]
    },
    "momos": {
        "name": "Momos",
        "alternatives": ["Chilli Paneer Dry", "Veg Hakka Noodles", "Schezwan Fried Rice"]
    },
    "dim sum": {
        "name": "Dim Sum",
        "alternatives": ["Idli Sambar (2 pcs)", "Chilli Paneer Dry"]
    },
    "dumpling": {
        "name": "Dumplings",
        "alternatives": ["Idli Sambar (2 pcs)", "Chilli Paneer Dry"]
    },
    "dumplings": {
        "name": "Dumplings",
        "alternatives": ["Idli Sambar (2 pcs)", "Chilli Paneer Dry"]
    },
    "french fries": {
        "name": "French Fries",
        "alternatives": ["Veg Cutlet (2 pcs)", "Samosa (2 pcs)", "Mumbai Vada Pav"]
    },
    "fries": {
        "name": "Fries",
        "alternatives": ["Veg Cutlet (2 pcs)", "Samosa (2 pcs)", "Mumbai Vada Pav"]
    },
    "potato wedges": {
        "name": "Potato Wedges",
        "alternatives": ["Veg Cutlet (2 pcs)", "Samosa (2 pcs)"]
    },
    "shawarma": {
        "name": "Shawarma",
        "alternatives": ["Chicken Tikka Roll", "Paneer Kathi Roll"]
    },
    "falafel": {
        "name": "Falafel",
        "alternatives": ["Veg Cutlet (2 pcs)", "Paneer Kathi Roll"]
    },
    "kebab": {
        "name": "Kebabs",
        "alternatives": ["Chicken Tikka Roll", "Chilli Chicken Dry", "Veg Cutlet (2 pcs)"]
    },
    "kebabs": {
        "name": "Kebabs",
        "alternatives": ["Chicken Tikka Roll", "Chilli Chicken Dry", "Veg Cutlet (2 pcs)"]
    },
    "sushi": {
        "name": "Sushi",
        "alternatives": ["Schezwan Fried Rice", "Veg Hakka Noodles"]
    },
    "ramen": {
        "name": "Ramen",
        "alternatives": ["Classic Masala Maggi", "Veg Hakka Noodles"]
    },
    "taco": {
        "name": "Tacos",
        "alternatives": ["Paneer Kathi Roll", "Mumbai Vada Pav"]
    },
    "tacos": {
        "name": "Tacos",
        "alternatives": ["Paneer Kathi Roll", "Mumbai Vada Pav"]
    },
    "burrito": {
        "name": "Burrito",
        "alternatives": ["Paneer Kathi Roll", "Aloo Corn Roll"]
    },
    "nachos": {
        "name": "Nachos",
        "alternatives": ["Cheese Grilled Sandwich", "Samosa (2 pcs)"]
    },
    "ice cream": {
        "name": "Ice Cream",
        "alternatives": ["Fresh Fruit Custard", "Chocolate Walnut Brownie", "Iced Cold Coffee"]
    },
    "icecream": {
        "name": "Ice Cream",
        "alternatives": ["Fresh Fruit Custard", "Chocolate Walnut Brownie", "Iced Cold Coffee"]
    },
    "paratha": {
        "name": "Paratha",
        "alternatives": ["Paneer Kathi Roll", "Aloo Corn Roll", "Chole Bhature"]
    },
    "pav bhaji": {
        "name": "Pav Bhaji",
        "alternatives": ["Mumbai Vada Pav", "Chole Bhature", "Bun Maska"]
    },
    "pani puri": {
        "name": "Pani Puri",
        "alternatives": ["Samosa (2 pcs)", "Mumbai Vada Pav"]
    },
    "golgappa": {
        "name": "Golgappa",
        "alternatives": ["Samosa (2 pcs)", "Mumbai Vada Pav"]
    },
    "bhel puri": {
        "name": "Bhel Puri",
        "alternatives": ["Indori Poha", "Mumbai Vada Pav"]
    },
    "chaat": {
        "name": "Chaat",
        "alternatives": ["Samosa (2 pcs)", "Mumbai Vada Pav"]
    },
    "mutton": {
        "name": "Mutton",
        "alternatives": ["Chicken Dum Biryani", "Chicken Tikka Roll"]
    },
    "fish": {
        "name": "Fish",
        "alternatives": ["Chicken Tikka Roll", "Chilli Chicken Dry"]
    },
    "seafood": {
        "name": "Seafood",
        "alternatives": ["Chicken Tikka Roll", "Chilli Chicken Dry"]
    },
    "prawns": {
        "name": "Prawns",
        "alternatives": ["Chicken Tikka Roll", "Chilli Chicken Dry"]
    },
    "soup": {
        "name": "Soup",
        "alternatives": ["Jain Dal Khichdi", "Veg Hakka Noodles"]
    },
    "salad": {
        "name": "Salad",
        "alternatives": ["Fresh Fruit Custard", "Curd Rice"]
    },
    "shake": {
        "name": "Milkshake",
        "alternatives": ["Iced Cold Coffee", "Alphonso Mango Lassi"]
    },
    "milkshake": {
        "name": "Milkshake",
        "alternatives": ["Iced Cold Coffee", "Alphonso Mango Lassi"]
    },
    "smoothie": {
        "name": "Smoothie",
        "alternatives": ["Alphonso Mango Lassi", "Fresh Fruit Custard"]
    },
    "boba": {
        "name": "Boba / Bubble Tea",
        "alternatives": ["Iced Cold Coffee", "Alphonso Mango Lassi"]
    },
    "waffle": {
        "name": "Waffles",
        "alternatives": ["Chocolate Walnut Brownie", "Warm Gulab Jamun (2 pcs)"]
    },
    "waffles": {
        "name": "Waffles",
        "alternatives": ["Chocolate Walnut Brownie", "Warm Gulab Jamun (2 pcs)"]
    },
    "pancake": {
        "name": "Pancakes",
        "alternatives": ["Masala Dosa", "Bun Maska", "Indori Poha"]
    },
    "pancakes": {
        "name": "Pancakes",
        "alternatives": ["Masala Dosa", "Bun Maska", "Indori Poha"]
    },
    "garlic bread": {
        "name": "Garlic Bread",
        "alternatives": ["Cheese Grilled Sandwich", "Mumbai Vada Pav"]
    }
}


def check_off_menu_item(message: str, foods: List[Any]) -> Optional[Tuple[str, List[Any], List[str]]]:
    """
    Checks if the student's request asks for any food or dish that is NOT on our canteen menu.
    If detected, returns (reply_text, suggested_alternatives, followups).
    """
    lower = message.strip().lower()

    # 1. Check known off-menu dictionary
    for key, info in OFF_MENU_FOOD_MAP.items():
        if re.search(rf"\b{re.escape(key)}\b", lower):
            matched_alts = []
            for alt_name in info["alternatives"]:
                for f in foods:
                    if f.name.lower() == alt_name.lower() and f.available:
                        matched_alts.append(f)
                        break

            if not matched_alts:
                matched_alts = [f for f in foods if f.available][:3]

            reply = (
                f"Sorry, **{info['name']}** is not available on our canteen menu.\n\n"
                f"Our canteen specializes in freshly prepared rolls, sandwiches, biryanis, dosas, Maggi noodles, snacks, and beverages. "
                f"Here are some popular available alternatives you might enjoy instead:"
            )

            followups = [f"Order {m.name}" for m in matched_alts[:2]] + ["Browse full menu", "Dishes under ₹100"]
            return reply, matched_alts[:3], followups

    # 2. General food inquiry pattern: "do you have X", "is X available", "can I get X", "i want X"
    inquiry_patterns = [
        r"\b(?:do you (?:have|serve|make)|is there|can i (?:get|have|order)|got any|any)\s+([a-z\s]+?)(?:\s+available|\s+on the menu|\s+in (?:the )?canteen|\s+today|\?|$)",
        r"\b(?:i want|give me|craving|looking for|order)\s+(?:a|an|some)?\s*([a-z\s]+?)(?:\s+under|\s+below|\s+within|\s+for|\s+with|\s+in|\.|\?|$)"
    ]

    GENERIC_WORDS = {
        "food", "something", "anything", "meal", "lunch", "dinner", "breakfast", "snack",
        "quick bite", "healthy", "spicy", "sweet", "tasty", "hot", "cold", "vegetarian",
        "non-vegetarian", "vegan", "jain", "cheap", "best", "option", "options", "items", "dishes",
        "recommendation", "suggestions", "drinks", "beverages", "desserts", "sweets"
    }

    # Extract all tokens from actual canteen menu
    menu_tokens = set()
    for f in foods:
        for word in f.name.lower().split():
            menu_tokens.add(word)
        if f.category:
            for word in f.category.lower().split():
                menu_tokens.add(word)
        if f.ingredients:
            for word in f.ingredients.lower().replace(",", " ").split():
                menu_tokens.add(word)
        if f.tags:
            for word in f.tags.lower().replace(",", " ").replace("-", " ").split():
                menu_tokens.add(word)

    for pat in inquiry_patterns:
        m = re.search(pat, lower)
        if m:
            candidate = m.group(1).strip()
            cand_words = [w for w in candidate.split() if w not in ["a", "an", "the", "some", "my", "to", "eat", "drink"]]
            if not cand_words:
                continue
            if all(w in GENERIC_WORDS for w in cand_words):
                continue

            matches_menu = any(w in menu_tokens for w in cand_words)
            if not matches_menu:
                clean_name = " ".join(cand_words).title()
                available_alts = [f for f in foods if f.available][:3]
                reply = (
                    f"Sorry, **{clean_name}** is not available on our canteen menu.\n\n"
                    f"Our canteen offers freshly made campus meals including rolls, rice dishes, dosas, sandwiches, snacks, and drinks. "
                    f"Here are some top picks currently available:"
                )
                followups = [f"Order {m.name}" for m in available_alts[:2]] + ["Browse full menu", "Dishes under ₹100"]
                return reply, available_alts, followups

    return None


