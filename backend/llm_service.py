import os
import re
import json
from typing import Optional, Dict, Any, Tuple, List
import httpx
from schemas import (
    PreferenceQuery, RecommendationCard, MealCombination,
    FoodComparisonResult, FoodOut, ChatIntent, ChatResponseType, OrderAction,
    StructuredConstraints, StructuredPreferences, StructuredIntent
)

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
        re.search(r"(?:under|below|within|budget(?:\s*of|\s*is|\s*:)?|max(?:imum)?)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)(?!\s*(?:mins?|minutes?|m\b|hours?|hrs?))", lower) or
        re.search(r"(?:have)\s*(?:₹|rs\.?)\s*(\d+(?:\.\d+)?)", lower) or
        re.search(r"\b(\d{2,4})\s*(?:budget|only)\b(?!\s*(?:mins?|minutes?|m\b))", lower)
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
    Classifies student message into explicit 15-intent taxonomy:
    - ChatIntent.ORDER_FOOD
    - ChatIntent.COMPARE_FOOD
    - ChatIntent.BUILD_COMBO
    - ChatIntent.MODIFY_PREFERENCE
    - ChatIntent.ASK_PRICE
    - ChatIntent.ASK_AVAILABILITY
    - ChatIntent.ASK_FOOD_DETAILS
    - ChatIntent.ASK_NUTRITION
    - ChatIntent.VIEW_NUTRITION
    - ChatIntent.SEARCH_FOOD
    - ChatIntent.GREETING
    - ChatIntent.HELP
    - ChatIntent.UNCLEAR
    - ChatIntent.RECOMMEND_FOOD
    """
    lower = message.strip().lower()

    # 1. ORDER_FOOD
    if re.search(r"\b(?:add (?:it|that|the [a-z0-9\s]+|this|combo|pick)?\s*to (?:my )?order|order (?:it|that|the [a-z0-9\s]+|this)?|i want to order|buy (?:it|that|the [a-z0-9\s]+))\b", lower):
        return ChatIntent.ORDER_FOOD

    # 2. COMPARE_FOOD (dish vs dish)
    if re.search(r"\b(?:vs\.?|versus)\b", lower) or \
       re.search(r"\bcompare\s+[a-z0-9\s]+?\s+(?:and|with|to)\b", lower) or \
       re.search(r"\bwhich\s+(?:one\s+)?(?:is\s+better|is\s+healthier|has\s+more\s+protein|is\s+cheaper|is\s+faster)\b", lower):
        return ChatIntent.COMPARE_FOOD

    # 3. BUILD_COMBO
    if re.search(r"\b(?:build|make|suggest|give me)?\s*(?:a\s+)?combo\b", lower) or \
       re.search(r"\bpair\s+(?:it\s+)?with\s+(?:a\s+)?(?:drink|beverage|side|snack)\b", lower):
        return ChatIntent.BUILD_COMBO

    # 4. VIEW_NUTRITION
    if re.search(r"\b(?:show|view)\s+(?:nutrition|macros|macro goals)\b", lower) or \
       lower in ["show nutrition", "view nutrition", "nutrition facts", "macros"]:
        return ChatIntent.VIEW_NUTRITION

    # 5. MODIFY_PREFERENCE (mind changing, natural adjustments, exclusions)
    if re.search(r"\b(?:make\s+it\s+cheaper|cheaper|something\s+cheaper|cheapest\s+option)\b", lower) or \
       re.search(r"\b(?:something\s+faster|faster|quicker|less\s+prep\s+time|less\s+time)\b", lower) or \
       re.search(r"\b(?:more\s+protein|higher\s+protein|give\s+me\s+more\s+protein)\b", lower) or \
       re.search(r"\b(?:not\s+[a-z]+|no\s+[a-z]+|without\s+[a-z]+|don'?t\s+want\s+[a-z]+|skip\s+[a-z]+|exclude\s+[a-z]+)\b", lower) or \
       re.search(r"\b(?:not\s+spicy|less\s+spicy|no\s+spicy|mild|i\s+don'?t\s+want\s+spicy)\b", lower) or \
       re.search(r"\b(?:actually\s+i\s+have|my\s+budget\s+is|have\s+₹?\d+\s*only)\b", lower) or \
       re.search(r"\b(?:forget\s+(?:my\s+)?previous|start\s+over|reset\s+(?:session)?|restart)\b", lower) or \
       re.search(r"\b(?:something\s+different|something\s+else|different\s+option|show\s+more)\b", lower):
        return ChatIntent.MODIFY_PREFERENCE

    # 6. ASK_PRICE
    if re.search(r"\b(?:cheapest|lowest\s+price)\b", lower) or \
       re.search(r"\bhow\s+much\s+(?:is|does|cost)\b", lower) or \
       re.search(r"\bwhat\s+is\s+the\s+price\b", lower) or \
       re.search(r"\bprice\s+of\b", lower) or \
       re.search(r"\bcost\s+of\b", lower):
        return ChatIntent.ASK_PRICE

    # 7. ASK_AVAILABILITY
    if re.search(r"\bis\s+.*\s+(available|in\s+stock)\b", lower) or \
       re.search(r"\bdo\s+you\s+have\s+.*\s+(available|today|now)\b", lower) or \
       re.search(r"\bdo\s+you\s+have\b", lower):
        return ChatIntent.ASK_AVAILABILITY

    # 8. ASK_FOOD_DETAILS
    if re.search(r"\bwhat\s+(?:is|are)\s+(?:inside|in)\b", lower) or \
       re.search(r"\bwhat\s+are\s+the\s+ingredients\b", lower) or \
       re.search(r"\bhow\s+big\s+is\b", lower) or \
       re.search(r"\bserving\s+size\b", lower) or \
       re.search(r"\btell\s+me\s+about\b", lower):
        return ChatIntent.ASK_FOOD_DETAILS

    # 9. ASK_NUTRITION
    if re.search(r"\b(highest|most|max)\s+protein\b", lower) or \
       re.search(r"\b(lowest|least|min)\s+(calories?|cals?|fat)\b", lower) or \
       re.search(r"\bhow\s+much\s+(protein|calories?|cals?|carbs?|fat|sugar|fiber)\b", lower) or \
       re.search(r"\bhow\s+many\s+calories?\b", lower) or \
       re.search(r"\bis\s+.*\s+(?:low\s+calorie|healthy|high\s+protein)\b", lower):
        return ChatIntent.ASK_NUTRITION

    # 10. SEARCH_FOOD
    if re.search(r"\b(?:search|find|show\s+all|list\s+all)\b", lower) or \
       re.search(r"\b(?:what\s+(?:dishes|items|food)\s+(?:have|has|contain)|dishes\s+with|items\s+with|food\s+with)\b", lower) or \
       re.search(r"\bshow\s+(?:all\s+)?(?:drinks|beverages|rolls|sandwiches|desserts|items|dishes|sweets)\b", lower):
        return ChatIntent.SEARCH_FOOD

    # 11. GREETING
    if re.match(r"^(hi|hello|hey|greetings|hola|sup|good morning|good afternoon|good evening|yo)[\s!.,?]*$", lower):
        return ChatIntent.GREETING

    # 12. HELP
    if lower in ["help", "who are you", "what can you do", "what is bitebuddy", "options", "commands", "how does this work"]:
        return ChatIntent.HELP

    # 13. UNCLEAR
    if lower in ["i don't know", "idk", "whatever", "maybe", "not sure", "anything", "dunno"]:
        return ChatIntent.UNCLEAR

    # Default to RECOMMEND_FOOD
    return ChatIntent.RECOMMEND_FOOD


def extract_comparison_targets(message: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extracts two candidate dish names from comparison queries.
    e.g. 'Maggi vs Paneer Roll' -> ('maggi', 'paneer roll')
    """
    lower = message.strip().lower()
    # 1. "A vs B" or "A versus B"
    m = re.search(r"([a-z0-9\s]+?)\s+(?:vs\.?|versus)\s+([a-z0-9\s\?]+)", lower)
    if m:
        return m.group(1).strip(), m.group(2).strip("? ").strip()
    # 2. "compare A and/with B"
    m = re.search(r"compare\s+([a-z0-9\s]+?)\s+(?:and|with|to)\s+([a-z0-9\s\?]+)", lower)
    if m:
        return m.group(1).strip(), m.group(2).strip("? ").strip()
    # 3. "which ... : A or B"
    m = re.search(r"which(?:\s+one)?\s+[a-z\s]+?:\s*([a-z0-9\s]+?)\s+or\s+([a-z0-9\s\?]+)", lower)
    if m:
        return m.group(1).strip(), m.group(2).strip("? ").strip()
    # 4. "which is better A or B"
    m = re.search(r"which(?:\s+is)?\s+(?:better|healthier|faster|cheaper)\s+([a-z0-9\s]+?)\s+or\s+([a-z0-9\s\?]+)", lower)
    if m:
        return m.group(1).strip(), m.group(2).strip("? ").strip()
    return None, None


