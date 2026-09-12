import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(DB_DIR, 'canteen.db')}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="student")  # "student" | "cafeteria_owner"
    canteen_name = Column(String(120), nullable=True)
    canteen_location = Column(String(120), nullable=True)
    contact_info = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    nutrition_goal = relationship("StudentNutritionGoal", back_populates="user", uselist=False, cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    budget = Column(Float, default=120.0)
    time_limit = Column(Integer, default=10)
    mood = Column(String(100), default="Comfort Food")
    cuisine_preference = Column(String(100), default="Indian")
    dietary_preferences = Column(String(255), default="Vegetarian")  # comma-separated e.g. "Vegetarian,Spicy"
    taste_preferences = Column(String(255), default="Spicy")

    user = relationship("User", back_populates="profile")


class StudentNutritionGoal(Base):
    __tablename__ = "student_nutrition_goals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    calorie_goal = Column(Float, default=2200.0)
    protein_goal = Column(Float, default=120.0)
    carb_goal = Column(Float, default=250.0)
    fat_goal = Column(Float, default=70.0)
    enabled = Column(Boolean, default=True)

    user = relationship("User", back_populates="nutrition_goal")


class Food(Base):
    __tablename__ = "food"

    item_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False, index=True)
    description = Column(Text, default="")
    category = Column(String(50), nullable=False, index=True)
    price = Column(Float, nullable=False, index=True)
    ingredients = Column(Text, nullable=False)
    serving_size = Column(String(50), default="1 serving")

    # Dietary flags
    vegetarian = Column(Boolean, default=True, nullable=False, index=True)
    vegan = Column(Boolean, default=False, nullable=False, index=True)
    jain = Column(Boolean, default=False, nullable=False, index=True)
    contains_egg = Column(Boolean, default=False, nullable=False)
    contains_dairy = Column(Boolean, default=False, nullable=False)
    contains_gluten = Column(Boolean, default=False, nullable=False)
    contains_nuts = Column(Boolean, default=False, nullable=False)

    # Taste & prep
    spicy = Column(Boolean, default=False, nullable=False)
    sweet = Column(Boolean, default=False, nullable=False)
    preparation_time = Column(Integer, nullable=False, index=True)
    available = Column(Boolean, default=True, nullable=False, index=True)
    cuisine = Column(String(50), default="Indian")
    tags = Column(String(255), default="")
    image_emoji = Column(String(10), default="🍽️")
    image_url = Column(String(255), default="")

    # Nutrition per serving (approximate)
    calories = Column(Float, default=0.0, nullable=False)
    protein = Column(Float, default=0.0, nullable=False)
    carbohydrates = Column(Float, default=0.0, nullable=False)
    fat = Column(Float, default=0.0, nullable=False)
    fiber = Column(Float, default=0.0, nullable=False)
    sugar = Column(Float, default=0.0, nullable=False)
    sodium = Column(Float, default=0.0, nullable=False)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(100), ForeignKey("users.id"), nullable=False, index=True)
    total_price = Column(Float, nullable=False, default=0.0)
    total_calories = Column(Float, nullable=False, default=0.0)
    total_protein = Column(Float, nullable=False, default=0.0)
    total_carbs = Column(Float, nullable=False, default=0.0)
    total_fat = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), default="completed")  # "completed", "preparing", "ready"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    food_id = Column(Integer, ForeignKey("food.item_id"), nullable=False)
    food_name = Column(String(120), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    # Frozen nutrition & price at time of purchase
    price = Column(Float, nullable=False)
    calories = Column(Float, nullable=False, default=0.0)
    protein = Column(Float, nullable=False, default=0.0)
    carbohydrates = Column(Float, nullable=False, default=0.0)
    fat = Column(Float, nullable=False, default=0.0)

    order = relationship("Order", back_populates="items")
    food = relationship("Food")


class UserPreference(Base):
    """Retained for backward compatibility with existing session preference store"""
    __tablename__ = "user_preference"

    user_id = Column(String(100), primary_key=True, index=True)
    budget = Column(Float, nullable=True)
    diet = Column(String(50), nullable=True)
    preferred_taste = Column(String(100), nullable=True)
    preferred_cuisine = Column(String(100), nullable=True)
    mood = Column(String(100), nullable=True)
    time_limit = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    recommendation_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("food.item_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    score = Column(Float, nullable=False)
    selected = Column(Boolean, default=False)

    food_item = relationship("Food")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
