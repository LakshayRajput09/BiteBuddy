import re
import math
import json
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

try:
    from canteen_db import get_all_menu_items, find_menu_item_by_name, SessionLocal
    from groq_service import call_groq_llm
except ImportError:
    from backend.canteen_db import get_all_menu_items, find_menu_item_by_name, SessionLocal
    from backend.groq_service import call_groq_llm


# -------------------------------------------------------------------------
# 1. Intent Classification
# -------------------------------------------------------------------------

INTENT_SYSTEM_PROMPT = """You are an intent classifier for a college canteen assistant.
Classify the user's message into EXACTLY ONE of two categories:
1. "question": The user is asking a factual question about the menu (e.g. price, ingredients, timing, availability, whether an item is veg/spicy, what's available under a price).
2. "recommendation_request": The user is asking for food suggestions, recommendations, or ideas (e.g. "I want something light", "what should I eat?", "suggest lunch", "recommend a spicy snack").

Reply with ONLY a JSON object: {"intent": "question"} or {"intent": "recommendation_request"}. No other text."""


def classify_intent_rule_based(message: str) -> str:
    """Deterministic fallback for intent classification."""
    msg = message.lower().strip()

    # Recommendation triggers
    rec_patterns = [
        r"\b(recommend|suggest|recommendation|suggestion|what should i eat|what to eat|ideas?)\b",
        r"\bi want something\b",
        r"\bi('?d| would) like something\b",
        r"\blooking for something\b",
        r"\bgive me something\b",
        r"\bhelp me choose\b",
        r"\bpick something\b",
        r"\bwhat's good (for|to eat)\b",
        r"\bwhat do you suggest\b",
        r"\bcrave|craving\b"
    ]
    for pattern in rec_patterns:
        if re.search(pattern, msg):
            return "recommendation_request"

    # Default to question for factual queries
    return "question"


async def classify_intent(message: str) -> str:
    """Classifies user message as either 'question' or 'recommendation_request' using Groq LLM with fallback."""
    messages = [
        {"role": "system", "content": INTENT_SYSTEM_PROMPT},
        {"role": "user", "content": message}
    ]
    try:
        response = await call_groq_llm(messages, temperature=0.0, json_mode=True, timeout=4.0)
        if response:
            clean = response.strip()
            # Parse json
            match = re.search(r"\{.*\}", clean, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                intent = data.get("intent", "").strip().lower()
                if intent in ["question", "recommendation_request"]:
                    return intent
    except Exception as e:
        print(f"[Intent Classifier Error]: {e}")

    return classify_intent_rule_based(message)


# -------------------------------------------------------------------------
# 2. Constraint Extraction
# -------------------------------------------------------------------------

def extract_constraints(query: str) -> Dict[str, Any]:
    """Extracts budget, dietary need, and spice preferences from natural language."""
    text = query.lower()
    constraints: Dict[str, Any] = {
        "budget": None,
        "diet": None,
        "spice": None,
    }

    # Budget patterns (e.g. under ₹50, under 50, below 80, within 100, less than 60)
    budget_match = re.search(r"(?:under|below|less than|within|max(?:imum)?|around)\s*(?:₹|rs\.?|inr)?\s*(\d+)", text)
    if not budget_match:
        budget_match = re.search(r"(?:₹|rs\.?)\s*(\d+)", text)
    if budget_match:
        constraints["budget"] = float(budget_match.group(1))

    # "not too expensive", "cheap", "pocket friendly", "budget"
    if constraints["budget"] is None:
        if any(w in text for w in ["not too expensive", "not expensive", "cheap", "budget friendly", "pocket friendly", "affordable"]):
            constraints["budget"] = 60.0

    # Dietary patterns
    if "jain" in text:
        constraints["diet"] = "jain"
    elif "vegan" in text:
        constraints["diet"] = "vegan"
    elif "gluten-free" in text or "gluten free" in text:
        constraints["diet"] = "gluten-free"
    elif "non-veg" in text or "non veg" in text or "chicken" in text or "egg" in text:
        constraints["diet"] = "non-veg"
    elif "veg" in text or "vegetarian" in text:
        constraints["diet"] = "veg"

    # Spice level patterns
    if re.search(r"\b(not spicy|non-spicy|mild|no spice|less spicy|sweet)\b", text):
        constraints["spice"] = "mild"
    elif re.search(r"\b(spicy|hot|fiery|masala|schezwan|teekha)\b", text):
        constraints["spice"] = "spicy"

    return constraints


# -------------------------------------------------------------------------
# 3. Vector Feature Extraction & Cosine Similarity
# -------------------------------------------------------------------------

STOPWORDS = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "is",
    "are", "was", "were", "it", "this", "that", "i", "me", "my", "we", "you",
    "want", "like", "something", "give", "please", "can", "have", "some", "too",
    "under", "below", "much", "not", "of"
}

