# Walkthrough: CanteenAI — Food-Tech Startup Frontend

CanteenAI has been completely transformed into a modern, friendly, food-tech startup web application inspired by the 9-screen reference design.

---

## 🎨 Global Design System & Brand Identity

- **Brand**: **CanteenAI** — *"Good Food. Smarter Choices."*
- **Color Palette**:
  - **Deep Forest Green** (`#0C3B25`): Used in navigation marks, active headers, and dark accents.
  - **Fresh Emerald Green** (`#059669` / `#047857`): Primary CTA buttons, match percentage badges, and positive indicators.
  - **Soft Mint** (`#ECFDF5` / `#E6F4EA`): User message bubbles, active filter pills, and explanation panels.
  - **Warm Off-White & Cream** (`#FAFAF8` / `#F3F4F1`): Light background surfaces providing warmth.
  - **Accent Badges**: Amber (`Popular`), Blue (`Quick Bite`), Rose (`Spicy` / `Sold Out`).
- **Typography & Geometry**:
  - Clean sans-serif typography with generous spacing.
  - Rounded corners: `12px – 20px`.
  - Subtle borders and soft shadows.
  - Authentic food photography for all dishes and combos.

---

## 📱 The 9 Implemented Pages

### 1. Landing Page (`/`)
- **Hero Left**:
  - Badge: `"✨ AI-powered college food assistant"`.
  - Main Heading: **Good Food.** <span style="color:#059669">**Smarter**</span> **Choices.**
  - Subheading: *"Tell us your budget, mood, cravings, and dietary preferences — we'll suggest the perfect meal for you."*
  - CTAs: `Start Exploring →` (links to `/chat`) + `How It Works` (links to `/how-it-works`).
  - Four feature highlights: 🎯 *Personalized Recommendations* • 💵 *Budget Friendly* • 🥗 *Dietary Aware* • ⏱️ *Saves Time*.
- **Hero Right**:
  - Graphic visual of a happy college student with a canteen meal tray and sticker: *"Good Food, Brighter Days!"*.
- **"How CanteenAI Works" preview & Final CTA**:
  - 4-step workflow preview + `"Not sure what to eat? Ask CanteenAI →"`.

### 2. AI Chat Assistant (`/chat`)
- **Heading**: `"Chat with CanteenAI"` / *"Tell me what you're in the mood for!"*.
- **Conversational Stream**:
  - Friendly AI bot message bubble with greeting.
  - User message bubble with soft mint-green background.
  - Live recommendation card previews with match percentages, prep time, and direct links.
- **Suggestion Chips**: `"I'm feeling tired"`, `"Something light"`, `"Under ₹50"`, `"No dairy"`, `"Quick bites"`.
- **Large Chat Input**:
  - Rounded input with placeholder `"Tell me what you're craving..."` and circular green arrow send button.

### 3. Recommendations (`/recommendations`)
- **Heading**: `"Here are your recommendations!"` / *"Based on your preferences, these are the best matching options."*.
- **Top Right**: `"Refine Search"` button linking to preferences.
- **3 Recommendation Cards**:
  - **Card 1 (Best Match)**: *Paneer Roll + Lemon Soda* (₹105, ~8 min, 94% Match, checklist with green checkmarks, `Add to Order` button, favorite heart).
  - **Card 2 (Popular)**: *Masala Maggi + Lemon Soda* (₹75, ~7 min).
  - **Card 3 (Quick Bite)**: *Veg Sandwich + Cold Coffee* (₹95, ~6 min).
- **Explanation Panel**:
  - Prominent panel: *"Why this recommendation?"* with detailed dietary and budget justification.

### 4. Explore Our Menu (`/menu`)
- **Heading**: `"Explore Our Menu"` / *"Browse all available items with real-time availability."*.
- **Search & Category Tabs**:
  - Real-time search bar + Filter button.
  - Category tabs: `All`, `Main Course`, `Snacks`, `Beverages`, `Desserts`, `South Indian`, `Chinese`, `Fast Food`.
- **Food Grid**:
  - High-resolution food photography for Paneer Roll, Veg Biryani, Masala Maggi, Veg Sandwich, Masala Dosa, French Fries, Cold Coffee, Lemon Soda, and more.
  - Prep time, price, and availability badge (`● Available` or `Currently Unavailable`).