def parse_to_structured_intent(message: str) -> StructuredIntent:
    """
    Phase 3: Converts natural language into strict structured intent and constraints.
    Unknown values MUST be null/empty. Never infer missing information.
    """
    text = message.strip()
    lower = text.lower()

    if re.search(r"-\s*₹?\s*\d+|₹\s*-\s*\d+|budget\s*:\s*-\d+", lower):
        raise ValueError("Budget cannot be negative")

    # 1. Classify intent
    intent = classify_chat_intent(message)

    # 2. Budget constraint (max_price)
    max_price = None
    budget_match = (
        re.search(r"(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)", lower) or
        re.search(r"(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees|bucks)", lower) or
        re.search(r"(?:under|below|within|budget(?:\s*of|\s*is|\s*:)?|max(?:imum)?)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)(?!\s*(?:mins?|minutes?|m\b|hours?|hrs?))", lower) or
        re.search(r"(?:have)\s*(?:₹|rs\.?)\s*(\d+(?:\.\d+)?)", lower) or
        re.search(r"\b(\d{2,4})\s*(?:budget|only)\b(?!\s*(?:mins?|minutes?|m\b))", lower)
    )
    if budget_match:
        try:
            max_price = float(budget_match.group(1))
        except (ValueError, TypeError):
            max_price = None

    # 3. Preparation time constraint (max_preparation_time)
    max_prep_time = None
    time_match = (
        re.search(r"(\d+)\s*(?:mins?|minutes?)\b", lower) or
        re.search(r"(?:in|within)\s*(\d+)\s*(?:mins?|minutes?|m)\b", lower) or
        re.search(r"(\d+)\s*m\b(?:\s*break|\s*limit)", lower)
    )
    if time_match:
        try:
            max_prep_time = int(time_match.group(1))
        except (ValueError, TypeError):
            max_prep_time = None

    # 4. Dietary constraints (diet: List[str])
    diets = []
    if re.search(r"\b(vegan|plant-based)\b", lower):
        diets.append("vegan")
    elif re.search(r"\b(jain)\b", lower):
        diets.append("jain")
    elif re.search(r"\b(non-?veg|non-?vegetarian)\b", lower):
        diets.append("non-vegetarian")
    elif re.search(r"\b(pure\s+veg|vegetarian|\bveg\b)\b", lower) and not re.search(r"\b(non-?veg|non-?vegetarian)\b", lower):
        diets.append("vegetarian")

    # 5. Allergies (allergies: List[str])
    allergies = []
    if re.search(r"\b(peanut|peanuts|groundnut|nut|nuts|walnut|cashew|almond)\s*(?:allergy|allergic)\b", lower) or \
       re.search(r"\ballergic\s+to\s+(?:peanuts?|nuts?|groundnuts?|walnuts?)\b", lower):
        allergies.append("nuts")
        allergies.append("peanuts")
    if re.search(r"\b(dairy|milk|lactose)\s*(?:allergy|allergic|intoleran(?:t|ce))\b", lower) or \
       re.search(r"\ballergic\s+to\s+(?:dairy|milk|lactose)\b", lower):
        allergies.append("dairy")
    if re.search(r"\b(gluten|wheat)\s*(?:allergy|allergic|intoleran(?:t|ce)|celiac)\b", lower) or \
       re.search(r"\ballergic\s+to\s+(?:gluten|wheat)\b", lower):
        allergies.append("gluten")
    if re.search(r"\begg\s*(?:allergy|allergic)\b", lower) or \
       re.search(r"\ballergic\s+to\s+eggs?\b", lower):
        allergies.append("egg")

    # 6. Exclusions (exclusions: List[str])
    exclusions = []
    excl_patterns = [
        r"(?:no|without|skip|exclude|avoid|don'?t\s+want)\s+([a-zA-Z]+)",
        r"not\s+([a-zA-Z]+)"
    ]
    for pattern in excl_patterns:
        for m in re.finditer(pattern, lower):
            word = m.group(1).strip()
            if word in EXCLUSION_WORDS or any(ex in word for ex in EXCLUSION_WORDS):
                if word not in exclusions:
                    exclusions.append(word)

    # 7. Preferences (spicy, sweet, high_protein, low_calorie, cuisine, mood, craving)
    spicy = None
    if re.search(r"\b(not\s+spicy|no\s+spicy|mild|non-spicy|less\s+spicy|i\s+don'?t\s+want\s+spicy)\b", lower):
        spicy = False
    elif re.search(r"\b(spicy|teekha|hot|masaledar|chilli)\b", lower):
        spicy = True

    sweet = True if re.search(r"\b(sweet|meetha|dessert)\b", lower) else None
    high_protein = True if re.search(r"\b(high\s+protein|more\s+protein|protein\s+rich|protein)\b", lower) else None
    low_calorie = True if re.search(r"\b(low\s+calorie|light\s+meal|healthy|diet\s+food)\b", lower) else None

    cuisine = None
    if re.search(r"\b(south indian|dosa|idli|sambar)\b", lower):
        cuisine = "South Indian"
    elif re.search(r"\b(chinese|indo-chinese|hakka|schezwan|manchurian)\b", lower):
        cuisine = "Indo-Chinese"
    elif re.search(r"\b(north indian|punjabi|mughlai|biryani)\b", lower):
        cuisine = "North Indian"

    mood = None
    for pattern, mood_name in MOOD_PATTERNS:
        if re.search(pattern, lower):
            mood = mood_name
            break

    craving = None
    for pattern, craving_name in CRAVING_PATTERNS:
        if re.search(pattern, lower):
            if not re.search(rf"(?:no|don'?t\s+want|without|exclude|not)\s+{craving_name}", lower):
                craving = craving_name
                break

    target_a, target_b = extract_comparison_targets(message)

    return StructuredIntent(
        intent=intent,
        target_item_name=target_a,
        target_dish_b_name=target_b,
        constraints=StructuredConstraints(
            max_price=max_price,
            max_preparation_time=max_prep_time,
            diet=diets,
            allergies=allergies,
            exclusions=exclusions
        ),
        preferences=StructuredPreferences(
            spicy=spicy,
            sweet=sweet,
            high_protein=high_protein,
            low_calorie=low_calorie,
            cuisine=cuisine,
            mood=mood,
            craving=craving
        )
    )