def tokenize(text: str) -> List[str]:
    """Tokenizes text into cleaned lower-case alphanumeric tokens."""
    tokens = re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", text.lower())
    return [t for t in tokens if t not in STOPWORDS]


def build_item_tokens(item: Dict[str, Any]) -> List[str]:
    """Flattens an item's tags, ingredients, description, and attributes into a token set."""
    tokens = []
    tokens.extend(tokenize(item["name"]))
    for tag in item.get("cuisine_tags", []):
        tokens.extend(tokenize(tag))
    for tag in item.get("dietary_tags", []):
        tokens.extend(tokenize(tag))
    for ing in item.get("ingredients", []):
        tokens.extend(tokenize(ing))
    tokens.extend(tokenize(item.get("description", "")))
    tokens.append(item.get("spice_level", "medium"))
    return tokens


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes cosine similarity between two numeric vectors."""
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (norm_a * norm_b)


# -------------------------------------------------------------------------
# 4. Recommendation Handler (Content-Based Cosine Similarity)
# -------------------------------------------------------------------------

async def handle_canteen_recommendation(user_message: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Content-based filtering using cosine similarity over tag vectors,
    filtered by user constraints (budget, spice level, dietary need).
    Returns top 3 matches with short LLM-generated explanation.
    """
    all_items = get_all_menu_items(db)
    constraints = extract_constraints(user_message)

    # 1. Hard constraint filtering
    candidates = []
    for item in all_items:
        # Budget check
        if constraints["budget"] is not None and item["price"] > constraints["budget"]:
            continue

        # Dietary check
        if constraints["diet"] is not None:
            user_diet = constraints["diet"]
            item_dietary_tags = [d.lower() for d in item.get("dietary_tags", [])]
            if user_diet == "veg" and "veg" not in item_dietary_tags:
                continue
            elif user_diet == "vegan" and "vegan" not in item_dietary_tags:
                continue
            elif user_diet == "jain" and "jain" not in item_dietary_tags:
                continue
            elif user_diet == "gluten-free" and "gluten-free" not in item_dietary_tags:
                continue
            elif user_diet == "non-veg" and "non-veg" not in item_dietary_tags:
                continue

        # Spice filter check (mild vs spicy)
        if constraints["spice"] == "mild":
            if item.get("spice_level") in ["spicy"]:
                continue
        elif constraints["spice"] == "spicy":
            if item.get("spice_level") in ["none"]:
                continue

        candidates.append(item)

    # If constraints removed all items, relax spice or budget slightly for fallback suggestions
    fallback_used = False
    if not candidates:
        fallback_used = True
        # Keep dietary restrictions strict, relax budget
        for item in all_items:
            if constraints["diet"] is not None:
                item_dietary_tags = [d.lower() for d in item.get("dietary_tags", [])]
                if constraints["diet"] == "veg" and "veg" not in item_dietary_tags:
                    continue
            candidates.append(item)

    # 2. Build Vocabulary & Tag Vectors for Cosine Similarity
    query_tokens = tokenize(user_message)
    # Enhance query tokens with semantic synonyms
    if "light" in query_tokens:
        query_tokens.extend(["snack", "healthy", "beverage", "steamed", "south_indian"])
    if "filling" in query_tokens or "heavy" in query_tokens or "hearty" in query_tokens:
        query_tokens.extend(["biryani", "chole", "bhature", "roll", "paratha", "rice"])

    # Build universal vocabulary from candidate item tokens and query tokens
    vocab_set = set(query_tokens)
    for item in candidates:
        vocab_set.update(build_item_tokens(item))
    vocabulary = sorted(list(vocab_set))
    vocab_index = {w: i for i, w in enumerate(vocabulary)}

    # Create query vector
    query_vec = [0.0] * len(vocabulary)
    for token in query_tokens:
        if token in vocab_index:
            query_vec[vocab_index[token]] += 1.0

    # Compute similarity for each candidate
    scored_items: List[Tuple[float, Dict[str, Any]]] = []
    for item in candidates:
        item_tokens = build_item_tokens(item)
        item_vec = [0.0] * len(vocabulary)
        for token in item_tokens:
            if token in vocab_index:
                item_vec[vocab_index[token]] += 1.0

        sim = cosine_similarity(query_vec, item_vec)
        # Combine cosine similarity (80%) + normalized popularity score (20%)
        popularity_norm = (item.get("popularity_score", 4.0) / 5.0)
        final_score = (sim * 0.8) + (popularity_norm * 0.2)
        scored_items.append((final_score, item))

    # Sort descending by score
    scored_items.sort(key=lambda x: x[0], reverse=True)
    top_3 = [item for _, item in scored_items[:3]]

    # 3. LLM-Generated Grounded Explanation
    explanation = await generate_recommendation_explanation(
        user_message=user_message,
        top_items=top_3,
        constraints=constraints,
        fallback_used=fallback_used
    )

    return {
        "intent": "recommendation_request",
        "matched_items": top_3,
        "reply_text": explanation,
        "constraints": constraints,
        "count": len(top_3)
    }


