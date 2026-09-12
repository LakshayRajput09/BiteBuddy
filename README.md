# BiteBuddy — AI College Canteen Recommendation Assistant

> An AI-powered conversational canteen assistant that understands a student's budget, mood, cravings, dietary requirements, prep time, and real-time availability to recommend and explain the best meal, value combination, and ranked alternatives.

---

## 🌟 Key Architecture & Safety Principles

1. **Deterministic Safety Guarantee**:
   - Dietary requirements (Vegetarian, Vegan, Jain, Allergies), Budget maximums, Preparation times, Exclusions, and Item Availability are **100% computed deterministically in Python code** against the real SQLite database.
   - The LLM is **never** the sole authority on dietary safety or budget math.
2. **Dual NLP Extraction Engine**:
   - **Google Gemini API**: Configurable via `GEMINI_API_KEY` in `backend/.env`.
   - **Semantic/Rule-Based NLP Fallback**: Built-in pattern-matching engine that extracts budget, dietary rules, taste, mood, cravings, time limits, and conversational exclusions. The application and all tests work out-of-the-box with **zero external API keys required**.
3. **Conversational Refinement with Multi-turn Memory**:
   - Maintains session context across turns. A follow-up message like *"I don't want noodles"* or *"Actually make it vegan"* or *"Lower budget to ₹60"* merges with prior context without restarting the flow.
4. **Scoring Engine Formula**:
   $$\text{Score} = 0.30 \times \text{PreferenceMatch} + 0.25 \times \text{BudgetFit} + 0.20 \times \text{DietaryMatch} + 0.15 \times \text{TimeFit} + 0.10 \times \text{MoodCravingMatch}$$
5. **Real-Time Canteen Availability**:
   - Includes an interactive Live Menu & Admin drawer to toggle item availability (`PUT /menu/{item_id}/availability`). If an item is marked Out of Stock, the AI assistant automatically pivots to the closest available substitute!

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── canteen.db             # SQLite database (auto-created on startup)
│   ├── database.py            # SQLAlchemy models (Food, UserPreference, RecommendationHistory)
│   ├── engine.py              # Deterministic filtering, scoring formula, combos & conflict detection
│   ├── llm_service.py         # Gemini API + offline semantic NLP extractor & explanation generator
│   ├── main.py                # FastAPI app (/chat, /recommend, /menu, /menu/{id}/availability)
│   ├── menu_seed.csv          # 34 synthetic canteen food items
│   ├── schemas.py             # Pydantic v2 schemas
│   ├── seed_data.py           # Database seeding script
│   ├── session_store.py       # Conversational session context manager
│   └── tests/
│       ├── test_api.py        # End-to-end API & conversational refinement tests
│       └── test_engine.py     # Deterministic filter & scoring unit tests
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css    # Tailwind styling & animations
│   │   │   ├── layout.tsx     # Root layout
│   │   │   └── page.tsx       # Main page
│   │   ├── components/
│   │   │   ├── AlternativesList.tsx   # Ranked 2-3 alternatives list
│   │   │   ├── ChatInterface.tsx      # Conversational UI & refinement pills
│   │   │   ├── ComboCard.tsx          # Main + Beverage meal pairing
│   │   │   ├── MenuDrawer.tsx         # Live menu & availability toggle drawer
│   │   │   └── RecommendationCard.tsx # Top pick card with checklist & score breakdown
│   │   └── types/             # TypeScript interfaces
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
└── requirements.txt           # Python backend dependencies
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.9+**
- **Node.js 18+** and **npm**

---

### 2. Backend Setup & Run

1. Open a terminal in the project root:
   ```bash
   cd "Food Recomendation"
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. *(Optional)* Configure Google Gemini API key:
   Create a `.env` file in `backend/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```
   > **Note**: If no API key is provided, the backend seamlessly uses its built-in rule-based semantic NLP engine!

5. Seed the SQLite database:
   ```bash
   python backend/seed_data.py
   ```
   *(Populates 34 realistic items across Rolls, Rice, Snacks, Noodles, Chinese, Beverages, and Sweets).*

6. Start the FastAPI server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   - API runs at: `http://127.0.0.1:8000`
   - Interactive Swagger API docs: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup & Run