def generate_grounded_explanation(
    recommendations: List[RecommendationCard],
    query_intent: StructuredIntent,
    failing_constraints: Optional[Dict[str, Any]] = None,
    closest_match: Optional[RecommendationCard] = None,
    combo: Optional[MealCombination] = None
) -> str:
    """
    Phase 18 & Phase 26: Menu-grounded, concise explanation.
    Never invents items, prices, calories, or availability.
    """
    if not recommendations:
        if failing_constraints:
            parts = ["I couldn't find an available canteen item that satisfies all of those requirements:"]
            if "budget" in failing_constraints:
                b = failing_constraints["budget"]
                parts.append(f"• **Budget**: ₹{int(b['user_budget'])} (lowest available item is ₹{int(b['lowest_available'])})")
            if "time" in failing_constraints:
                t = failing_constraints["time"]
                parts.append(f"• **Time**: {t['user_time']} mins (fastest items take {t['fastest_available']} mins)")
            if "diet" in failing_constraints:
                d = failing_constraints["diet"]
                parts.append(f"• **Diet**: {d.get('message', 'No dishes match diet')}")
            if "protein" in failing_constraints:
                p = failing_constraints["protein"]
                parts.append(f"• **Goal**: High protein (max canteen item has {int(p['highest_available'])}g)")

            if closest_match:
                item = closest_match.item
                diff_note = ", ".join(closest_match.reasons)
                parts.append(f"\n**Closest available option**:\n• **{item.name}** — ₹{int(item.price)} ({diff_note})")

            parts.append("\nWould you like to increase your budget or preparation time?")
            return "\n".join(parts)
        else:
            return "I couldn't find any available canteen item matching all your criteria. Try adjusting your budget, time limit, or restrictions."

    top_card = recommendations[0]
    top_item = top_card.item

    lines = []
    lines.append("Got it! Here are the best available options from our canteen:")
    lines.append("")
    lines.append(f"🌟 **Top Pick: {top_item.name}**")
    lines.append(f"₹{int(top_item.price)} • {top_item.preparation_time} min • {int(top_item.calories or 0)} kcal • {int(top_item.protein or 0)}g protein • **{top_card.match_percentage}% Match**")
    if top_card.reasons:
        lines.append("• " + " • ".join(top_card.reasons[:3]))

    if combo:
        lines.append("")
        lines.append(f"💡 **Recommended Combo**: Pair with **{combo.side_item.name}** for a complete meal (₹{int(combo.total_price)} total, {combo.max_prep_time}m prep).")

    if len(recommendations) > 1:
        lines.append("")
        lines.append("**Other great alternatives**:")
        for alt in recommendations[1:3]:
            lines.append(f"• **{alt.item.name}** (₹{int(alt.item.price)} • {alt.item.preparation_time} min • {alt.match_percentage}% Match)")

    lines.append("")
    lines.append("Want something cheaper, faster, or higher in protein?")

    return "\n".join(lines)


