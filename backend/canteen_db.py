import os
import json
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, inspect
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(DB_DIR, 'canteen.db')}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class MenuItem(Base):
    """
    SQLite menu_items table per specification:
    - id, name, price, cuisine_tags (array), dietary_tags (array, e.g. veg/vegan/gluten-free),
      available_time, popularity_score, ingredients (array), description
    """
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(120), unique=True, nullable=False, index=True)
    price = Column(Float, nullable=False)
    cuisine_tags = Column(Text, nullable=False)    # Stored as JSON string
    dietary_tags = Column(Text, nullable=False)    # Stored as JSON string
    available_time = Column(String(80), nullable=False, default="08:00 - 22:00")
    popularity_score = Column(Float, nullable=False, default=4.5)
    ingredients = Column(Text, nullable=False)     # Stored as JSON string
    description = Column(Text, nullable=False)
    spice_level = Column(String(30), nullable=False, default="medium")  # none, mild, medium, spicy

    def to_dict(self) -> Dict[str, Any]:
        try:
            c_tags = json.loads(self.cuisine_tags)
        except Exception:
            c_tags = [t.strip() for t in self.cuisine_tags.split(",") if t.strip()]

        try:
            d_tags = json.loads(self.dietary_tags)
        except Exception:
            d_tags = [t.strip() for t in self.dietary_tags.split(",") if t.strip()]

        try:
            ing = json.loads(self.ingredients)
        except Exception:
            ing = [i.strip() for i in self.ingredients.split(",") if i.strip()]

        return {
            "id": self.id,
            "name": self.name,
            "price": float(self.price),
            "cuisine_tags": c_tags,
            "dietary_tags": d_tags,
            "available_time": self.available_time,
            "popularity_score": float(self.popularity_score),
            "ingredients": ing,
            "description": self.description,
            "spice_level": self.spice_level,
        }


