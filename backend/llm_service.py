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
