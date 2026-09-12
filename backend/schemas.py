from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


class PreferenceQuery(BaseModel):
    budget: Optional[float] = Field(None, description="Maximum budget in INR")
    diet: Optional[str] = Field(None, description="Dietary requirement: vegetarian, vegan, jain, non-veg, or any")
    taste: Optional[List[str]] = Field(default_factory=list, description="Preferred tastes, e.g. spicy, sweet, savory")
    mood: Optional[str] = Field(None, description="Current mood or state, e.g. tired, stressed, energetic, rushed")
    cravings: Optional[List[str]] = Field(default_factory=list, description="Specific cravings, e.g. paneer, cheese, chocolate")
    time_limit: Optional[int] = Field(None, description="Max preparation time in minutes")
    cuisine: Optional[str] = Field(None, description="Preferred cuisine, e.g. North Indian, South Indian, Indo-Chinese")
    exclusions: Optional[List[str]] = Field(default_factory=list, description="Ingredients or items to exclude, e.g. noodles, dairy, onion")
    protein_goal: Optional[str] = Field(None, description="High protein requirement or target")
    calorie_goal: Optional[float] = Field(None, description="Target calories")

    @field_validator("budget")
    @classmethod
    def validate_budget(cls, v):
        if v is not None and v < 0:
            raise ValueError("Budget cannot be negative")
        return v

    @field_validator("time_limit")
    @classmethod
    def validate_time(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Preparation time limit must be greater than 0")
        return v


class FoodOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    item_id: int
    name: str
    description: str = ""
    category: str
    price: float
    ingredients: str
    serving_size: str = "1 portion"
    vegetarian: bool
    vegan: bool
    jain: bool
    contains_egg: bool = False
    contains_dairy: bool = False
    contains_gluten: bool = False
    contains_nuts: bool = False
    spicy: bool
    sweet: bool
    preparation_time: int
    available: bool
    cuisine: str
    tags: str = ""
    image_emoji: str = "🍽️"
    image_url: str = ""

    # Approximate nutrition per serving
    calories: float = 0.0
    protein: float = 0.0
    carbohydrates: float = 0.0
    fat: float = 0.0
    fiber: float = 0.0
    sugar: float = 0.0
    sodium: float = 0.0


class RecommendationCard(BaseModel):
    item: FoodOut
    score: float
    match_percentage: int
    reasons: List[str]
    score_breakdown: Dict[str, float] = Field(default_factory=dict)


class MealCombination(BaseModel):
    main_item: FoodOut
    side_item: FoodOut
    total_price: float
    max_prep_time: int
    budget_remaining: float
    description: str
    total_calories: float = 0.0
    total_protein: float = 0.0
    total_carbs: float = 0.0
    total_fat: float = 0.0


class RecommendationResult(BaseModel):
    top_pick: Optional[RecommendationCard] = None
    combo: Optional[MealCombination] = None
    alternatives: List[RecommendationCard] = Field(default_factory=list)
    explanation: str
    structured_filters_applied: Dict[str, Any] = Field(default_factory=dict)
    is_snack_only: bool = False
    relaxation_notes: Optional[str] = None
    conflict_detected: Optional[str] = None


class ChatIntent:
    RECOMMEND_FOOD = "RECOMMEND_FOOD"
    SEARCH_FOOD = "SEARCH_FOOD"
    ASK_FOOD_DETAILS = "ASK_FOOD_DETAILS"
    ASK_NUTRITION = "ASK_NUTRITION"
    ASK_PRICE = "ASK_PRICE"
    ASK_AVAILABILITY = "ASK_AVAILABILITY"
    MODIFY_PREFERENCE = "MODIFY_PREFERENCE"
    COMPARE_FOOD = "COMPARE_FOOD"
    BUILD_COMBO = "BUILD_COMBO"
    ORDER_FOOD = "ORDER_FOOD"
    VIEW_NUTRITION = "VIEW_NUTRITION"
    GREETING = "GREETING"
    HELP = "HELP"
    UNCLEAR = "UNCLEAR"
    IRRELEVANT = "IRRELEVANT"
    UNAVAILABLE_ITEM = "UNAVAILABLE_ITEM"
    OFF_MENU = "OFF_MENU"


class ChatResponseType:
    TEXT_RESPONSE = "TEXT_RESPONSE"
    FOOD_RECOMMENDATION = "FOOD_RECOMMENDATION"
    FOOD_DETAILS = "FOOD_DETAILS"
    COMPARISON = "COMPARISON"
    NUTRITION_RESULT = "NUTRITION_RESULT"
    NO_MATCH = "NO_MATCH"
    CLARIFICATION = "CLARIFICATION"
    ORDER_CONFIRMATION = "ORDER_CONFIRMATION"


class FoodComparisonItem(BaseModel):
    item: FoodOut
    highlight: Optional[str] = None


class FoodComparisonResult(BaseModel):
    dish_a: FoodOut
    dish_b: FoodOut
    verdict: str
    highlights: List[str] = Field(default_factory=list)


class OrderAction(BaseModel):
    action_type: str = "add_to_order"
    item: FoodOut
    quantity: int = 1
    total_price: float = 0.0


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    student_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply_text: str
    response_type: str = ChatResponseType.TEXT_RESPONSE
    is_clarification: bool = False
    clarification_type: Optional[str] = None
    recommendation: Optional[RecommendationCard] = None
    combo: Optional[MealCombination] = None
    alternatives: List[RecommendationCard] = Field(default_factory=list)
    explanation: Optional[str] = None
    session_id: str
    extracted_preferences: Optional[Dict[str, Any]] = None
    suggested_followups: List[str] = Field(default_factory=list)
    matched_items: List[FoodOut] = Field(default_factory=list)
    intent: Optional[str] = None
    comparison: Optional[FoodComparisonResult] = None
    order_action: Optional[OrderAction] = None
    turn_count: int = 1
    conversation_stage: str = "initial"


class AvailabilityUpdate(BaseModel):
    available: bool


# ==================================================
# Auth Schemas
# ==================================================

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=4)
    role: str = Field("student", description="'student' or 'cafeteria_owner'")
    canteen_name: Optional[str] = None
    canteen_location: Optional[str] = None
    contact_info: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class DemoLoginRequest(BaseModel):
    role: str = Field(..., description="'student' or 'cafeteria_owner'")
    name: Optional[str] = None