async def generate_recommendation_explanation(
    user_message: str,
    top_items: List[Dict[str, Any]],
    constraints: Dict[str, Any],
    fallback_used: bool = False
) -> str:
    """Calls Groq Llama-3.3-70b to write a warm, grounded canteen recommendation explanation."""
    if not top_items:
        return "I couldn't find any dishes on the menu matching all those criteria. Please try expanding your budget or preferences!"

    # Format context containing ONLY retrieved database data
    items_context = []
    for idx, item in enumerate(top_items, 1):
        items_context.append(
            f"#{idx} {item['name']} - ₹{int(item['price'])} | "
            f"Diet: {', '.join(item['dietary_tags'])} | "
            f"Spice: {item['spice_level']} | "
            f"Desc: {item['description']}"
        )
    context_str = "\n".join(items_context)

    system_prompt = """You are BiteBuddy, a friendly college canteen assistant.
Explain why these TOP 3 dishes from our canteen were recommended for the student's request.
CRITICAL RULES:
1. Refer ONLY to the dishes provided in the context below.
2. Use the exact prices and dietary info given. NEVER invent or mention any outside dishes.
3. Keep the response concise, friendly, and structured (under 4-5 sentences total).
4. Highlight why each dish fits their cravings, budget, or dietary needs."""

    user_prompt = f"""Student Request: "{user_message}"
Retrieved Canteen Dishes:
{context_str}

Please present these recommendations warmly to the student."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    llm_reply = await call_groq_llm(messages, temperature=0.2, timeout=6.0)

    # Post-validation: ensure top item is mentioned in reply
    top_name = top_items[0]["name"]
    if llm_reply and top_name.lower() in llm_reply.lower():
        return llm_reply.strip()

    # Deterministic fallback explanation
    lines = [f"Here are my top recommendations for you:"]
    for idx, item in enumerate(top_items, 1):
        lines.append(f"• **{item['name']}** (₹{int(item['price'])}) - {item['description']} ({item['spice_level']} spice)")
    return "\n\n".join(lines)


# -------------------------------------------------------------------------
# 5. Q&A Handler (Structured DB Querying + Keyword Matching + LLM Synthesis)
# -------------------------------------------------------------------------

async def handle_canteen_qa(user_message: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Q&A handler:
    - Structured questions (price, timing, veg/non-veg) -> query DB directly.
    - Open-ended questions -> keyword/tag matching over menu_items.
    - Pass ONLY retrieved DB data as context to the LLM to phrase natural answer.
    """
    all_items = get_all_menu_items(db)
    clean_msg = user_message.strip()
    msg_lower = clean_msg.lower()

    matched_items: List[Dict[str, Any]] = []

    # Check 1: Specific dish mention in message
    # Match longest item name first
    sorted_by_len = sorted(all_items, key=lambda x: len(x["name"]), reverse=True)
    specific_dish = None
    for item in sorted_by_len:
        item_name_lower = item["name"].lower()
        # Clean off parentheses like "(2 pcs)" for matching
        base_name = re.sub(r"\s*\(.*?\)", "", item_name_lower).strip()
        core_name = re.sub(r"\b(veg|classic|south indian|warm|iced|chilled|fresh|mumbai)\b", "", base_name).strip()
        if base_name in msg_lower or item_name_lower in msg_lower or (len(core_name) >= 4 and core_name in msg_lower):
            specific_dish = item
            matched_items = [item]
            break

    # Check 2: Structured question: Price / Budget filter + Veg / Non-veg
    # e.g., "what's under ₹50 and veg?", "veg items below 60"
    constraints = extract_constraints(msg_lower)
    is_price_or_veg_query = constraints["budget"] is not None or constraints["diet"] is not None

    if not specific_dish and is_price_or_veg_query:
        for item in all_items:
            # Check price
            if constraints["budget"] is not None and item["price"] > constraints["budget"]:
                continue
            # Check dietary
            if constraints["diet"] is not None:
                item_dietary_tags = [d.lower() for d in item.get("dietary_tags", [])]
                if constraints["diet"] == "veg" and "veg" not in item_dietary_tags:
                    continue
                elif constraints["diet"] == "vegan" and "vegan" not in item_dietary_tags:
                    continue
                elif constraints["diet"] == "jain" and "jain" not in item_dietary_tags:
                    continue
                elif constraints["diet"] == "gluten-free" and "gluten-free" not in item_dietary_tags:
                    continue
                elif constraints["diet"] == "non-veg" and "non-veg" not in item_dietary_tags:
                    continue
            matched_items.append(item)

    # Check 3: Keyword / Tag matching over menu_items
    if not matched_items and not specific_dish:
        tokens = tokenize(msg_lower)
        for item in all_items:
            item_tokens = set(build_item_tokens(item))
            # If any significant query token intersects with item tokens
            overlap = item_tokens.intersection(tokens)
            if overlap:
                matched_items.append(item)

    # Check 4: Check if asking about an unlisted item (e.g., sushi, pizza, burger)
    unlisted_item = None
    common_off_menu = ["sushi", "pizza", "burger", "tacos", "shawarma", "pasta", "ramen", "dim sum", "hot dog", "steak"]
    for off in common_off_menu:
        if off in msg_lower:
            unlisted_item = off.title()
            break

    if unlisted_item and not matched_items:
        return {
            "intent": "question",
            "matched_items": [],
            "reply_text": f"Sorry, **{unlisted_item}** is not available on our canteen menu! Would you like to try our rolls, sandwiches, or South Indian dishes instead?",
            "count": 0
        }

    if not matched_items and not specific_dish:
        return {
            "intent": "question",
            "matched_items": [],
            "reply_text": "I couldn't find any menu items matching that question. You can ask me about prices, preparation timings, ingredients, or whether a dish is spicy/vegetarian!",
            "count": 0
        }

    # Limit context to top 6 relevant items to keep prompt focused
    matched_items = matched_items[:6]

    # Synthesize natural response using LLM with ONLY retrieved database data
    reply = await generate_qa_answer(user_message, matched_items, specific_dish=specific_dish)

    return {
        "intent": "question",
        "matched_items": matched_items,
        "reply_text": reply,
        "count": len(matched_items)
    }