SEED_MENU_ITEMS: List[Dict[str, Any]] = [
    {
        "name": "Paneer Kathi Roll",
        "price": 80.0,
        "cuisine_tags": ["Indian", "North Indian", "Street Food", "Wrap"],
        "dietary_tags": ["veg"],
        "available_time": "10:00 - 21:00",
        "popularity_score": 4.8,
        "ingredients": ["cottage cheese (paneer)", "bell peppers", "onions", "whole wheat paratha", "mint chutney", "chaat masala"],
        "description": "Succulent spiced paneer cubes tossed with crunchy bell peppers and rolled in flaky toasted paratha.",
        "spice_level": "medium"
    },
    {
        "name": "Veg Hakka Noodles",
        "price": 70.0,
        "cuisine_tags": ["Chinese", "Indo-Chinese", "Street Food"],
        "dietary_tags": ["veg", "vegan"],
        "available_time": "11:00 - 21:30",
        "popularity_score": 4.6,
        "ingredients": ["wheat noodles", "cabbage", "carrots", "capsicum", "spring onions", "soy sauce", "white pepper"],
        "description": "Wok-tossed noodles with julienned vegetables, aromatic garlic, and authentic Indo-Chinese seasoning.",
        "spice_level": "mild"
    },
    {
        "name": "Veg Fried Rice",
        "price": 70.0,
        "cuisine_tags": ["Chinese", "Indo-Chinese"],
        "dietary_tags": ["veg", "vegan", "gluten-free"],
        "available_time": "11:00 - 21:30",
        "popularity_score": 4.5,
        "ingredients": ["basmati rice", "green beans", "carrots", "sweet corn", "soy sauce", "garlic", "black pepper"],
        "description": "Aromatic stir-fried basmati rice cooked with fresh diced vegetables and mild Chinese spices. Not overly spicy.",
        "spice_level": "mild"
    },
    {
        "name": "Schezwan Fried Rice",
        "price": 75.0,
        "cuisine_tags": ["Chinese", "Indo-Chinese", "Spicy"],
        "dietary_tags": ["veg", "vegan"],
        "available_time": "11:00 - 21:30",
        "popularity_score": 4.7,
        "ingredients": ["basmati rice", "spicy schezwan sauce", "red chilies", "cabbage", "capsicum", "garlic", "spring onions"],
        "description": "Fiery wok-fried rice tossed in house-made red schezwan sauce and pungent garlic.",
        "spice_level": "spicy"
    },
    {
        "name": "Chilli Paneer Dry",
        "price": 95.0,
        "cuisine_tags": ["Chinese", "Indo-Chinese", "Appetizer"],
        "dietary_tags": ["veg"],
        "available_time": "11:00 - 21:00",
        "popularity_score": 4.9,
        "ingredients": ["paneer cubes", "green chilies", "onions", "capsicum", "dark soy sauce", "chili garlic sauce"],
        "description": "Crispy fried cottage cheese chunks sauteed with scallions, green chilies, and tangy soy chili glaze.",
        "spice_level": "spicy"
    },
    {
        "name": "Veg Manchurian",
        "price": 75.0,
        "cuisine_tags": ["Chinese", "Indo-Chinese"],
        "dietary_tags": ["veg", "vegan"],
        "available_time": "11:00 - 21:30",
        "popularity_score": 4.4,
        "ingredients": ["cabbage vegetable balls", "ginger", "garlic", "coriander", "soy gravy", "spring onions"],
        "description": "Golden vegetable dumplings simmered in savory garlic soy sauce.",
        "spice_level": "medium"
    },
    {
        "name": "Mumbai Vada Pav",
        "price": 25.0,
        "cuisine_tags": ["Indian", "Street Food", "Snack"],
        "dietary_tags": ["veg", "vegan"],
        "available_time": "08:00 - 21:30",
        "popularity_score": 4.9,
        "ingredients": ["spiced mashed potato fritter", "gram flour batter", "pav bun", "dry garlic chutney", "green chili chutney"],
        "description": "The quintessential Mumbai street burger. Crispy golden spiced batata vada inside soft pav with spicy garlic crumble.",
        "spice_level": "medium"
    },
    {
        "name": "Samosa (2 pcs)",
        "price": 25.0,
        "cuisine_tags": ["Indian", "Street Food", "Snack"],
        "dietary_tags": ["veg", "vegan"],
        "available_time": "08:00 - 20:00",
        "popularity_score": 4.7,
        "ingredients": ["flour pastry", "potatoes", "green peas", "cumin", "coriander", "tamarind chutney", "mint chutney"],
        "description": "Crispy golden triangular pastry stuffed with savory mashed potatoes and aromatic spices.",
        "spice_level": "mild"
    },
    {
        "name": "Cheese Grilled Sandwich",
        "price": 50.0,
        "cuisine_tags": ["Snack", "Continental", "Quick Bite"],
        "dietary_tags": ["veg"],
        "available_time": "08:30 - 21:30",
        "popularity_score": 4.7,
        "ingredients": ["bread slices", "processed cheese", "butter", "black pepper", "green bell peppers", "oregano"],
        "description": "Crisp toasted white bread filled with generous melted gooey cheese, seasoned with oregano and pepper.",
        "spice_level": "none"
    },
    {
        "name": "Bun Maska",
        "price": 25.0,
        "cuisine_tags": ["Indian", "Breakfast", "Bakery"],
        "dietary_tags": ["veg"],
        "available_time": "08:00 - 18:00",
        "popularity_score": 4.5,
        "ingredients": ["soft bakery bun", "salted butter", "sugar hint", "tutti frutti"],
        "description": "Warm fluffy Irani-style sweet bun generously smothered with creamy salted butter.",
        "spice_level": "none"
    },
    {
        "name": "Classic Masala Maggi",
        "price": 40.0,
        "cuisine_tags": ["Snack", "Comfort Food", "Quick Bite"],
        "dietary_tags": ["veg"],
        "available_time": "08:00 - 22:00",
        "popularity_score": 4.8,
        "ingredients": ["maggi noodles", "maggi tastemaker spices", "onions", "peas", "tomatoes"],
        "description": "Hot, nostalgic 2-minute canteen noodles cooked with finely chopped vegetables and masala broth.",
        "spice_level": "mild"
    },
    {
        "name": "Cheese Masala Maggi",
        "price": 55.0,
        "cuisine_tags": ["Snack", "Comfort Food"],
        "dietary_tags": ["veg"],
        "available_time": "08:00 - 22:00",
        "popularity_score": 4.9,
        "ingredients": ["maggi noodles", "tastemaker spices", "shredded cheddar cheese", "butter", "green peas"],
        "description": "Classic masala maggi loaded with a thick layer of melted cheddar cheese and butter.",
        "spice_level": "mild"
    },
    {
        "name": "Masala Dosa",
        "price": 60.0,
        "cuisine_tags": ["Indian", "South Indian", "Breakfast"],
        "dietary_tags": ["veg", "vegan", "gluten-free"],
        "available_time": "08:00 - 16:00",
        "popularity_score": 4.8,
        "ingredients": ["fermented rice & lentil batter", "spiced potato filling", "mustard seeds", "sambar", "coconut chutney"],
        "description": "Crispy golden crepe made from fermented batter, stuffed with mustard-tempered potato masala.",
        "spice_level": "mild"
    },
    {
        "name": "Idli Sambar (2 pcs)",
        "price": 40.0,
        "cuisine_tags": ["Indian", "South Indian", "Healthy", "Breakfast"],
        "dietary_tags": ["veg", "vegan", "gluten-free"],
        "available_time": "08:00 - 15:00",
        "popularity_score": 4.6,
        "ingredients": ["steamed rice cakes", "pigeon pea lentil soup (sambar)", "drumsticks", "carrots", "coconut chutney"],
        "description": "Steamed fluffy, light rice cakes served with hot vegetable lentil stew and fresh coconut chutney.",
        "spice_level": "mild"
    },
    {
        "name": "Chole Bhature",
        "price": 85.0,
        "cuisine_tags": ["Indian", "North Indian", "Hearty"],
        "dietary_tags": ["veg"],
        "available_time": "10:30 - 16:00",
        "popularity_score": 4.8,
        "ingredients": ["chickpeas (chole)", "fluffy fried bhature", "amchur", "garam masala", "pickled onions", "green chili"],
        "description": "Rich, tangy Punjabi chickpea curry served alongside two oversized, piping-hot puffy fried breads.",
        "spice_level": "medium"
    },
    {
        "name": "Veg Biryani",
        "price": 80.0,
        "cuisine_tags": ["Indian", "North Indian", "Rice"],
        "dietary_tags": ["veg", "gluten-free"],
        "available_time": "12:00 - 21:00",
        "popularity_score": 4.7,
        "ingredients": ["basmati rice", "carrots", "french beans", "paneer", "fried onions", "saffron", "mint raita"],
        "description": "Dum-cooked fragrant basmati rice layered with garden veggies, whole spices, saffron, and cooling raita.",
        "spice_level": "medium"
    },
    {
        "name": "Jain Dal Khichdi",
        "price": 60.0,
        "cuisine_tags": ["Indian", "Comfort Food", "Healthy"],
        "dietary_tags": ["veg", "jain", "gluten-free"],
        "available_time": "11:30 - 21:00",
        "popularity_score": 4.4,
        "ingredients": ["rice", "yellow moong dal", "cumin", "pure ghee", "turmeric", "hing", "no onion", "no garlic"],
        "description": "Gentle, wholesome rice and yellow lentils cooked in desi ghee. Prepared strictly with no onion and no garlic.",
        "spice_level": "none"
    },
    {
        "name": "Curd Rice",
        "price": 50.0,
        "cuisine_tags": ["Indian", "South Indian", "Healthy"],
        "dietary_tags": ["veg", "gluten-free"],
        "available_time": "11:00 - 20:00",
        "popularity_score": 4.3,
        "ingredients": ["boiled rice", "fresh yogurt", "mustard seeds", "curry leaves", "ginger", "pomegranate seeds"],
        "description": "Cool, soothing rice folded into creamy curd with a crunchy mustard and curry leaf tadka.",
        "spice_level": "none"
    },
    {
        "name": "Chicken Tikka Roll",
        "price": 85.0,
        "cuisine_tags": ["Indian", "North Indian", "Wrap", "High Protein"],
        "dietary_tags": ["non-veg"],
        "available_time": "11:30 - 21:30",
        "popularity_score": 4.9,
        "ingredients": ["tandoori boneless chicken", "sliced onions", "whole wheat paratha", "mint yogurt dip", "spices"],
        "description": "Char-grilled tandoori chicken tikka basted in lemon and wrapped in a warm flaky paratha.",
        "spice_level": "medium"
    },
    {
        "name": "Cutting Masala Chai",
        "price": 15.0,
        "cuisine_tags": ["Indian", "Beverage", "Hot"],
        "dietary_tags": ["veg", "gluten-free"],
        "available_time": "07:30 - 21:30",
        "popularity_score": 5.0,
        "ingredients": ["assam black tea", "fresh milk", "crushed ginger", "green cardamom", "cloves", "sugar"],
        "description": "Strong, brisk Mumbai-style spiced milk tea brewed with hand-crushed ginger and fragrant green cardamom.",
        "spice_level": "none"
    },
    {
        "name": "South Indian Filter Coffee",
        "price": 25.0,
        "cuisine_tags": ["Indian", "South Indian", "Beverage", "Hot"],
        "dietary_tags": ["veg", "gluten-free"],
        "available_time": "08:00 - 20:30",
        "popularity_score": 4.8,
        "ingredients": ["roasted chicory coffee decoction", "frothed hot milk", "sugar"],
        "description": "Authentic frothy traditional filter coffee served scalding hot with a rich caramel aroma.",
        "spice_level": "none"
    },
    {
        "name": "Iced Cold Coffee",
        "price": 45.0,
        "cuisine_tags": ["Beverage", "Cold", "Sweet"],
        "dietary_tags": ["veg", "gluten-free"],
        "available_time": "09:00 - 21:30",
        "popularity_score": 4.7,
        "ingredients": ["instant espresso", "chilled milk", "vanilla ice cream scoop", "chocolate drizzle", "crushed ice"],
        "description": "Blended chilled creamy cold coffee crowned with rich chocolate syrup and cocoa dust.",
        "spice_level": "none"
    },
    {
        "name": "Alphonso Mango Lassi",
        "price": 50.0,
        "cuisine_tags": ["Indian", "Beverage", "Cold", "Sweet"],
        "dietary_tags": ["veg", "gluten-free"],
        "available_time": "09:00 - 21:00",
        "popularity_score": 4.8,
        "ingredients": ["alphonso mango pulp", "thick yogurt", "cardamom", "pistachio slivers", "sugar"],
        "description": "Thick, velvety sweet yogurt smoothie blended with ripe Alphonso mangoes and cardamom.",
        "spice_level": "none"
    },
    {
        "name": "Warm Gulab Jamun (2 pcs)",
        "price": 35.0,
        "cuisine_tags": ["Indian", "Dessert", "Sweet"],
        "dietary_tags": ["veg"],
        "available_time": "11:00 - 21:30",
        "popularity_score": 4.6,
        "ingredients": ["khoya milk solids", "cardamom rose sugar syrup", "pistachios"],
        "description": "Soft, melt-in-the-mouth fried milk dumplings soaked in warm rosewater cardamom syrup.",
        "spice_level": "none"
    },
    {
        "name": "Amritsari Chole Kulche",
        "price": 65.0,
        "cuisine_tags": ["Indian", "North Indian", "Punjabi"],
        "dietary_tags": ["veg", "vegan"],
        "available_time": "10:30 - 16:00",
        "popularity_score": 4.8,
        "ingredients": ["chickpeas (chole)", "refined flour kulcha", "onions", "tomatoes", "amchur", "punjabi spices"],
        "description": "Tangy Amritsari spiced chickpeas topped with pickled ginger, green chillies, served with 2 soft baked butter kulchas.",
        "spice_level": "spicy"
    },
    {
        "name": "Mumbai Pav Bhaji",
        "price": 70.0,
        "cuisine_tags": ["Indian", "Maharashtrian", "Street Food", "Snack"],
        "dietary_tags": ["veg"],
        "available_time": "11:00 - 21:30",
        "popularity_score": 4.9,
        "ingredients": ["potatoes", "tomatoes", "green peas", "butter", "soft pav buns", "capsicum", "pav bhaji masala"],
        "description": "Sizzling spiced mashed potato, tomato, and green pea curry with dollops of melting butter, served with 2 warm toasted pavs.",
        "spice_level": "spicy"
    },
    {
        "name": "Soya Chaap Tikka Roll",
        "price": 75.0,
        "cuisine_tags": ["Indian", "North Indian", "Wrap", "High Protein"],
        "dietary_tags": ["veg"],
        "available_time": "11:00 - 21:30",
        "popularity_score": 4.7,
        "ingredients": ["soya chaap", "sliced onions", "capsicum", "whole wheat wrap", "mint chutney", "tandoori spices"],
        "description": "Tandoor-marinated protein-packed soya chaap chunks rolled with sliced onions and spicy mint chutney in a whole wheat wrap.",
        "spice_level": "spicy"
    },
    {
        "name": "Paneer Butter Masala Rice Bowl",
        "price": 95.0,
        "cuisine_tags": ["Indian", "North Indian", "Rice", "Comfort Food"],
        "dietary_tags": ["veg"],
        "available_time": "11:30 - 21:00",
        "popularity_score": 4.9,
        "ingredients": ["fresh paneer", "basmati rice", "butter", "heavy cream", "tomato cashew gravy", "jeera"],
        "description": "Rich velvety cottage cheese cubes in aromatic tomato-cashew makhani gravy over steaming jeera basmati rice.",
        "spice_level": "mild"
    },
    {
        "name": "Dal Makhani Rice Bowl",
        "price": 80.0,
        "cuisine_tags": ["Indian", "North Indian", "Rice", "Comfort Food"],
        "dietary_tags": ["veg"],
        "available_time": "11:30 - 21:00",
        "popularity_score": 4.8,
        "ingredients": ["black urad dal", "rajma kidney beans", "basmati rice", "pure butter", "cream", "whole spices"],
        "description": "Slow-cooked creamy black lentils simmered overnight with butter and fresh cream, served with steamed basmati rice.",
        "spice_level": "mild"
    },
    {
        "name": "Chicken Curry Rice Bowl",
        "price": 110.0,
        "cuisine_tags": ["Indian", "Rice", "High Protein"],
        "dietary_tags": ["non-veg"],
        "available_time": "11:30 - 21:30",
        "popularity_score": 4.9,
        "ingredients": ["tender chicken", "basmati rice", "onion gravy", "ginger", "garlic", "garam masala"],
        "description": "Homestyle slow-braised tender chicken curry infused with whole garam masala over fragrant basmati rice.",
        "spice_level": "medium"
    },
    {
        "name": "Mysore Masala Dosa",
        "price": 75.0,
        "cuisine_tags": ["Indian", "South Indian", "Breakfast", "Snack"],
        "dietary_tags": ["veg", "vegan", "gluten-free"],
        "available_time": "08:00 - 15:30",
        "popularity_score": 4.8,
        "ingredients": ["rice-lentil crepe", "spicy garlic red chili chutney", "potato masala", "sambar", "coconut chutney"],
        "description": "Extra-crispy fermented rice crepe smeared with fiery red garlic chutney and stuffed with spiced potato masala.",
        "spice_level": "spicy"
    },
    {
        "name": "Medu Vada Sambar (2 pcs)",
        "price": 45.0,
        "cuisine_tags": ["Indian", "South Indian", "Breakfast", "Snack"],
        "dietary_tags": ["veg", "vegan", "gluten-free"],
        "available_time": "08:00 - 15:00",
        "popularity_score": 4.7,
        "ingredients": ["urad dal batter", "crushed peppercorns", "curry leaves", "cumin", "drumstick sambar", "coconut chutney"],
        "description": "Deep-fried golden savory lentil donuts, crispy outside and fluffy inside, served with hot sambar and fresh coconut dip.",
        "spice_level": "mild"
    },
    {
        "name": "Peri Peri French Fries",
        "price": 55.0,
        "cuisine_tags": ["Snack", "Continental", "Quick Bite"],
        "dietary_tags": ["veg", "vegan", "gluten-free"],
        "available_time": "10:00 - 21:30",
        "popularity_score": 4.7,
        "ingredients": ["crinkle-cut potatoes", "african bird eye peri peri seasoning", "sea salt", "vegetable oil"],
        "description": "Golden crispy crinkle-cut potato fries dusted generously with zesty African bird's eye peri peri seasoning.",
        "spice_level": "spicy"
    },
    {
        "name": "Bombay Masala Toast Sandwich",
        "price": 55.0,
        "cuisine_tags": ["Indian", "Street Food", "Snack"],
        "dietary_tags": ["veg"],
        "available_time": "09:00 - 21:30",
        "popularity_score": 4.8,
        "ingredients": ["white bread", "spiced potato mash", "sliced beetroot", "onions", "cucumber", "cheddar cheese", "mint chutney"],
        "description": "Triple-decker toasted sandwich packed with spiced turmeric potato mash, crunchy beetroot, onion rings, cucumber, and green chutney.",
        "spice_level": "medium"
    },
    {
        "name": "Chilli Garlic Noodles",
        "price": 75.0,
        "cuisine_tags": ["Chinese", "Indo-Chinese", "Noodles"],
        "dietary_tags": ["veg", "vegan"],
        "available_time": "11:00 - 21:30",
        "popularity_score": 4.7,
        "ingredients": ["wheat noodles", "crushed burnt garlic", "dry red chili flakes", "capsicum", "cabbage", "dark soy sauce"],
        "description": "Wok-charred wheat noodles tossed with pungent crushed garlic, dry red chili flakes, bell peppers, and scallions.",
        "spice_level": "spicy"
    },
    {
        "name": "Peri Peri Maggi",
        "price": 50.0,
        "cuisine_tags": ["Snack", "Comfort Food", "Fusion"],
        "dietary_tags": ["veg"],
        "available_time": "08:00 - 22:00",
        "popularity_score": 4.9,
        "ingredients": ["maggi noodles", "peri peri spice mix", "sweet corn", "melted butter", "maggi tastemaker"],
        "description": "Piping hot 2-minute canteen maggi noodles spiked with smoky fiery peri peri herbs, butter, and crunchy sweet corn.",
        "spice_level": "spicy"
    },
    {
        "name": "Oreo Chocolate Thick Shake",
        "price": 65.0,
        "cuisine_tags": ["Beverage", "Cold", "Sweet", "Dessert"],
        "dietary_tags": ["veg"],
        "available_time": "09:00 - 21:30",
        "popularity_score": 4.9,
        "ingredients": ["whole milk", "oreo cookies", "vanilla ice cream scoop", "hershey chocolate syrup", "whipped cream"],
        "description": "Creamy, indulgent whole milk shake blended with crunchy Oreo biscuits, vanilla ice cream, and Hershey's chocolate drizzle.",
        "spice_level": "none"
    },
    {
        "name": "Kesar Badam Milk (Chilled)",
        "price": 45.0,
        "cuisine_tags": ["Indian", "Beverage", "Cold", "Sweet"],
        "dietary_tags": ["veg", "gluten-free"],
        "available_time": "08:00 - 21:00",
        "popularity_score": 4.8,
        "ingredients": ["pure whole milk", "crushed almonds", "kashmiri saffron kesar", "green cardamom", "pistachios", "sugar"],
        "description": "Refreshing traditional royal saffron-infused milk blended with ground almonds, green cardamom, and crushed pistachios.",
        "spice_level": "none"
    },
    {
        "name": "Lemon Iced Tea",
        "price": 35.0,
        "cuisine_tags": ["Beverage", "Cold", "Continental"],
        "dietary_tags": ["veg", "vegan", "gluten-free"],
        "available_time": "09:00 - 21:30",
        "popularity_score": 4.6,
        "ingredients": ["brewed black tea", "fresh lemon juice", "garden mint sprigs", "raw sugar", "crushed ice"],
        "description": "Chilled black tea infused with fresh citrus lemon juice, cooling garden mint leaves, and light brown sugar over crushed ice.",
        "spice_level": "none"
    },
    {
        "name": "Spongy Rasgulla (2 pcs)",
        "price": 35.0,
        "cuisine_tags": ["Indian", "Dessert", "Sweet"],
        "dietary_tags": ["veg", "gluten-free"],
        "available_time": "10:00 - 21:30",
        "popularity_score": 4.7,
        "ingredients": ["fresh chhena cottage cheese", "light sugar syrup", "rose water", "green cardamom"],
        "description": "Light, melt-in-mouth Kolkata-style cottage cheese spheres gently poached in fragrant rose and cardamom infused light sugar syrup.",
        "spice_level": "none"
    },
    {
        "name": "Egg Bhurji Roll",
        "price": 55.0,
        "cuisine_tags": ["Indian", "Wrap", "Street Food"],
        "dietary_tags": ["non-veg"],
        "available_time": "08:00 - 21:30",
        "popularity_score": 4.6,
        "ingredients": ["eggs", "onion", "tomato", "wheat roti", "green chilli", "spices"],
        "description": "Double egg scramble cooked with chopped tomatoes, onions, green chillies, and roasted cumin.",
        "spice_level": "medium"
    },
    {
        "name": "Aloo Corn Roll",
        "price": 45.0,
        "cuisine_tags": ["Indian", "Wrap", "Street Food"],
        "dietary_tags": ["veg", "vegan"],
        "available_time": "08:00 - 21:00",
        "popularity_score": 4.5,
        "ingredients": ["potatoes", "sweet corn", "wheat roti", "coriander", "spices"],
        "description": "Spiced golden potatoes and sweet corn kernels seasoned with chaat masala in a crispy wrap.",
        "spice_level": "medium"
    },
    {
        "name": "Chicken Dum Biryani",
        "price": 120.0,
        "cuisine_tags": ["Indian", "Hyderabadi", "Rice"],
        "dietary_tags": ["non-veg"],
        "available_time": "12:00 - 21:30",
        "popularity_score": 5.0,
        "ingredients": ["basmati rice", "chicken", "yogurt", "fried onion", "saffron", "spices"],
        "description": "Slow dum-cooked royal basmati rice with succulent chicken pieces, caramelized onions, and saffron aroma.",
        "spice_level": "medium"
    },
    {
        "name": "Rajma Chawal",
        "price": 70.0,
        "cuisine_tags": ["Indian", "North Indian", "Comfort Food"],
        "dietary_tags": ["veg", "vegan"],
        "available_time": "11:30 - 21:00",
        "popularity_score": 4.7,
        "ingredients": ["kidney beans", "basmati rice", "tomato gravy", "ginger", "garlic", "spices"],
        "description": "Hearty Punjabi red kidney beans in rich spiced tomato sauce served with steaming basmati rice.",
        "spice_level": "medium"
    },
    {
        "name": "Veg Cutlet (2 pcs)",
        "price": 35.0,
        "cuisine_tags": ["Indian", "Snack", "Street Food"],
        "dietary_tags": ["veg", "vegan"],
        "available_time": "09:00 - 20:00",
        "popularity_score": 4.5,
        "ingredients": ["potatoes", "beetroot", "carrots", "breadcrumbs", "green chutney"],
        "description": "Crispy golden patties of spiced beetroot and mashed garden vegetables with mint dip.",
        "spice_level": "mild"
    },
    {
        "name": "Indori Poha",
        "price": 30.0,
        "cuisine_tags": ["Indian", "Breakfast", "Snack"],
        "dietary_tags": ["veg", "vegan"],
        "available_time": "07:30 - 14:00",
        "popularity_score": 4.7,
        "ingredients": ["flattened rice", "peanuts", "onion", "mustard seeds", "lemon", "ratlami sev"],
        "description": "Light, fluffy steamed flattened rice tempered with mustard, turmeric, crunchy peanuts, and sev.",
        "spice_level": "mild"
    },
    {
        "name": "Egg Hakka Noodles",
        "price": 80.0,
        "cuisine_tags": ["Chinese", "Indo-Chinese", "Noodles"],
        "dietary_tags": ["non-veg"],
        "available_time": "11:00 - 21:30",
        "popularity_score": 4.6,
        "ingredients": ["wheat noodles", "scrambled egg", "vegetables", "soy sauce", "pepper"],
        "description": "Wok-tossed street-style noodles with fluffy egg ribbons, cabbage, and soy garlic sauce.",
        "spice_level": "medium"
    },
    {
        "name": "Chilli Chicken Dry",
        "price": 110.0,
        "cuisine_tags": ["Chinese", "Indo-Chinese", "Appetizer"],
        "dietary_tags": ["non-veg"],
        "available_time": "11:30 - 21:30",
        "popularity_score": 4.9,
        "ingredients": ["boneless chicken", "dark soya sauce", "chilli sauce", "spring onion", "capsicum"],
        "description": "Crispy fried tender chicken bites tossed in fiery chili garlic and dark soy glaze with scallions.",
        "spice_level": "spicy"
    },
    {
        "name": "Fresh Lime Soda (Sweet/Salt)",
        "price": 30.0,
        "cuisine_tags": ["Beverage", "Cold", "Indian"],
        "dietary_tags": ["veg", "vegan", "gluten-free"],
        "available_time": "08:00 - 21:30",
        "popularity_score": 4.7,
        "ingredients": ["club soda", "fresh lemon juice", "mint", "kala namak", "sugar syrup"],
        "description": "Fizzy effervescent lime soda with crushed fresh mint, kala namak, and sweet or salty kick.",
        "spice_level": "none"
    },
    {
        "name": "Chilled Masala Buttermilk (Chaas)",
        "price": 20.0,
        "cuisine_tags": ["Indian", "Beverage", "Cold"],
        "dietary_tags": ["veg", "gluten-free"],
        "available_time": "08:00 - 21:30",
        "popularity_score": 4.8,
        "ingredients": ["curd", "water", "roasted cumin", "coriander", "black salt"],
        "description": "Traditional cooling spiced buttermilk churned with roasted cumin, rock salt, and coriander.",
        "spice_level": "mild"
    },
    {
        "name": "Chocolate Walnut Brownie",
        "price": 60.0,
        "cuisine_tags": ["Dessert", "Bakery", "Sweet"],
        "dietary_tags": ["veg"],
        "available_time": "10:00 - 21:30",
        "popularity_score": 4.8,
        "ingredients": ["cocoa", "walnuts", "refined flour", "dark chocolate", "butter"],
        "description": "Fudgy rich Belgian dark chocolate brownie studded with crunchy roasted California walnuts.",
        "spice_level": "none"
    },
    {
        "name": "Fresh Fruit Custard",
        "price": 40.0,
        "cuisine_tags": ["Dessert", "Sweet", "Continental"],
        "dietary_tags": ["veg", "gluten-free"],
        "available_time": "10:00 - 21:30",
        "popularity_score": 4.6,
        "ingredients": ["vanilla custard", "apple", "banana", "pomegranate", "grapes"],
        "description": "Chilled smooth vanilla custard packed with crisp diced seasonal apples, bananas, and ruby pomegranate seeds.",
        "spice_level": "none"
    }
]