### 5. Food Details (`/menu/[id]`)
- **"← Back to Menu"** navigation.
- **Two-Column Layout**:
  - Left: Large food photography with badges.
  - Center: Title, price, availability, prep time, description, quantity selector (`[- 1 +]`), `Add to Order` button, heart button.
  - Ingredients list: Paneer, Onion, Capsicum, Roti, Spices, Sauces.
  - Nutritional Information (approx.): 320 kcal, 12g Protein, 40g Carbs, 14g Fat.
- **Right Sidebar**:
  - *"You might also like"* pairings (Lemon Soda ₹30, Veg Sandwich ₹50, Cold Coffee ₹50).

### 6. User Preferences (`/preferences`)
- **Sidebar**: `Preferences`, `Order History`, `Saved Items`, `Dietary Info`, `Account Settings`.
- **Customizable Controls**:
  - Dietary Preferences pills: `Vegetarian`, `Vegan`, `Jain`, `No Egg`, `No Dairy`, `Gluten Free`, `Nut Allergy`.
  - Taste Preferences: `Spicy`, `Sweet`, `Salty`, `Crispy`, `Light`, `Filling`, `Refreshing`.
  - Budget Range slider: ₹20 — ₹500 with indicator bubble.
  - Default Time Limit select dropdown: `10 minutes`.
  - Preferred Cuisine dropdown: `Any`, `Indian`, `Chinese`, `South Indian`, `Fast Food`.
  - `Save Preferences` button with toast feedback.

### 7. How It Works (`/how-it-works`)
- **Heading**: `"How It Works"` / *"Get personalized food recommendations in just a few steps."*.
- **4-Step Visual Timeline**:
  - 01: `Tell Us`
  - 02: `We Understand`
  - 03: `Get Recommendations`
  - 04: `Enjoy Your Meal`
- **Technical Safety Explainer**: Explains how dietary and budget constraints are calculated deterministically without LLM guesswork.

### 8. Login / Signup (`/login`)
- **Left Side**:
  - Clean card form: Email, Password, Remember Me, Forgot Password, `Sign In` green button, toggle to Sign Up.
- **Right Side**:
  - College canteen photography overlay with typography quote:
    *"Same Canteen. Smarter Choices."*
    *"Good Food Fuels Great Ideas."*

### 9. Admin Dashboard (`/admin`)
- **Sidebar**: `Dashboard`, `Menu Management`, `Orders`, `Availability`, `Analytics`, `Users`, `Settings`.
- **4 Metric Cards**:
  - Total Items: `48`
  - Available Items: `42`
  - Today's Orders: `126`
  - Avg. Prep Time: `8 min`
- **Data Sections**:
  - Popular Items Today table (Masala Maggi, Paneer Roll, Cold Coffee, Veg Sandwich, Lemon Soda).
  - Orders Trend Chart (SVG curve showing hourly rush hours).
  - Live availability table with instant **In Stock / Sold Out** toggles connected directly to `PUT /menu/{id}/availability`.

---

## 🧪 Verification & Build Results

### 1. Next.js Build
```bash
npm run build
```
```
Route (app)                              Size     First Load JS
┌ ○ /                                    3.55 kB         100 kB
├ ○ /_not-found                          875 B          88.2 kB
├ ○ /admin                               4.14 kB         101 kB
├ ○ /chat                                5.26 kB         102 kB
├ ○ /how-it-works                        2.43 kB        98.8 kB
├ ○ /login                               2.93 kB        99.3 kB
├ ○ /menu                                5.5 kB          102 kB
├ ƒ /menu/[id]                           5.27 kB         102 kB
├ ○ /preferences                         3.64 kB        90.9 kB
└ ○ /recommendations                     3.29 kB        99.7 kB
+ First Load JS shared by all            87.3 kB
✓ Compiled successfully in Next.js 14
```

### 2. Live HTTP Verification
All 9 routes tested via HTTP:
```
Route / -> HTTP 200
Route /chat -> HTTP 200
Route /recommendations -> HTTP 200
Route /menu -> HTTP 200
Route /menu/1 -> HTTP 200
Route /preferences -> HTTP 200
Route /how-it-works -> HTTP 200
Route /login -> HTTP 200
Route /admin -> HTTP 200
```

### 3. Backend Pytest Suite
```bash
.venv/bin/pytest backend/tests/ -v
```
- **20 out of 20 tests pass** in 0.27s.

---

## 🚀 Live Services

- **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