class UpdateNameRequest(BaseModel):
    user_id: str
    name: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    canteen_name: Optional[str] = None
    canteen_location: Optional[str] = None
    contact_info: Optional[str] = None
    created_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    user: UserOut
    token: str


# ==================================================
# Student Preferences & Nutrition Schemas
# ==================================================

class StudentProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    budget: float = 120.0
    time_limit: int = 10
    mood: str = "Comfort Food"
    cuisine_preference: str = "Indian"
    dietary_preferences: List[str] = Field(default_factory=list)
    taste_preferences: List[str] = Field(default_factory=list)


class StudentProfileUpdate(BaseModel):
    budget: Optional[float] = None
    time_limit: Optional[int] = None
    mood: Optional[str] = None
    cuisine_preference: Optional[str] = None
    dietary_preferences: Optional[List[str]] = None
    taste_preferences: Optional[List[str]] = None

    @field_validator("budget")
    @classmethod
    def val_budget(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Budget must be greater than 0")
        return v

    @field_validator("time_limit")
    @classmethod
    def val_time(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Time limit must be greater than 0")
        return v


class StudentNutritionGoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    calorie_goal: float = 2200.0
    protein_goal: float = 120.0
    carb_goal: float = 250.0
    fat_goal: float = 70.0
    enabled: bool = True


class StudentNutritionGoalUpdate(BaseModel):
    calorie_goal: Optional[float] = None
    protein_goal: Optional[float] = None
    carb_goal: Optional[float] = None
    fat_goal: Optional[float] = None
    enabled: Optional[bool] = None

    @field_validator("calorie_goal", "protein_goal", "carb_goal", "fat_goal")
    @classmethod
    def val_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("Nutrition goals cannot be negative")
        return v


class NutritionConsumedMeal(BaseModel):
    order_id: int
    meal_time: str
    name: str
    quantity: int
    calories: float
    protein: float
    carbohydrates: float
    fat: float


class StudentDailyNutrition(BaseModel):
    goals: StudentNutritionGoalOut
    consumed_calories: float
    consumed_protein: float
    consumed_carbs: float
    consumed_fat: float
    meals_today: List[NutritionConsumedMeal] = Field(default_factory=list)


# ==================================================
# Order Schemas
# ==================================================

class OrderItemCreate(BaseModel):
    food_id: int
    quantity: int = Field(1, ge=1)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1)
    student_id: Optional[str] = None


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    food_id: int
    food_name: str
    quantity: int
    price: float
    calories: float
    protein: float
    carbohydrates: float
    fat: float


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: str
    total_price: float
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    status: str
    created_at: datetime
    items: List[OrderItemOut] = Field(default_factory=list)


# ==================================================
# Owner Menu & Stats Schemas
# ==================================================

class FoodCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: str = ""
    category: str = Field(..., min_length=2)
    price: float = Field(..., ge=0)
    ingredients: str = Field(..., min_length=2)
    serving_size: str = "1 serving"
    vegetarian: bool = True
    vegan: bool = False
    jain: bool = False
    contains_egg: bool = False
    contains_dairy: bool = False
    contains_gluten: bool = False
    contains_nuts: bool = False
    spicy: bool = False
    sweet: bool = False
    preparation_time: int = Field(..., gt=0)
    available: bool = True
    cuisine: str = "Indian"
    tags: str = ""
    image_emoji: str = "🍽️"
    image_url: str = ""

    # Nutrition
    calories: float = Field(0.0, ge=0)
    protein: float = Field(0.0, ge=0)
    carbohydrates: float = Field(0.0, ge=0)
    fat: float = Field(0.0, ge=0)
    fiber: float = Field(0.0, ge=0)
    sugar: float = Field(0.0, ge=0)
    sodium: float = Field(0.0, ge=0)


class FoodUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    ingredients: Optional[str] = None
    serving_size: Optional[str] = None
    vegetarian: Optional[bool] = None
    vegan: Optional[bool] = None
    jain: Optional[bool] = None
    contains_egg: Optional[bool] = None
    contains_dairy: Optional[bool] = None
    contains_gluten: Optional[bool] = None
    contains_nuts: Optional[bool] = None
    spicy: Optional[bool] = None
    sweet: Optional[bool] = None
    preparation_time: Optional[int] = Field(None, gt=0)
    available: Optional[bool] = None
    cuisine: Optional[str] = None
    tags: Optional[str] = None
    image_emoji: Optional[str] = None
    image_url: Optional[str] = None
    calories: Optional[float] = Field(None, ge=0)
    protein: Optional[float] = Field(None, ge=0)
    carbohydrates: Optional[float] = Field(None, ge=0)
    fat: Optional[float] = Field(None, ge=0)
    fiber: Optional[float] = Field(None, ge=0)
    sugar: Optional[float] = Field(None, ge=0)
    sodium: Optional[float] = Field(None, ge=0)


class OwnerStats(BaseModel):
    total_items: int
    available_items: int
    unavailable_items: int
    todays_orders: int
    avg_prep_time: int
    todays_revenue: float
    popular_items: List[Dict[str, Any]] = Field(default_factory=list)
    orders_trend: List[Dict[str, Any]] = Field(default_factory=list)