def find_food_by_name(text: str, foods: List[Any]) -> Optional[Any]:
    """Finds a food item in database by name, nickname, or substring."""
    if not text:
        return None
    lower = text.strip().lower()

    # Direct match
    for f in foods:
        if f.name.lower() == lower:
            return f

    # Nickname match
    for f in foods:
        if _match_dish_nickname(lower, f.name.lower()):
            return f

    # Substring match
    for f in foods:
        if f.name.lower() in lower or lower in f.name.lower():
            return f

    # Token match
    tokens = [w for w in lower.split() if len(w) > 3 and w not in ["with", "have", "some", "want", "more", "less", "dish", "food"]]
    for f in foods:
        if any(t in f.name.lower() for t in tokens):
            return f

    return None


def generate_food_comparison(message: str, foods: List[Any]) -> Optional[FoodComparisonResult]:
    """
    Builds a grounded, factual comparison between two menu dishes per Section 11.
    """
    target_a_str, target_b_str = extract_comparison_targets(message)
    if not target_a_str or not target_b_str:
        return None

    item_a = find_food_by_name(target_a_str, foods)
    item_b = find_food_by_name(target_b_str, foods)

    if not item_a or not item_b:
        return None

    out_a = FoodOut.model_validate(item_a)
    out_b = FoodOut.model_validate(item_b)

    highlights = []
    # Protein comparison
    prot_diff = round((out_a.protein or 0) - (out_b.protein or 0), 1)
    if prot_diff > 2:
        highlights.append(f"💪 **{out_a.name}** has **{int(out_a.protein or 0)}g protein** (+{int(prot_diff)}g more than {out_b.name})")
    elif prot_diff < -2:
        highlights.append(f"💪 **{out_b.name}** has **{int(out_b.protein or 0)}g protein** (+{int(abs(prot_diff))}g more than {out_a.name})")
    else:
        highlights.append(f"💪 Both offer similar protein (~{int(out_a.protein or 0)}g)")

    # Price comparison
    price_diff = out_a.price - out_b.price
    if price_diff > 10:
        highlights.append(f"💰 **{out_b.name}** is more budget-friendly at ₹{int(out_b.price)} (₹{int(price_diff)} cheaper)")
    elif price_diff < -10:
        highlights.append(f"💰 **{out_a.name}** is more budget-friendly at ₹{int(out_a.price)} (₹{int(abs(price_diff))} cheaper)")
    else:
        highlights.append(f"💰 Similar price point (₹{int(out_a.price)} vs ₹{int(out_b.price)})")

    # Time comparison
    if out_a.preparation_time < out_b.preparation_time:
        highlights.append(f"⏱️ **{out_a.name}** is faster ({out_a.preparation_time}m vs {out_b.preparation_time}m)")
    elif out_b.preparation_time < out_a.preparation_time:
        highlights.append(f"⏱️ **{out_b.name}** is faster ({out_b.preparation_time}m vs {out_a.preparation_time}m)")

    # Summary verdict per Section 11
    if (out_a.protein or 0) > (out_b.protein or 0):
        verdict = f"If you want more protein, go with **{out_a.name}** ({int(out_a.protein or 0)}g). If you prefer a lighter or faster option, **{out_b.name}** is a great choice!"
    elif (out_b.protein or 0) > (out_a.protein or 0):
        verdict = f"If you want more protein, go with **{out_b.name}** ({int(out_b.protein or 0)}g). If you prefer a lighter or faster option, **{out_a.name}** is a great choice!"
    elif out_a.price < out_b.price:
        verdict = f"If budget is your priority, **{out_a.name}** saves you ₹{int(out_b.price - out_a.price)}. Otherwise, **{out_b.name}** is delicious!"
    else:
        verdict = f"Both **{out_a.name}** and **{out_b.name}** are top campus favorites. Choose {out_a.name} for {out_a.cuisine} flavors or {out_b.name} for {out_b.category}!"

    return FoodComparisonResult(
        dish_a=out_a,
        dish_b=out_b,
        verdict=verdict,
        highlights=highlights
    )


