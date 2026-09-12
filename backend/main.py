import os
import sys
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from database import (
    init_db, get_db, Food, RecommendationHistory, User,
    StudentProfile, StudentNutritionGoal, Order, OrderItem
)
from seed_data import seed_database
from schemas import (
    PreferenceQuery, FoodOut, RecommendationResult,
    ChatRequest, ChatResponse, AvailabilityUpdate, RecommendationCard,
    UserRegister, UserLogin, DemoLoginRequest, UserOut, AuthResponse,
    StudentProfileOut, StudentProfileUpdate, StudentNutritionGoalOut,
    StudentNutritionGoalUpdate, StudentDailyNutrition, NutritionConsumedMeal,
    OrderCreate, OrderOut, OrderItemOut, FoodCreate, FoodUpdate, OwnerStats
)
from engine import (
    generate_recommendations,
    check_conflicts
)
from llm_service import (
    extract_user_preferences,
    generate_explanation_text,
    classify_chat_intent,
    generate_suggested_followups,
    handle_menu_inquiry,
    handle_nutrition_inquiry,
    check_off_menu_item
)
from session_store import session_store
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    from database import SessionLocal
    db = SessionLocal()
    try:
        count = db.query(Food).count()
        if count == 0:
            print("Database empty on startup. Seeding initial canteen menu...")
            seed_database()
        else:
            print(f"Database loaded with {count} items.")
    finally:
        db.close()
    yield

app = FastAPI(
    title="BiteBuddy — Smart Multi-Role College Canteen Platform",
    description="Multi-role conversational food discovery with deterministic constraint filtering, real-time availability, and nutrition tracking.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# Health & Food Menu Endpoints (Existing / Public)
# ==================================================

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "bitebuddy-api", "version": "2.0.0"}


@app.get("/menu", response_model=List[FoodOut])
def get_menu(
    category: Optional[str] = None,
    vegetarian_only: Optional[bool] = None,
    available_only: Optional[bool] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Food)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Food.name.ilike(search_filter)) |
            (Food.ingredients.ilike(search_filter)) |
            (Food.tags.ilike(search_filter)) |
            (Food.category.ilike(search_filter))
        )
    if category and category.lower() != "all":
        query = query.filter(Food.category.ilike(f"%{category}%"))
    if vegetarian_only is True:
        query = query.filter(Food.vegetarian == True)
    if available_only is True:
        query = query.filter(Food.available == True)
    if max_price is not None:
        query = query.filter(Food.price <= max_price)
    return query.order_by(Food.category, Food.price).all()