1. In a new terminal, navigate to the `frontend` directory:
   ```bash
   cd "Food Recomendation/frontend"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open your browser at:
   ```
   http://localhost:3000
   ```

---

## 🧪 Running Automated Tests

Run the full pytest suite (20 tests covering budget filtering, strict dietary flags, availability checks, prep time limits, alternative diversity, combo budget adherence, edge case contradictions, and multi-turn refinement):

```bash
cd "Food Recomendation"
.venv/bin/pytest backend/tests/ -v
```

Output:
```
backend/tests/test_api.py::test_health PASSED
backend/tests/test_api.py::test_get_menu PASSED
backend/tests/test_api.py::test_put_menu_availability PASSED
backend/tests/test_api.py::test_post_recommend_direct PASSED
backend/tests/test_api.py::test_chat_edge_case_no_budget PASSED
backend/tests/test_api.py::test_chat_edge_case_contradiction_vegan_paneer PASSED
backend/tests/test_api.py::test_chat_edge_case_negative_budget PASSED
backend/tests/test_api.py::test_chat_full_flow_and_conversational_refinement PASSED
backend/tests/test_engine.py::test_budget_filtering PASSED
backend/tests/test_engine.py::test_dietary_filtering_vegetarian PASSED
backend/tests/test_engine.py::test_dietary_filtering_vegan PASSED
backend/tests/test_engine.py::test_dietary_filtering_jain PASSED
backend/tests/test_engine.py::test_time_filtering PASSED
backend/tests/test_engine.py::test_availability_filtering PASSED
backend/tests/test_engine.py::test_conflicting_requirements_vegan_paneer PASSED
backend/tests/test_engine.py::test_conflicting_requirements_negative_budget PASSED
backend/tests/test_engine.py::test_prompt_case_study PASSED
backend/tests/test_engine.py::test_combo_pairing_within_budget PASSED
backend/tests/test_engine.py::test_low_budget_snack PASSED
backend/tests/test_engine.py::test_exclusion_filter PASSED
============================== 20 passed in 0.28s ==============================
```

---

## 🎯 Verified Edge Cases

| Edge Case | User Input | Assistant Behavior |
|---|---|---|
| **Prompt Case Study** | *"I'm tired, have ₹120, want something spicy and vegetarian, and only have 10 minutes."* | Recommends **Rajma Chawal** (₹70, 10 mins, spicy, comforting) + **Alphonso Mango Lassi** combo (₹120 total), with 3 ranked alternatives. |
| **Conversational Refinement** | Follow-up: *"I don't want rice"* | Updates to **Cheese Masala Maggi** (₹55, 8 mins) while preserving prior ₹120 budget, vegetarian diet, spicy taste, and tired mood. |
| **Conflicting Requirements** | *"I want vegan paneer under ₹100"* | Identifies contradiction: paneer contains dairy. Asks student whether they prefer plant-based vegan or vegetarian paneer. |
| **No Budget Specified** | *"Give me something spicy and quick"* | Prompts: *"What is your approximate budget for today? (e.g. under ₹50, ₹100, or ₹150)"* without guessing. |
| **Low Budget (< ₹40)** | *"I have ₹25"* | Explains complete meals are ₹40+, but recommends **Bun Maska** / **Vada Pav** / **Filter Coffee** within budget. |
| **Invalid Input** | *"Budget is -₹50"* | Instant validation error returned before calling any LLM. |
| **Item Unavailable** | Marked unavailable via Admin drawer | Explicitly notes out-of-stock item and suggests closest available substitute. |

---

## 📡 REST API Endpoints

- `POST /chat` — Conversational pipeline with session context and refinement.
- `POST /recommend` — Direct structured preference input (bypasses NL extraction).
- `GET /menu` — List canteen items (with optional filters: `category`, `vegetarian_only`, `available_only`, `max_price`).
- `GET /menu/{item_id}` — Single item details.
- `PUT /menu/{item_id}/availability` — Admin endpoint to toggle item availability.
- `GET /health` — Service healthcheck.