def init_canteen_db():
    """Create menu_items table if not exists and seed or sync all items."""
    Base.metadata.create_all(bind=engine)
    session: Session = SessionLocal()
    try:
        count = 0
        for item_data in SEED_MENU_ITEMS:
            existing = session.query(MenuItem).filter(MenuItem.name == item_data["name"]).first()
            if not existing:
                item = MenuItem(
                    name=item_data["name"],
                    price=item_data["price"],
                    cuisine_tags=json.dumps(item_data["cuisine_tags"]),
                    dietary_tags=json.dumps(item_data["dietary_tags"]),
                    available_time=item_data["available_time"],
                    popularity_score=item_data["popularity_score"],
                    ingredients=json.dumps(item_data["ingredients"]),
                    description=item_data["description"],
                    spice_level=item_data["spice_level"]
                )
                session.add(item)
                count += 1
            else:
                existing.price = item_data["price"]
                existing.cuisine_tags = json.dumps(item_data["cuisine_tags"])
                existing.dietary_tags = json.dumps(item_data["dietary_tags"])
                existing.available_time = item_data["available_time"]
                existing.popularity_score = item_data["popularity_score"]
                existing.ingredients = json.dumps(item_data["ingredients"])
                existing.description = item_data["description"]
                existing.spice_level = item_data["spice_level"]
        session.commit()
        if count > 0:
            print(f"Added {count} new menu items into canteen database.")
    finally:
        session.close()


def get_all_menu_items(db: Optional[Session] = None) -> List[Dict[str, Any]]:
    """Retrieve all menu items as dictionaries."""
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        items = db.query(MenuItem).all()
        return [item.to_dict() for item in items]
    finally:
        if should_close:
            db.close()


def find_menu_item_by_name(name_query: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    """Find a menu item by exact or case-insensitive substring match."""
    if not name_query:
        return None

    items = get_all_menu_items(db)
    clean_query = name_query.strip().lower()

    # Exact match first
    for item in items:
        if item["name"].lower() == clean_query:
            return item

    # Substring match
    for item in items:
        if clean_query in item["name"].lower():
            return item

    return None