def handle_food_reference_question(message: str, item: FoodOut) -> str:
    """Answers follow-up questions targeting a specific previously recommended item."""
    lower = message.lower()

    if "protein" in lower:
        return f"**{item.name}** contains approximately **{int(item.protein or 0)}g of protein** ({int(item.calories or 0)} kcal, ₹{int(item.price)})."
    if "calorie" in lower or "cal" in lower:
        return f"**{item.name}** has approximately **{int(item.calories or 0)} kcal** ({int(item.protein or 0)}g protein, {int(item.carbohydrates or 0)}g carbs, {int(item.fat or 0)}g fat)."
    if "price" in lower or "cost" in lower or "how much" in lower:
        return f"**{item.name}** is priced at **₹{int(item.price)}**."
    if "spicy" in lower:
        status = "spicy 🌶️" if item.spicy else "mild / not spicy"
        return f"**{item.name}** is **{status}**."
    if "veg" in lower:
        diet = "100% vegetarian 🌱" if item.vegetarian else "non-vegetarian 🍗"
        if item.vegan:
            diet = "100% vegan / plant-based 🌿"
        return f"**{item.name}** is **{diet}**."
    if "prep" in lower or "time" in lower or "ready" in lower or "fast" in lower:
        return f"**{item.name}** takes approximately **{item.preparation_time} minutes** to prepare."
    if "ingredient" in lower or "inside" in lower or "in it" in lower:
        ingrs = item.ingredients or "Fresh canteen ingredients"
        return f"**{item.name}** contains: {ingrs}."

    return (
        f"**{item.name}** details:\n"
        f"• **Price**: ₹{int(item.price)}\n"
        f"• **Prep Time**: {item.preparation_time} mins\n"
        f"• **Nutrition**: {int(item.calories or 0)} kcal | {int(item.protein or 0)}g Protein | {int(item.carbohydrates or 0)}g Carbs | {int(item.fat or 0)}g Fat\n"
        f"• **Ingredients**: {item.ingredients}"
    )


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

    if intent in [ChatIntent.GREETING, "greeting"]:
        return [
            "Under ₹120 spicy lunch",
            "High protein vegetarian meal",
            "Ready in under 10 minutes",
            "Show budget snacks under ₹50"
        ]

    if intent in [ChatIntent.COMPARE_FOOD, "compare_food"]:
        return [
            "Add dish 1 to order",
            "Add dish 2 to order",
            "Under ₹100 meal",
            "What's fastest?"
        ]

    if intent in [ChatIntent.ORDER_FOOD, "order_food"]:
        return [
            "Pair with a drink",
            "Add a dessert",
            "View my order",
            "What's ready in 5 mins?"
        ]

    if intent in [ChatIntent.ASK_NUTRITION, "nutrition_inquiry"]:
        return [
            "Add top pick to order",
            "Show other high protein options",
            "Under ₹100 meal",
            "Pair with a drink"
        ]

    if intent in [ChatIntent.ASK_PRICE, ChatIntent.ASK_AVAILABILITY, ChatIntent.ASK_FOOD_DETAILS, ChatIntent.SEARCH_FOOD, "menu_inquiry"]:
        return [
            "Add to my order",
            "Show spicy alternatives",
            "Dishes under ₹80",
            "What's ready in 5 minutes?"
        ]

    # Recommendation follow-ups & quick action chips (Section 25)
    chips: List[str] = [
        "Cheaper",
        "Faster",
        "More Protein",
        "Something Spicy"
    ]
    if top_pick:
        chips.append(f"How much protein in {top_pick.item.name}?")
        chips.append(f"Add {top_pick.item.name} to order")

    return chips[:5]


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
            if not f.available:
                # FIRST state that item is not available, THEN recommend available alternatives!
                alts = [
                    alt for alt in foods 
                    if alt.available and alt.item_id != f.item_id and (
                        alt.category == f.category or (alt.vegetarian == f.vegetarian and alt.spicy == f.spicy)
                    )
                ]
                if not alts:
                    alts = [alt for alt in foods if alt.available and alt.vegetarian == f.vegetarian]
                if not alts:
                    alts = [alt for alt in foods if alt.available]
                selected_alts = alts[:3]
                reply = (
                    f"Sorry, **{f.name}** is currently **unavailable (sold out)** in the canteen.\n\n"
                    f"Here are some delicious available alternatives we recommend instead:"
                )
                return reply, selected_alts, [f"Order {a.name}" for a in selected_alts[:2]] + ["Browse full menu", "Dishes under ₹100"]
            else:
                reply = (
                    f"Yes, **{f.name}** is in stock and available right now! 🎉\n\n"
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


# ==================================================
# Relevance & Domain Scope Safeguards
# ==================================================

FOOD_AND_CANTEEN_KEYWORDS = {
    # Meals & courses
    "food", "meal", "meals", "lunch", "dinner", "breakfast", "snack", "snacks",
    "brunch", "combo", "combos", "thali", "platter", "bite", "bites", "dish",
    "dishes", "cuisine", "item", "items", "eat", "eating", "feed", "taste",
    "hungry", "starving", "craving", "crave", "cravings", "appetite",
    "delicious", "tasty", "yum", "yummy",

    # Specific food categories & popular dishes
    "roll", "rolls", "sandwich", "sandwiches", "toast", "burger", "burgers",
    "pizza", "pizzas", "pasta", "pastas", "maggi", "noodles", "rice", "biryani",
    "pulao", "dosa", "dosas", "idli", "idlis", "vada", "pav", "samosa",
    "samosas", "cutlet", "cutlets", "poha", "chole", "bhature", "dal", "roti",
    "naan", "paratha", "curry", "sabzi", "gravy", "paneer", "chicken", "egg",
    "eggs", "omelette", "bhurji", "fish", "mutton", "meat", "tofu", "salad",
    "soup", "fries", "french fries", "momos", "momo", "dimsum", "chaat",
    "bhel", "kachori", "dessert", "desserts", "sweet", "sweets", "gulab jamun",
    "brownie", "brownies", "cake", "ice cream", "pastry", "custard", "halwa",
    "jalebi", "cookie", "cookies", "biscuit", "biscuits", "bun", "maska",
    "sourdough", "taco", "tacos", "burrito", "wrap", "wraps", "shawarma",
    "kebab", "kebabs", "falafel", "sushi", "ramen", "dumpling", "dumplings",
    "waffle", "waffles", "pancake", "pancakes", "milkshake", "shake", "smoothie",

    # Beverages & drinks
    "drink", "drinks", "beverage", "beverages", "coffee", "cold coffee",
    "espresso", "cappuccino", "tea", "chai", "soda", "lime soda", "lemonade",
    "lassi", "mango lassi", "juice", "water", "cold drink", "boba",

    # Diets & dietary attributes
    "veg", "vegetarian", "pure veg", "non-veg", "non-vegetarian", "vegan",
    "jain", "eggitarian", "halal", "kosher", "gluten", "gluten-free",
    "dairy", "dairy-free", "nut-free", "lactose", "spicy", "mild", "sweet",
    "savory", "tangy", "cheesy", "crispy", "fried", "baked", "hot", "cold",
    "warm", "fresh", "healthy", "light", "heavy", "filling", "oily", "greasy",

    # Nutrition & macros
    "nutrition", "nutrient", "nutrients", "macro", "macros", "calorie",
    "calories", "cals", "kcal", "protein", "carbs", "carbohydrates", "fat",
    "fats", "fiber", "sugar", "sodium", "salt", "gym", "workout", "diet",
    "weight", "fitness", "bulk", "cutting",

    # Canteen & operations
    "canteen", "cafeteria", "cafe", "kitchen", "campus", "college", "chef",
    "cook", "ramesh", "owner", "counter", "token", "order", "orders",
    "ordering", "cart", "tray", "menu", "price", "prices", "pricing",
    "cost", "cheap", "cheapest", "affordable", "expensive", "budget",
    "rupee", "rupees", "rs", "inr", "bucks", "bill", "pay", "payment",
    "available", "availability", "stock", "in stock", "out of stock", "sold out",
    "prep", "preparation", "time", "minutes", "mins", "min", "fast", "quick",
    "speed", "rush", "break", "recess", "lecture", "class", "served", "serve",
    "serving",

    # Bot assistant meta & polite conversational
    "bitebuddy", "canteenai", "assistant", "bot", "ai", "help", "hi", "hello",
    "hey", "hola", "greetings", "good morning", "good afternoon", "good evening",
    "good night", "yo", "sup", "howdy", "thanks", "thank you", "bye", "goodbye",
    "see you", "ok", "okay", "cool", "nice", "awesome", "great", "perfect",
    "clear", "reset", "restart", "who are you", "what can you do"
}

IRRELEVANT_PATTERNS = [
    # 1. Programming, coding, computer science, software
    r"\b(?:python|javascript|typescript|java|c\+\+|golang|rust|ruby|php|html|css|sql|nosql|docker|kubernetes|linux|ubuntu|windows|bash|shell)\b",
    r"\b(?:code|coding|script|function|class|method|compiler|debugger|git|github|regex|api key|variable|algorithm|data structure|binary tree|linked list|stack|queue|hash map)\b",
    r"\b(?:write a (?:program|code|script|function|query|class)|debug my|fix (?:this )?error|syntax error|stackoverflow)\b",

    # 2. Math, physics, chemistry, biology (non-nutritional), homework
    r"\b(?:solve|calculate|equation|derivative|integral|calculus|algebra|geometry|theorem|pythagoras|logarithm|trigonometry)\b",
    r"\b(?:\d+\s*[\+\-\*\/]\s*\d+\s*=|\b\d+x\b|\bx\s*\+\s*y\b|\bsqrt\b|\bsin\(\b|\bcos\(\b)",
    r"\b(?:physics|chemistry|quantum|thermodynamics|newton's|einstein|gravity|periodic table|photosynthesis|mitosis|dna replication)\b",
    r"\b(?:homework|assignment|essay on|thesis|dissertation|exam preparation|solve for x)\b",

    # 3. Politics, world affairs, history, geography (non-canteen)
    r"\b(?:president of|prime minister of|parliament|congress|senate|election|vote for|politics|political party|democrat|republican)\b",
    r"\b(?:capital of|who invented|who discovered|world war|battle of|independence day|history of [a-z]+|monarchy|constitution)\b",
    r"\b(?:population of|currency of|continent of|geography of|mount everest|pacific ocean|how many countries)\b",

    # 4. Sports, movies, celebrities, pop culture
    r"\b(?:who won the (?:match|game|cup|series|trophy|ipl|fifa|world cup)|football score|cricket score|tennis match)\b",
    r"\b(?:messi|ronaldo|virat kohli|dhoni|lebron|nba|premier league|champions league)\b",
    r"\b(?:movie|film|cinema|actor|actress|hollywood|bollywood|netflix|hbo|oscar|grammy|emmy|box office)\b",
    r"\b(?:singer|song|lyrics of|album|taylor swift|bts|drake|eminem|ariana grande)\b",

    # 5. Non-canteen services, vehicle/tech repair, personal advice, finance
    r"\b(?:car engine|flat tire|repair my|change oil|vehicle|bike engine|flight booking|hotel booking|train ticket)\b",
    r"\b(?:phone screen|iphone battery|laptop repair|wifi not working|bluetooth connection|printer offline)\b",
    r"\b(?:headache medicine|paracetamol|antibiotic|cure for|fever treatment|medical diagnosis|disease symptom)\b",
    r"\b(?:crypto|bitcoin|ethereum|stock market|shares|mutual fund|trading|forex|investing advice)\b",
    r"\b(?:dating advice|relationship advice|astrology|horoscope|zodiac sign|meaning of life)\b",

    # 6. General non-canteen creative writing / non-food requests
    r"\b(?:write a (?:story|poem|song|essay|play|novel|rap)|tell me a story about)\b"
]


def check_relevance(message: str) -> Tuple[bool, Optional[str]]:
    """
    Determines if the student's message is irrelevant / unrelated to the BiteBuddy college canteen system.
    Returns (is_irrelevant, reason).
    """
    clean = message.strip()
    lower = clean.lower()

    tokens = set(re.findall(r"\b[a-z0-9]+\b", lower))
    if not tokens:
        return True, "Empty or non-text message"

    # 1. Check explicit non-canteen/irrelevant patterns
    for pat in IRRELEVANT_PATTERNS:
        if re.search(pat, lower):
            return True, "Matches non-canteen topic"

    # 2. Check if any token matches our extensive Food & Canteen domain keywords
    if any(t in FOOD_AND_CANTEEN_KEYWORDS for t in tokens):
        return False, None

    # 3. Check if message contains known off-menu food dishes
    for off_key in OFF_MENU_FOOD_MAP:
        if re.search(rf"\b{re.escape(off_key)}\b", lower):
            return False, None

    # 4. Check price expressions (e.g., "100 rs", "₹ 50", "under 120", "below 80")
    if re.search(r"(?:₹|rs\.?|inr|\brupees\b|\bbucks\b|\bunder\s*\d+|\bbelow\s*\d+|\bwithin\s*\d+)", lower):
        return False, None

    # 5. Check time expressions (e.g., "10 min", "5 mins", "in a hurry")
    if re.search(r"\b\d+\s*(?:mins?|minutes?|m)\b", lower) or re.search(r"\b(rush|hurry|break|recess)\b", lower):
        return False, None

    # 6. Check common polite greetings & acknowledgements
    GREETING_PHRASES = [
        "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
        "yo", "sup", "howdy", "thanks", "thank you", "bye", "goodbye", "see you",
        "who are you", "what can you do", "help", "help me", "start", "menu"
    ]
    if any(phrase in lower for phrase in GREETING_PHRASES):
        return False, None

    # 7. Check conversational mind-changing, refinement, comparison, and ordering patterns
    RELEVANT_CONVERSATIONAL_PATTERNS = [
        r"\b(?:cheaper|cheapest|faster|quicker|speed|protein|calorie|calories|spicy|mild)\b",
        r"\b(?:not|no|without|skip|avoid|don'?t\s+want)\b",
        r"\b(?:order|tray|cart|add\s+to|add\s+it|buy|have\s+that)\b",
        r"\b(?:reset|start\s+over|restart|forget)\b",
        r"\b(?:different|other|another|more|less)\b",
        r"\b(?:first|second|third|1st|2nd|3rd)\b",
        r"\b(?:vs|versus|compare|healthier|better)\b",
        r"\b(?:combo|pair)\b",
    ]
    if any(re.search(pat, lower) for pat in RELEVANT_CONVERSATIONAL_PATTERNS):
        return False, None

    # If none of the food/canteen keywords, off-menu foods, prices, time limits, or greetings match,
    # and the message is a general query, it is irrelevant to our canteen app.
    return True, "No food, dining, nutrition, or canteen context found"


def _match_dish_nickname(lower: str, f_name_lower: str) -> bool:
    """Matches common shortened names or nicknames to target canteen dishes."""
    NICKNAME_MAP = {
        "paneer roll": "paneer kathi roll",
        "chicken roll": "chicken tikka roll",
        "aloo roll": "aloo corn roll",
        "cheese sandwich": "cheese grilled sandwich",
        "grilled sandwich": "cheese grilled sandwich",
        "veg sandwich": "bombay veg sandwich",
        "dosa": "masala dosa",
        "idli": "idli sambar (2 pcs)",
        "vada pav": "mumbai vada pav",
        "samosa": "samosa (2 pcs)",
        "cutlet": "veg cutlet (2 pcs)",
        "poha": "indori poha",
        "maggi": "classic masala maggi",
        "noodles": "veg hakka noodles",
        "hakka noodles": "veg hakka noodles",
        "fried rice": "schezwan fried rice",
        "veg biryani": "hyderabadi veg biryani",
        "chicken biryani": "dum chicken biryani",
        "rajma chawal": "punjabi rajma chawal",
        "chole bhature": "amritsari chole bhature",
        "dal makhani": "dal makhani thali",
        "chilli paneer": "chilli paneer dry",
        "chilli chicken": "chilli chicken dry",
        "cold coffee": "iced cold coffee",
        "mango lassi": "alphonso mango lassi",
        "masala chai": "masala chai (cutting)",
        "chai": "masala chai (cutting)",
        "tea": "masala chai (cutting)",
        "lime soda": "fresh lime soda",
        "lemon soda": "fresh lime soda",
        "gulab jamun": "warm gulab jamun (2 pcs)",
        "brownie": "chocolate walnut brownie",
        "fruit custard": "fresh fruit custard",
        "custard": "fresh fruit custard",
        "bun maska": "bun maska",
    }
    for nick, target in NICKNAME_MAP.items():
        if target == f_name_lower and re.search(rf"\b{re.escape(nick)}\b", lower):
            return True
    return False


def check_unavailable_or_off_menu(message: str, foods: List[Any]) -> Optional[Tuple[str, List[Any], List[str], str]]:
    """
    Checks if the user requested:
    1. An on-menu canteen item that is currently UNAVAILABLE / SOLD OUT
    2. An off-menu food item (e.g. pizza, burger, momos, sushi, tacos, pasta, etc.)

    In BOTH cases, BiteBuddy FIRST states that the item is not available,
    and THEN recommends kitchen-fresh available alternatives!

    Returns (reply_text, available_alternatives, suggested_followups, intent) if matched, else None.
    """
    lower = message.strip().lower()

    # -------------------------------------------------------------
    # A. Check ON-MENU items that are currently UNAVAILABLE / SOLD OUT
    # -------------------------------------------------------------
    for f in foods:
        f_name_lower = f.name.lower()
        matched_name = False
        if re.search(rf"\b{re.escape(f_name_lower)}\b", lower):
            matched_name = True
        else:
            matched_name = _match_dish_nickname(lower, f_name_lower)

        if matched_name:
            if not f.available:
                # 1. FIRST tell user it is not available:
                reply = (
                    f"Sorry, **{f.name}** is currently **unavailable (sold out)** in our canteen kitchen.\n\n"
                    f"Here are some delicious available alternatives we recommend that are fresh and ready right now:"
                )

                # 2. THEN recommend available alternatives:
                alts = [
                    alt for alt in foods
                    if alt.available and alt.item_id != f.item_id and (
                        alt.category == f.category or (alt.vegetarian == f.vegetarian and alt.spicy == f.spicy)
                    )
                ]
                if not alts:
                    alts = [alt for alt in foods if alt.available and alt.vegetarian == f.vegetarian]
                if not alts:
                    alts = [alt for alt in foods if alt.available]

                selected_alts = alts[:3]
                followups = [f"Order {a.name}" for a in selected_alts[:2]] + ["Browse full menu", "Dishes under ₹100"]
                return reply, selected_alts, followups, "unavailable_item"

    # -------------------------------------------------------------
    # B. Check OFF-MENU foods (e.g. pizza, burger, momos, sushi, tacos)
    # -------------------------------------------------------------
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
                f"Here are some popular available alternatives we recommend you might enjoy instead:"
            )

            followups = [f"Order {m.name}" for m in matched_alts[:2]] + ["Browse full menu", "Dishes under ₹100"]
            return reply, matched_alts[:3], followups, "off_menu"

    # C. General food inquiry pattern: "do you have X", "is X available", "can I get X", "i want X"
    inquiry_patterns = [
        r"\b(?:do you (?:have|serve|make)|is there|can i (?:get|have|order)|got any|any)\s+([a-z\s]+?)(?:\s+available|\s+on the menu|\s+in (?:the )?canteen|\s+today|\?|$)",
        r"\b(?:i want|give me|craving|looking for|order)\s+(?:a\s+|an\s+|some\s+)?([a-z\s]+?)(?:\s+under|\s+below|\s+within|\s+for|\s+with|\s+in|\.|\?|$)"
    ]

    GENERIC_WORDS = {
        "food", "something", "anything", "thing", "things", "one", "meal", "lunch", "dinner", "breakfast", "snack",
        "quick bite", "healthy", "spicy", "sweet", "tasty", "hot", "cold", "vegetarian",
        "non-vegetarian", "vegan", "jain", "cheap", "best", "option", "options", "items", "dishes", "dish",
        "recommendation", "suggestions", "drinks", "beverages", "desserts", "sweets"
    }

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
                    f"Here are some top picks currently available that we recommend:"
                )
                followups = [f"Order {m.name}" for m in available_alts[:2]] + ["Browse full menu", "Dishes under ₹100"]
                return reply, available_alts, followups, "off_menu"

    return None


def check_off_menu_item(message: str, foods: List[Any]) -> Optional[Tuple[str, List[Any], List[str]]]:
    """
    Backwards-compatible wrapper over check_unavailable_or_off_menu.
    Returns (reply_text, suggested_alternatives, followups).
    """
    res = check_unavailable_or_off_menu(message, foods)
    if res:
        reply_text, alts, followups, _ = res
        return reply_text, alts, followups
    return None