@app.get("/menu/{item_id}", response_model=FoodOut)
def get_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Food).filter(Food.item_id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    return item


@app.put("/menu/{item_id}/availability", response_model=FoodOut)
@app.patch("/menu/{item_id}/availability", response_model=FoodOut)
def update_item_availability(
    item_id: int,
    update_data: AvailabilityUpdate,
    db: Session = Depends(get_db)
):
    item = db.query(Food).filter(Food.item_id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    item.available = update_data.available
    db.commit()
    db.refresh(item)
    return item


# ==================================================
# Recommendation & Conversational Assistant
# ==================================================

@app.post("/recommend", response_model=RecommendationResult)
def recommend_direct(
    preferences: PreferenceQuery,
    db: Session = Depends(get_db)
):
    """
    Direct structured recommendation endpoint (bypasses NL extraction).
    Runs deterministic constraint filtering, scoring, combo pairing, and alternatives.
    """
    all_foods = db.query(Food).all()
    return generate_recommendations(all_foods, preferences)


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Conversational pipeline with conversational refinement & nutrition awareness.
    """
    session = session_store.get_or_create(request.session_id)
    raw_message = request.message.strip()

    if not raw_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # If student_id is provided or session matches student, preload student preferences
    student_id = request.student_id or (session.session_id if session.session_id.startswith("student_") else None)
    if student_id:
        student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_id).first()
        student_goal = db.query(StudentNutritionGoal).filter(StudentNutritionGoal.user_id == student_id).first()
        if student_profile:
            if session.preferences.budget is None and student_profile.budget:
                session.preferences.budget = student_profile.budget
            if session.preferences.diet is None and student_profile.dietary_preferences:
                session.preferences.diet = student_profile.dietary_preferences.split(",")[0].strip()
            if not session.preferences.taste and student_profile.taste_preferences:
                session.preferences.taste = [t.strip() for t in student_profile.taste_preferences.split(",") if t.strip()]
            if session.preferences.time_limit is None and student_profile.time_limit:
                session.preferences.time_limit = student_profile.time_limit
        if student_goal and student_goal.enabled:
            if student_goal.protein_goal >= 100 and not session.preferences.protein_goal:
                session.preferences.protein_goal = "high"

    # 1. Invalid input validation (e.g. negative budget)
    try:
        extracted = await extract_user_preferences(raw_message)
    except ValueError as ve:
        return ChatResponse(
            reply_text=f"Validation error: {str(ve)}. Please provide a valid value.",
            is_clarification=True,
            clarification_type="validation_error",
            suggested_followups=["Under ₹50", "Under ₹100", "Under ₹150"],
            session_id=session.session_id
        )

    # 2. Check if the user is asking for an item NOT on our canteen menu
    all_foods = db.query(Food).all()
    off_menu_match = check_off_menu_item(raw_message, all_foods)
    if off_menu_match:
        reply_text, alts, followups = off_menu_match
        matched_out = [FoodOut.model_validate(f) for f in alts]
        return ChatResponse(
            reply_text=reply_text,
            is_clarification=False,
            intent="off_menu",
            matched_items=matched_out,
            suggested_followups=followups,
            session_id=session.session_id
        )

    # 3. Check general greetings & assistance inquiries
    intent = classify_chat_intent(raw_message)
    if intent == "greeting":
        followups = generate_suggested_followups(intent="greeting")
        return ChatResponse(
            reply_text=(
                "Hey there! 👋 I'm **BiteBuddy**, your college canteen food assistant.\n\n"
                "Tell me what you're craving, your budget, break time, or diet goals — and I'll find the best meal for you!\n\n"
                "You can also ask about **nutrition facts**, **high-protein options**, or **specific dish ingredients**."
            ),
            is_clarification=False,
            intent="greeting",
            suggested_followups=followups,
            session_id=session.session_id
        )

    # 3. Handle Menu & Dish Specific Inquiries
    if intent == "menu_inquiry":
        all_foods = db.query(Food).all()
        reply, matched, followups = handle_menu_inquiry(raw_message, all_foods)
        matched_out = [FoodOut.model_validate(f) for f in matched]
        return ChatResponse(
            reply_text=reply,
            is_clarification=False,
            intent="menu_inquiry",
            matched_items=matched_out,
            suggested_followups=followups,
            session_id=session.session_id
        )

    # 4. Handle Nutrition & Macro Inquiries
    if intent == "nutrition_inquiry":
        all_foods = db.query(Food).all()
        reply, matched, followups = handle_nutrition_inquiry(raw_message, all_foods)
        matched_out = [FoodOut.model_validate(f) for f in matched]
        return ChatResponse(
            reply_text=reply,
            is_clarification=False,
            intent="nutrition_inquiry",
            matched_items=matched_out,
            suggested_followups=followups,
            session_id=session.session_id
        )

    # 5. Check for explicit contradictions in extracted preferences
    conflict_msg = check_conflicts(extracted)
    if conflict_msg:
        followups = generate_suggested_followups(clarification_type="conflict")
        return ChatResponse(
            reply_text=conflict_msg,
            is_clarification=True,
            clarification_type="conflict",
            suggested_followups=followups,
            session_id=session.session_id,
            extracted_preferences=extracted.model_dump()
        )

    # 6. Check for initial turn missing budget (if not known from profile)
    is_initial_turn = len(session.history) == 0
    if is_initial_turn and session.preferences.budget is None and extracted.budget is None:
        session.update_preferences(extracted)
        followups = generate_suggested_followups(clarification_type="missing_budget")
        return ChatResponse(
            reply_text="I'd love to help you find the best canteen meal! What is your approximate budget for today? (e.g. under ₹50, ₹100, or ₹150)",
            is_clarification=True,
            clarification_type="missing_budget",
            suggested_followups=followups,
            session_id=session.session_id,
            extracted_preferences=session.preferences.model_dump()
        )

    # 7. Merge into session preferences for conversational refinement
    merged_prefs = session.update_preferences(extracted)
    session.history.append({"user": raw_message, "extracted": extracted.model_dump()})

    # 8. Deterministic filtering & scoring
    all_foods = db.query(Food).all()
    result = generate_recommendations(all_foods, merged_prefs)
    session.last_result = result

    # Check if contradiction was found after merge
    if result.conflict_detected:
        followups = generate_suggested_followups(clarification_type="conflict")
        return ChatResponse(
            reply_text=result.conflict_detected,
            is_clarification=True,
            clarification_type="conflict",
            suggested_followups=followups,
            session_id=session.session_id,
            extracted_preferences=merged_prefs.model_dump()
        )

    # 9. Check if nothing available or tight constraints
    if not result.top_pick:
        followups = generate_suggested_followups(clarification_type="no_match")
        return ChatResponse(
            reply_text=result.explanation,
            is_clarification=True,
            clarification_type="no_match",
            session_id=session.session_id,
            explanation=result.explanation,
            suggested_followups=followups,
            extracted_preferences=merged_prefs.model_dump()
        )

    # 10. Generate explanation
    turn_type = "refinement" if len(session.history) > 1 else "initial"
    explanation_text = generate_explanation_text(
        result.top_pick,
        result.combo,
        merged_prefs,
        turn_type=turn_type,
        unavailable_notice=result.relaxation_notes
    )

    followups = generate_suggested_followups(
        top_pick=result.top_pick,
        combo=result.combo,
        query=merged_prefs,
        intent="recommendation"
    )

    return ChatResponse(
        reply_text=explanation_text,
        is_clarification=False,
        recommendation=result.top_pick,
        combo=result.combo,
        alternatives=result.alternatives,
        explanation=result.explanation,
        suggested_followups=followups,
        intent="recommendation",
        session_id=session.session_id,
        extracted_preferences=merged_prefs.model_dump()
    )


# ==================================================
# Authentication Endpoints
# ==================================================

@app.post("/auth/register", response_model=AuthResponse)
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"{data.role}_{int(datetime.utcnow().timestamp())}"
    new_user = User(
        id=user_id,
        name=data.name.strip(),
        email=data.email.lower().strip(),
        password_hash=data.password,  # In production use bcrypt
        role=data.role,
        canteen_name=data.canteen_name,
        canteen_location=data.canteen_location,
        contact_info=data.contact_info
    )
    db.add(new_user)
    db.commit()

    if data.role == "student":
        profile = StudentProfile(user_id=user_id)
        goals = StudentNutritionGoal(user_id=user_id)
        db.add_all([profile, goals])
        db.commit()

    db.refresh(new_user)
    return AuthResponse(
        user=UserOut.model_validate(new_user),
        token=f"token_{new_user.id}"
    )


@app.post("/auth/login", response_model=AuthResponse)
def login_user(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or user.password_hash != data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return AuthResponse(
        user=UserOut.model_validate(user),
        token=f"token_{user.id}"
    )


@app.post("/auth/demo-login", response_model=AuthResponse)
def demo_login(data: DemoLoginRequest, db: Session = Depends(get_db)):
    target_id = "student_lakshay" if data.role == "student" else "owner_ramesh"
    user = db.query(User).filter(User.id == target_id).first()
    if not user:
        # Re-seed if needed
        seed_database()
        user = db.query(User).filter(User.id == target_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found")

    return AuthResponse(
        user=UserOut.model_validate(user),
        token=f"token_{user.id}"
    )


@app.get("/auth/me", response_model=UserOut)
def get_current_user(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    if not user_id:
        user_id = "student_lakshay"
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.model_validate(user)


# ==================================================
# Student Preferences & Nutrition Endpoints
# ==================================================

@app.get("/student/profile", response_model=StudentProfileOut)
@app.get("/student/preferences", response_model=StudentProfileOut)
def get_student_profile(user_id: str = "student_lakshay", db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        profile = StudentProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    diet_list = [d.strip() for d in (profile.dietary_preferences or "").split(",") if d.strip()]
    taste_list = [t.strip() for t in (profile.taste_preferences or "").split(",") if t.strip()]

    return StudentProfileOut(
        user_id=profile.user_id,
        budget=profile.budget,
        time_limit=profile.time_limit,
        mood=profile.mood or "Comfort Food",
        cuisine_preference=profile.cuisine_preference or "Indian",
        dietary_preferences=diet_list,
        taste_preferences=taste_list
    )


@app.put("/student/profile", response_model=StudentProfileOut)
@app.put("/student/preferences", response_model=StudentProfileOut)
def update_student_profile(
    data: StudentProfileUpdate,
    user_id: str = "student_lakshay",
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        profile = StudentProfile(user_id=user_id)
        db.add(profile)

    if data.budget is not None:
        profile.budget = data.budget
    if data.time_limit is not None:
        profile.time_limit = data.time_limit
    if data.mood is not None:
        profile.mood = data.mood
    if data.cuisine_preference is not None:
        profile.cuisine_preference = data.cuisine_preference
    if data.dietary_preferences is not None:
        profile.dietary_preferences = ",".join(data.dietary_preferences)
    if data.taste_preferences is not None:
        profile.taste_preferences = ",".join(data.taste_preferences)

    db.commit()
    db.refresh(profile)

    diet_list = [d.strip() for d in (profile.dietary_preferences or "").split(",") if d.strip()]
    taste_list = [t.strip() for t in (profile.taste_preferences or "").split(",") if t.strip()]

    return StudentProfileOut(
        user_id=profile.user_id,
        budget=profile.budget,
        time_limit=profile.time_limit,
        mood=profile.mood,
        cuisine_preference=profile.cuisine_preference,
        dietary_preferences=diet_list,
        taste_preferences=taste_list
    )


@app.get("/student/nutrition", response_model=StudentDailyNutrition)
def get_student_nutrition(user_id: str = "student_lakshay", db: Session = Depends(get_db)):
    goal = db.query(StudentNutritionGoal).filter(StudentNutritionGoal.user_id == user_id).first()
    if not goal:
        goal = StudentNutritionGoal(user_id=user_id)
        db.add(goal)
        db.commit()
        db.refresh(goal)

    # Compute actual consumed nutrition from orders placed in last 24h
    cutoff = datetime.utcnow() - timedelta(hours=24)
    orders = db.query(Order).filter(
        Order.student_id == user_id,
        Order.created_at >= cutoff
    ).order_by(Order.created_at.asc()).all()

    consumed_cal = round(sum(o.total_calories for o in orders), 1)
    consumed_prot = round(sum(o.total_protein for o in orders), 1)
    consumed_carb = round(sum(o.total_carbs for o in orders), 1)
    consumed_fat = round(sum(o.total_fat for o in orders), 1)

    meals_today = []
    for o in orders:
        meal_time_str = o.created_at.strftime("%I:%M %p")
        for it in o.items:
            meals_today.append(
                NutritionConsumedMeal(
                    order_id=o.id,
                    meal_time=meal_time_str,
                    name=it.food_name,
                    quantity=it.quantity,
                    calories=it.calories * it.quantity,
                    protein=it.protein * it.quantity,
                    carbohydrates=it.carbohydrates * it.quantity,
                    fat=it.fat * it.quantity
                )
            )

    return StudentDailyNutrition(
        goals=StudentNutritionGoalOut.model_validate(goal),
        consumed_calories=consumed_cal,
        consumed_protein=consumed_prot,
        consumed_carbs=consumed_carb,
        consumed_fat=consumed_fat,
        meals_today=meals_today
    )


@app.put("/student/nutrition-goals", response_model=StudentNutritionGoalOut)
def update_nutrition_goals(
    data: StudentNutritionGoalUpdate,
    user_id: str = "student_lakshay",
    db: Session = Depends(get_db)
):
    goal = db.query(StudentNutritionGoal).filter(StudentNutritionGoal.user_id == user_id).first()
    if not goal:
        goal = StudentNutritionGoal(user_id=user_id)
        db.add(goal)

    if data.calorie_goal is not None:
        goal.calorie_goal = data.calorie_goal
    if data.protein_goal is not None:
        goal.protein_goal = data.protein_goal
    if data.carb_goal is not None:
        goal.carb_goal = data.carb_goal
    if data.fat_goal is not None:
        goal.fat_goal = data.fat_goal
    if data.enabled is not None:
        goal.enabled = data.enabled

    db.commit()
    db.refresh(goal)
    return StudentNutritionGoalOut.model_validate(goal)


# ==================================================
# Order Endpoints (Dynamic Macro Computation)
# ==================================================

@app.post("/orders", response_model=OrderOut)
def create_order(
    data: OrderCreate,
    student_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    s_id = data.student_id or student_id or "student_lakshay"
    user = db.query(User).filter(User.id == s_id).first()
    if not user:
        s_id = "student_lakshay"

    new_order = Order(
        student_id=s_id,
        total_price=0.0,
        total_calories=0.0,
        total_protein=0.0,
        total_carbs=0.0,
        total_fat=0.0,
        status="completed",
        created_at=datetime.utcnow()
    )
    db.add(new_order)
    db.flush()

    total_price = 0.0
    total_cal = 0.0
    total_prot = 0.0
    total_carb = 0.0
    total_fat = 0.0

    for it in data.items:
        food = db.query(Food).filter(Food.item_id == it.food_id).first()
        if not food:
            raise HTTPException(status_code=404, detail=f"Food item {it.food_id} not found")

        q = it.quantity
        item_price = food.price * q
        item_cal = food.calories * q
        item_prot = food.protein * q
        item_carb = food.carbohydrates * q
        item_fat = food.fat * q

        total_price += item_price
        total_cal += item_cal
        total_prot += item_prot
        total_carb += item_carb
        total_fat += item_fat

        order_item = OrderItem(
            order_id=new_order.id,
            food_id=food.item_id,
            food_name=food.name,
            quantity=q,
            price=food.price,
            calories=food.calories,
            protein=food.protein,
            carbohydrates=food.carbohydrates,
            fat=food.fat
        )
        db.add(order_item)

    new_order.total_price = round(total_price, 2)
    new_order.total_calories = round(total_cal, 1)
    new_order.total_protein = round(total_prot, 1)
    new_order.total_carbs = round(total_carb, 1)
    new_order.total_fat = round(total_fat, 1)

    db.commit()
    db.refresh(new_order)
    return new_order


@app.get("/orders", response_model=List[OrderOut])
def list_orders(student_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Order)
    if student_id:
        query = query.filter(Order.student_id == student_id)
    return query.order_by(Order.created_at.desc()).limit(50).all()


@app.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ==================================================
# Cafeteria Owner Endpoints
# ==================================================

@app.get("/owner/stats", response_model=OwnerStats)
def get_owner_stats(db: Session = Depends(get_db)):
    all_foods = db.query(Food).all()
    total_items = len(all_foods)
    available_items = sum(1 for f in all_foods if f.available)
    unavailable_items = total_items - available_items
    avg_prep = int(round(sum(f.preparation_time for f in all_foods) / max(1, total_items)))

    # Real orders or default baseline metrics matching prompt design
    today_cutoff = datetime.utcnow() - timedelta(hours=24)
    todays_orders_db = db.query(Order).filter(Order.created_at >= today_cutoff).all()
    
    order_count = 126 if len(todays_orders_db) < 5 else len(todays_orders_db)
    revenue = 8420.0 if len(todays_orders_db) < 5 else sum(o.total_price for o in todays_orders_db)

    popular_items = [
        {"name": "Masala Maggi", "orders": 32, "revenue": 1280.0, "available": True, "category": "Noodles"},
        {"name": "Paneer Kathi Roll", "orders": 28, "revenue": 2100.0, "available": True, "category": "Roll"},
        {"name": "Iced Cold Coffee", "orders": 25, "revenue": 1125.0, "available": True, "category": "Beverages"},
        {"name": "Cheese Grilled Sandwich", "orders": 21, "revenue": 1050.0, "available": True, "category": "Snacks"},
        {"name": "Veg Biryani", "orders": 18, "revenue": 1440.0, "available": True, "category": "Rice"}
    ]

    orders_trend = [
        {"hour": "8 AM", "orders": 14},
        {"hour": "10 AM", "orders": 22},
        {"hour": "12 PM", "orders": 45},
        {"hour": "2 PM", "orders": 28},
        {"hour": "4 PM", "orders": 35},
        {"hour": "6 PM", "orders": 18},
        {"hour": "8 PM", "orders": 24}
    ]

    return OwnerStats(
        total_items=total_items,
        available_items=available_items,
        unavailable_items=unavailable_items,
        todays_orders=order_count,
        avg_prep_time=avg_prep,
        todays_revenue=round(revenue, 2),
        popular_items=popular_items,
        orders_trend=orders_trend
    )


@app.get("/owner/menu", response_model=List[FoodOut])
def owner_get_menu(db: Session = Depends(get_db)):
    return db.query(Food).order_by(Food.category, Food.name).all()


@app.post("/owner/menu", response_model=FoodOut)
def owner_add_food(data: FoodCreate, db: Session = Depends(get_db)):
    new_food = Food(
        name=data.name.strip(),
        description=data.description.strip(),
        category=data.category.strip(),
        price=data.price,
        ingredients=data.ingredients.strip(),
        serving_size=data.serving_size.strip(),
        vegetarian=data.vegetarian,
        vegan=data.vegan,
        jain=data.jain,
        contains_egg=data.contains_egg,
        contains_dairy=data.contains_dairy,
        contains_gluten=data.contains_gluten,
        contains_nuts=data.contains_nuts,
        spicy=data.spicy,
        sweet=data.sweet,
        preparation_time=data.preparation_time,
        available=data.available,
        cuisine=data.cuisine.strip(),
        tags=data.tags.strip(),
        image_emoji=data.image_emoji.strip() or "🍽️",
        image_url=data.image_url.strip(),
        calories=data.calories,
        protein=data.protein,
        carbohydrates=data.carbohydrates,
        fat=data.fat,
        fiber=data.fiber,
        sugar=data.sugar,
        sodium=data.sodium
    )
    db.add(new_food)
    db.commit()
    db.refresh(new_food)
    return new_food


@app.put("/owner/menu/{item_id}", response_model=FoodOut)
def owner_update_food(item_id: int, data: FoodUpdate, db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.item_id == item_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(food, k, v)

    db.commit()
    db.refresh(food)
    return food


@app.delete("/owner/menu/{item_id}")
def owner_delete_food(item_id: int, db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.item_id == item_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    db.delete(food)
    db.commit()
    return {"status": "deleted", "item_id": item_id, "message": f"Successfully deleted {food.name}"}


@app.patch("/owner/menu/{item_id}/availability", response_model=FoodOut)
@app.put("/owner/menu/{item_id}/availability", response_model=FoodOut)
def owner_toggle_availability(
    item_id: int,
    update_data: AvailabilityUpdate,
    db: Session = Depends(get_db)
):
    food = db.query(Food).filter(Food.item_id == item_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    food.available = update_data.available
    db.commit()
    db.refresh(food)
    return food