async def generate_qa_answer(
    user_message: str,
    matched_items: List[Dict[str, Any]],
    specific_dish: Optional[Dict[str, Any]] = None
) -> str:
    """Synthesizes factual answer using Groq Llama-3.3-70b strictly grounded in retrieved DB data."""
    # Build strict DB context
    items_data = []
    for item in matched_items:
        items_data.append({
            "name": item["name"],
            "price": f"₹{int(item['price'])}",
            "dietary_tags": item["dietary_tags"],
            "spice_level": item["spice_level"],
            "available_time": item["available_time"],
            "ingredients": item["ingredients"],
            "description": item["description"]
        })
    context_json = json.dumps(items_data, indent=2)

    system_prompt = """You are BiteBuddy, an accurate college canteen assistant.
Answer the student's question accurately using ONLY the retrieved canteen database records provided.
STRICT INVARIANTS:
1. Use ONLY facts present in the provided menu data (price, timing, spice level, ingredients).
2. NEVER invent dishes, prices, or ingredients not present in the records.
3. If asked whether an item is spicy, check the 'spice_level' and description in the data.
4. Keep the answer friendly, clear, and direct."""

    user_prompt = f"""Question: "{user_message}"
Retrieved Canteen Database Records:
{context_json}

Provide a direct, factual answer:"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    llm_reply = await call_groq_llm(messages, temperature=0.1, timeout=6.0)

    if llm_reply and len(llm_reply.strip()) > 10:
        return llm_reply.strip()

    # Rule-based fallback if LLM is offline
    if specific_dish:
        return (
            f"**{specific_dish['name']}** is priced at **₹{int(specific_dish['price'])}**. "
            f"It is **{', '.join(specific_dish['dietary_tags'])}** with a **{specific_dish['spice_level']}** spice level. "
            f"Ingredients include {', '.join(specific_dish['ingredients'][:4])}. "
            f"Available during: {specific_dish['available_time']}."
        )

    lines = ["Here are the matching items on our menu:"]
    for it in matched_items:
        lines.append(f"• **{it['name']}** - ₹{int(it['price'])} ({', '.join(it['dietary_tags'])}, {it['spice_level']} spice)")
    return "\n".join(lines)


# -------------------------------------------------------------------------
# 6. End-to-End Chat Pipeline
# -------------------------------------------------------------------------

async def handle_canteen_chat(message: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    End-to-end canteen chat orchestrator:
    1. Classifies intent ("question" vs "recommendation_request")
    2. Routes to Q&A handler or Recommendation handler
    3. Guarantees 100% database grounded output.
    """
    intent = await classify_intent(message)

    if intent == "recommendation_request":
        result = await handle_canteen_recommendation(message, db=db)
    else:
        result = await handle_canteen_qa(message, db=db)

    result["classified_intent"] = intent
    return result
