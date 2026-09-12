import os
import sys
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import (
    Base, engine, SessionLocal, Food, User, StudentProfile,
    StudentNutritionGoal, Order, OrderItem, init_db
)

FOOD_ITEMS = [
    {
        "item_id": 1,
        "name": "Paneer Kathi Roll",
        "description": "A delicious roll filled with grilled paneer cubes, crisp capsicum, onions, and mint chutney wrapped in a flaky wheat roti.",
        "category": "Roll",
        "price": 75.0,
        "ingredients": "paneer,onion,capsicum,wheat roti,mint chutney,spices",
        "serving_size": "1 roll (220g)",
        "vegetarian": True, "vegan": False, "jain": False,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 8, "available": True, "cuisine": "North Indian",
        "tags": "filling,protein-rich,spicy,roll,high-protein,snack",
        "image_emoji": "🌯",
        "calories": 340.0, "protein": 18.0, "carbohydrates": 32.0, "fat": 16.0,
        "fiber": 4.0, "sugar": 3.0, "sodium": 520.0
    },
    {
        "item_id": 2,
        "name": "Chicken Tikka Roll",
        "description": "Juicy tandoori chicken tikka tossed with fresh onions and green chutney in a warm wheat paratha.",
        "category": "Roll",
        "price": 85.0,
        "ingredients": "chicken,onion,wheat roti,mint chutney,spices",
        "serving_size": "1 roll (240g)",
        "vegetarian": False, "vegan": False, "jain": False,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 9, "available": True, "cuisine": "North Indian",
        "tags": "protein,non-veg,roll,savory,high-protein",
        "image_emoji": "🌯",
        "calories": 380.0, "protein": 26.0, "carbohydrates": 35.0, "fat": 12.0,
        "fiber": 3.0, "sugar": 2.0, "sodium": 640.0
    },
    {
        "item_id": 3,
        "name": "Egg Bhurji Roll",
        "description": "Double egg scramble cooked with chopped tomatoes, onions, green chillies, and roasted cumin.",
        "category": "Roll",
        "price": 55.0,
        "ingredients": "eggs,onion,tomato,wheat roti,green chilli,spices",
        "serving_size": "1 roll (200g)",
        "vegetarian": False, "vegan": False, "jain": False,
        "contains_egg": True, "contains_dairy": False, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 7, "available": True, "cuisine": "Indian",
        "tags": "quick-bite,egg,protein,savory",
        "image_emoji": "🌯",
        "calories": 290.0, "protein": 14.0, "carbohydrates": 28.0, "fat": 13.0,
        "fiber": 2.5, "sugar": 2.0, "sodium": 480.0
    },
    {
        "item_id": 4,
        "name": "Aloo Corn Roll",
        "description": "Spiced golden potatoes and sweet corn kernels seasoned with chaat masala in a crispy wrap.",
        "category": "Roll",
        "price": 45.0,
        "ingredients": "potatoes,sweet corn,wheat roti,coriander,spices",
        "serving_size": "1 roll (190g)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 6, "available": True, "cuisine": "Indian",
        "tags": "budget,vegan,quick-bite,crispy",
        "image_emoji": "🌯",
        "calories": 260.0, "protein": 6.0, "carbohydrates": 42.0, "fat": 8.0,
        "fiber": 4.5, "sugar": 3.5, "sodium": 410.0
    },
    {
        "item_id": 5,
        "name": "Veg Biryani",
        "description": "Fragrant long-grain basmati rice layered with garden vegetables, saffron, and aromatic spices.",
        "category": "Rice",
        "price": 80.0,
        "ingredients": "basmati rice,carrots,beans,peas,onion,aromatic spices",
        "serving_size": "1 bowl (350g)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": False, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 14, "available": True, "cuisine": "Hyderabadi",
        "tags": "heavy-meal,filling,flavorful,lunch",
        "image_emoji": "🍚",
        "calories": 450.0, "protein": 10.0, "carbohydrates": 70.0, "fat": 12.0,
        "fiber": 6.0, "sugar": 3.0, "sodium": 590.0
    },
    {
        "item_id": 6,
        "name": "Chicken Dum Biryani",
        "description": "Slow-cooked Hyderabadi chicken biryani infused with kewra water, caramelized onions, and tender bone-in chicken.",
        "category": "Rice",
        "price": 120.0,
        "ingredients": "basmati rice,chicken,yogurt,fried onion,saffron,spices",
        "serving_size": "1 bowl (400g)",
        "vegetarian": False, "vegan": False, "jain": False,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": False, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 15, "available": True, "cuisine": "Hyderabadi",
        "tags": "hearty,non-veg,chef-special,high-protein",
        "image_emoji": "🍗",
        "calories": 580.0, "protein": 34.0, "carbohydrates": 65.0, "fat": 20.0,
        "fiber": 4.0, "sugar": 2.5, "sodium": 750.0
    },
    {
        "item_id": 7,
        "name": "Rajma Chawal",
        "description": "Home-style tender red kidney beans slow-simmered in rich ginger-tomato gravy, served over steamed basmati rice.",
        "category": "Rice",
        "price": 70.0,
        "ingredients": "kidney beans,basmati rice,tomato gravy,ginger,garlic,spices",
        "serving_size": "1 bowl (380g)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": False, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 10, "available": True, "cuisine": "Punjabi",
        "tags": "comfort-food,homely,fiber-rich,filling",
        "image_emoji": "🍛",
        "calories": 420.0, "protein": 15.0, "carbohydrates": 74.0, "fat": 6.0,
        "fiber": 11.0, "sugar": 4.0, "sodium": 540.0
    },
    {
        "item_id": 8,
        "name": "Jain Dal Khichdi",
        "description": "Wholesome yellow moong dal and rice tempered with cumin and cow ghee, without onion, garlic, or root vegetables.",
        "category": "Rice",
        "price": 60.0,
        "ingredients": "rice,yellow moong dal,cumin,turmeric,ghee",
        "serving_size": "1 bowl (320g)",
        "vegetarian": True, "vegan": False, "jain": True,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": False, "contains_nuts": False,
        "spicy": False, "sweet": False,
        "preparation_time": 8, "available": True, "cuisine": "Indian",
        "tags": "light,gut-friendly,jain,comfort,healthy",
        "image_emoji": "🍲",
        "calories": 310.0, "protein": 11.0, "carbohydrates": 52.0, "fat": 6.5,
        "fiber": 5.0, "sugar": 1.0, "sodium": 380.0
    },
    {
        "item_id": 9,
        "name": "Curd Rice",
        "description": "Cooling South Indian comfort rice mixed with velvety curd, tempered with mustard seeds, curry leaves, and ginger.",
        "category": "Rice",
        "price": 50.0,
        "ingredients": "rice,fresh curd,mustard seeds,curry leaves,green chilli",
        "serving_size": "1 bowl (300g)",
        "vegetarian": True, "vegan": False, "jain": True,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": False, "contains_nuts": False,
        "spicy": False, "sweet": False,
        "preparation_time": 5, "available": True, "cuisine": "South Indian",
        "tags": "cooling,soothing,exam-calm,gut-friendly",
        "image_emoji": "🥣",
        "calories": 280.0, "protein": 8.0, "carbohydrates": 44.0, "fat": 7.0,
        "fiber": 2.0, "sugar": 3.0, "sodium": 340.0
    },
    {
        "item_id": 10,
        "name": "Schezwan Fried Rice",
        "description": "Wok-tossed rice with crisp vegetables in spicy, garlicky Schezwan sauce with a hint of toasted sesame.",
        "category": "Rice",
        "price": 75.0,
        "ingredients": "rice,cabbage,bell pepper,onion,schezwan sauce,garlic",
        "serving_size": "1 bowl (330g)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 11, "available": True, "cuisine": "Indo-Chinese",
        "tags": "fiery,spicy,street-style,filling",
        "image_emoji": "🥡",
        "calories": 390.0, "protein": 7.0, "carbohydrates": 68.0, "fat": 10.0,
        "fiber": 4.0, "sugar": 3.0, "sodium": 680.0
    },
    {
        "item_id": 11,
        "name": "Cheese Grilled Sandwich",
        "description": "Toasted golden brown bread slices loaded with melted cheddar-mozzarella blend, bell peppers, and oregano.",
        "category": "Snacks",
        "price": 50.0,
        "ingredients": "white bread,cheese slice,tomato,cucumber,capsicum,butter",
        "serving_size": "2 halves (180g)",
        "vegetarian": True, "vegan": False, "jain": False,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": True, "contains_nuts": False,
        "spicy": False, "sweet": False,
        "preparation_time": 5, "available": True, "cuisine": "Continental",
        "tags": "cheesy,quick,crowd-favorite,comfort",
        "image_emoji": "🥪",
        "calories": 320.0, "protein": 12.0, "carbohydrates": 36.0, "fat": 14.0,
        "fiber": 3.0, "sugar": 3.0, "sodium": 510.0
    },
    {
        "item_id": 12,
        "name": "Masala Dosa",
        "description": "Golden crisp crepe made from fermented batter, stuffed with mildly spiced potato masala, served with sambar & coconut chutney.",
        "category": "Snacks",
        "price": 60.0,
        "ingredients": "fermented rice-lentil batter,spiced potato filling,coconut chutney,sambar",
        "serving_size": "1 dosa (250g)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": False, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 10, "available": True, "cuisine": "South Indian",
        "tags": "crispy,traditional,filling,breakfast",
        "image_emoji": "🥞",
        "calories": 340.0, "protein": 8.0, "carbohydrates": 54.0, "fat": 9.0,
        "fiber": 5.0, "sugar": 2.5, "sodium": 490.0
    },
    {
        "item_id": 13,
        "name": "Samosa (2 pcs)",
        "description": "Flaky, golden triangular pastries filled with spicy mashed potatoes, green peas, and whole coriander seeds.",
        "category": "Snacks",
        "price": 25.0,
        "ingredients": "refined flour pastry,spiced potato,peas,cumin,tamarind chutney",
        "serving_size": "2 pieces (160g)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 4, "available": True, "cuisine": "North Indian",
        "tags": "budget,crispy,tea-time,street-food",
        "image_emoji": "🥟",
        "calories": 280.0, "protein": 5.0, "carbohydrates": 34.0, "fat": 14.0,
        "fiber": 3.0, "sugar": 2.0, "sodium": 460.0
    },
    {
        "item_id": 14,
        "name": "Mumbai Vada Pav",
        "description": "The quintessential Mumbai burger: batata vada deep-fried in gram flour batter, sandwiched with garlic peanut chutney in a soft pav.",
        "category": "Snacks",
        "price": 25.0,
        "ingredients": "potato patty,pav bun,garlic chutney,fried green chilli",
        "serving_size": "1 pav (150g)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": True, "contains_nuts": True,
        "spicy": True, "sweet": False,
        "preparation_time": 4, "available": True, "cuisine": "Maharashtrian",
        "tags": "street-style,spicy,grab-and-go,budget",
        "image_emoji": "🍔",
        "calories": 290.0, "protein": 6.0, "carbohydrates": 42.0, "fat": 11.0,
        "fiber": 3.5, "sugar": 3.0, "sodium": 520.0
    },
    {
        "item_id": 15,
        "name": "Veg Cutlet (2 pcs)",
        "description": "Crisp crumb-coated patties made of potatoes, beetroot, green peas, and carrots with spicy mint dip.",
        "category": "Snacks",
        "price": 35.0,
        "ingredients": "potatoes,beetroot,carrots,breadcrumbs,green chutney",
        "serving_size": "2 cutlets (140g)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 6, "available": True, "cuisine": "Indian",
        "tags": "crispy,budget,evening-snack",
        "image_emoji": "🧆",
        "calories": 220.0, "protein": 4.5, "carbohydrates": 32.0, "fat": 8.5,
        "fiber": 4.0, "sugar": 3.0, "sodium": 390.0
    },
    {
        "item_id": 16,
        "name": "Bun Maska",
        "description": "Classic Irani bakery-style soft bun generously spread with salted amul butter, perfect alongside cutting chai.",
        "category": "Snacks",
        "price": 25.0,
        "ingredients": "soft bun,butter,tutti frutti",
        "serving_size": "1 bun (110g)",
        "vegetarian": True, "vegan": False, "jain": True,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": True, "contains_nuts": False,
        "spicy": False, "sweet": True,
        "preparation_time": 3, "available": True, "cuisine": "Parsi/Irani",
        "tags": "nostalgic,sweet-touch,tea-partner,comfort",
        "image_emoji": "🍞",
        "calories": 240.0, "protein": 5.0, "carbohydrates": 30.0, "fat": 11.0,
        "fiber": 1.5, "sugar": 5.0, "sodium": 290.0
    },
    {
        "item_id": 17,
        "name": "Indori Poha",
        "description": "Steamed flattened rice tossed with turmeric, mustard seeds, onions, and crunchy peanuts, topped with ratlami sev and fresh lemon juice.",
        "category": "Snacks",
        "price": 30.0,
        "ingredients": "flattened rice,peanuts,onion,mustard seeds,lemon,sev",
        "serving_size": "1 plate (200g)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": False, "contains_nuts": True,
        "spicy": False, "sweet": False,
        "preparation_time": 5, "available": True, "cuisine": "Central Indian",
        "tags": "light-breakfast,vegan,digestible,quick-bite",
        "image_emoji": "🥣",
        "calories": 250.0, "protein": 6.0, "carbohydrates": 45.0, "fat": 5.0,
        "fiber": 3.0, "sugar": 2.0, "sodium": 310.0
    },
    {
        "item_id": 18,
        "name": "Idli Sambar (2 pcs)",
        "description": "Soft, fluffy steamed rice-lentil idlis served piping hot with vegetable toor dal sambar and fresh coconut chutney.",
        "category": "Snacks",
        "price": 40.0,
        "ingredients": "steamed rice-lentil cakes,toor dal sambar,coconut chutney",
        "serving_size": "2 idlis + sambar (260g)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": False, "contains_nuts": False,
        "spicy": False, "sweet": False,
        "preparation_time": 5, "available": True, "cuisine": "South Indian",
        "tags": "healthy,steamed,oil-free,low-calorie",
        "image_emoji": "⚪",
        "calories": 180.0, "protein": 7.0, "carbohydrates": 36.0, "fat": 1.5,
        "fiber": 4.0, "sugar": 2.0, "sodium": 360.0
    },
    {
        "item_id": 19,
        "name": "Chole Bhature",
        "description": "Spicy Punjabi chickpea curry topped with ginger juliennes and pickled onions, paired with two large fluffy golden bhature.",
        "category": "Snacks",
        "price": 85.0,
        "ingredients": "spiced chickpeas,deep-fried puffed bread,pickled onions",
        "serving_size": "2 bhature + chole (380g)",
        "vegetarian": True, "vegan": False, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 12, "available": True, "cuisine": "Punjabi",
        "tags": "heavy,indulgent,cheat-meal,filling",
        "image_emoji": "🥘",
        "calories": 620.0, "protein": 17.0, "carbohydrates": 78.0, "fat": 28.0,
        "fiber": 9.0, "sugar": 4.0, "sodium": 820.0
    },
    {
        "item_id": 20,
        "name": "Classic Masala Maggi",
        "description": "The college hostel favorite: 2-minute noodles simmered with diced onions, tomatoes, and extra magic masala.",
        "category": "Noodles",
        "price": 40.0,
        "ingredients": "instant noodles,onion,tomato,peas,maggi masala",
        "serving_size": "1 bowl (220g)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 7, "available": True, "cuisine": "Indian Fusion",
        "tags": "late-night-vibe,nostalgic,spicy,comfort",
        "image_emoji": "🍜",
        "calories": 310.0, "protein": 6.5, "carbohydrates": 46.0, "fat": 11.0,
        "fiber": 2.5, "sugar": 2.0, "sodium": 780.0
    },
    {
        "item_id": 21,
        "name": "Cheese Masala Maggi",
        "description": "Steaming masala noodles topped with a double layer of grated cheddar cheese that melts into a creamy sauce.",
        "category": "Noodles",
        "price": 55.0,
        "ingredients": "instant noodles,processed cheese,vegetables,spices",
        "serving_size": "1 bowl (240g)",
        "vegetarian": True, "vegan": False, "jain": False,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 8, "available": True, "cuisine": "Indian Fusion",
        "tags": "creamy,cheesy,comforting,indulgent",
        "image_emoji": "🍜",
        "calories": 420.0, "protein": 11.0, "carbohydrates": 48.0, "fat": 19.0,
        "fiber": 2.5, "sugar": 2.5, "sodium": 890.0
    },
    {
        "item_id": 22,
        "name": "Veg Hakka Noodles",
        "description": "Thin Chinese noodles flash-fried in high-heat wok with shredded cabbage, carrots, bell peppers, and light soy sauce.",
        "category": "Noodles",
        "price": 70.0,
        "ingredients": "noodles,cabbage,carrot,capsicum,spring onion,soy sauce",
        "serving_size": "1 bowl (300g)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": True, "contains_nuts": False,
        "spicy": False, "sweet": False,
        "preparation_time": 9, "available": True, "cuisine": "Indo-Chinese",
        "tags": "mild,classic,wok-tossed,chinese",
        "image_emoji": "🥢",
        "calories": 360.0, "protein": 8.0, "carbohydrates": 62.0, "fat": 9.0,
        "fiber": 4.5, "sugar": 3.0, "sodium": 610.0
    },
    {
        "item_id": 23,
        "name": "Egg Hakka Noodles",
        "description": "Savory wok noodles tossed with fluffy scrambled egg ribbons, crispy spring onions, and garlic-pepper seasoning.",
        "category": "Noodles",
        "price": 80.0,
        "ingredients": "noodles,scrambled egg,vegetables,soy sauce,pepper",
        "serving_size": "1 bowl (320g)",
        "vegetarian": False, "vegan": False, "jain": False,
        "contains_egg": True, "contains_dairy": False, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 10, "available": True, "cuisine": "Indo-Chinese",
        "tags": "protein,egg,chinese,savory",
        "image_emoji": "🥢",
        "calories": 410.0, "protein": 15.0, "carbohydrates": 60.0, "fat": 12.0,
        "fiber": 4.0, "sugar": 2.5, "sodium": 660.0
    },
    {
        "item_id": 24,
        "name": "Chilli Paneer Dry",
        "description": "Crispy fried cottage cheese cubes tossed in spicy chilli-garlic sauce with crunchy bell peppers and scallions.",
        "category": "Chinese",
        "price": 95.0,
        "ingredients": "paneer cubes,bell pepper,onion,soya sauce,green chillies",
        "serving_size": "1 plate (250g)",
        "vegetarian": True, "vegan": False, "jain": False,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 10, "available": True, "cuisine": "Indo-Chinese",
        "tags": "starter,appetizer,spicy,tangy,high-protein",
        "image_emoji": "🧆",
        "calories": 370.0, "protein": 17.0, "carbohydrates": 22.0, "fat": 24.0,
        "fiber": 3.0, "sugar": 4.0, "sodium": 710.0
    },
    {
        "item_id": 25,
        "name": "Chilli Chicken Dry",
        "description": "Battered crispy boneless chicken chunks tossed in dark soya glaze, sliced green chillies, and ginger garlic.",
        "category": "Chinese",
        "price": 110.0,
        "ingredients": "boneless chicken,soya sauce,chilli sauce,spring onion",
        "serving_size": "1 plate (260g)",
        "vegetarian": False, "vegan": False, "jain": False,
        "contains_egg": True, "contains_dairy": False, "contains_gluten": True, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 11, "available": True, "cuisine": "Indo-Chinese",
        "tags": "spicy,non-veg,protein-snack,chef-special",
        "image_emoji": "🍗",
        "calories": 420.0, "protein": 30.0, "carbohydrates": 18.0, "fat": 22.0,
        "fiber": 2.0, "sugar": 3.0, "sodium": 790.0
    },
    {
        "item_id": 26,
        "name": "Cutting Masala Chai",
        "description": "Kadak strong Indian ginger-cardamom tea brewed with buffalo milk, guaranteed to cure exam stress.",
        "category": "Beverages",
        "price": 15.0,
        "ingredients": "brewed black tea,milk,ginger,cardamom,sugar",
        "serving_size": "1 cutting glass (100ml)",
        "vegetarian": True, "vegan": False, "jain": True,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": False, "contains_nuts": False,
        "spicy": False, "sweet": True,
        "preparation_time": 3, "available": True, "cuisine": "Indian",
        "tags": "energy-boost,exam-prep,hot,budget",
        "image_emoji": "☕",
        "calories": 75.0, "protein": 2.0, "carbohydrates": 11.0, "fat": 2.5,
        "fiber": 0.0, "sugar": 9.0, "sodium": 35.0
    },
    {
        "item_id": 27,
        "name": "South Indian Filter Coffee",
        "description": "Authentic chicory-infused decoction blended with steaming frothy milk, served in a traditional dabara set.",
        "category": "Beverages",
        "price": 25.0,
        "ingredients": "freshly brewed chicory coffee,frothed milk,sugar",
        "serving_size": "1 cup (150ml)",
        "vegetarian": True, "vegan": False, "jain": True,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": False, "contains_nuts": False,
        "spicy": False, "sweet": True,
        "preparation_time": 4, "available": True, "cuisine": "South Indian",
        "tags": "caffeine,invigorating,hot",
        "image_emoji": "☕",
        "calories": 95.0, "protein": 3.5, "carbohydrates": 12.0, "fat": 3.5,
        "fiber": 0.0, "sugar": 9.5, "sodium": 45.0
    },
    {
        "item_id": 28,
        "name": "Iced Cold Coffee",
        "description": "Creamy blended cold coffee made with rich espresso, cold milk, chocolate drizzle, and vanilla ice cream scoop.",
        "category": "Beverages",
        "price": 45.0,
        "ingredients": "espresso blend,chilled milk,vanilla ice cream,chocolate syrup",
        "serving_size": "1 tall glass (300ml)",
        "vegetarian": True, "vegan": False, "jain": False,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": False, "contains_nuts": False,
        "spicy": False, "sweet": True,
        "preparation_time": 4, "available": True, "cuisine": "Continental",
        "tags": "refreshing,sweet,chilled,energy",
        "image_emoji": "🧋",
        "calories": 230.0, "protein": 6.0, "carbohydrates": 32.0, "fat": 9.0,
        "fiber": 0.5, "sugar": 28.0, "sodium": 95.0
    },
    {
        "item_id": 29,
        "name": "Fresh Lime Soda (Sweet/Salt)",
        "description": "Refreshing sparkling club soda with freshly squeezed lime juice, mint leaves, rock salt, and cane sugar.",
        "category": "Beverages",
        "price": 30.0,
        "ingredients": "club soda,fresh lemon juice,mint,kala namak,sugar syrup",
        "serving_size": "1 glass (300ml)",
        "vegetarian": True, "vegan": True, "jain": False,
        "contains_egg": False, "contains_dairy": False, "contains_gluten": False, "contains_nuts": False,
        "spicy": False, "sweet": True,
        "preparation_time": 3, "available": True, "cuisine": "Indian",
        "tags": "digestive,thirst-quencher,vegan,cooling",
        "image_emoji": "🍋",
        "calories": 80.0, "protein": 0.0, "carbohydrates": 20.0, "fat": 0.0,
        "fiber": 0.0, "sugar": 18.0, "sodium": 120.0
    },
    {
        "item_id": 30,
        "name": "Alphonso Mango Lassi",
        "description": "Thick, velvety yogurt beverage churned with pure Ratnagiri Alphonso mango pulp and fragrant cardamom.",
        "category": "Beverages",
        "price": 50.0,
        "ingredients": "thick yogurt,mango pulp,cardamom,pistachio garnish",
        "serving_size": "1 kulhad (250ml)",
        "vegetarian": True, "vegan": False, "jain": False,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": False, "contains_nuts": True,
        "spicy": False, "sweet": True,
        "preparation_time": 4, "available": True, "cuisine": "Indian",
        "tags": "rich,cooling,sweet,creamy,dessert",
        "image_emoji": "🥭",
        "calories": 240.0, "protein": 7.0, "carbohydrates": 38.0, "fat": 6.5,
        "fiber": 1.0, "sugar": 34.0, "sodium": 80.0
    },
    {
        "item_id": 31,
        "name": "Chilled Masala Buttermilk (Chaas)",
        "description": "Traditional light spiced buttermilk churned with toasted cumin, fresh coriander, ginger, and pink Himalayan salt.",
        "category": "Beverages",
        "price": 20.0,
        "ingredients": "curd,water,roasted cumin,coriander,black salt",
        "serving_size": "1 glass (250ml)",
        "vegetarian": True, "vegan": False, "jain": True,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": False, "contains_nuts": False,
        "spicy": True, "sweet": False,
        "preparation_time": 2, "available": True, "cuisine": "Indian",
        "tags": "gut-friendly,cooling,hydrating,low-calorie",
        "image_emoji": "🥛",
        "calories": 60.0, "protein": 3.0, "carbohydrates": 5.0, "fat": 2.0,
        "fiber": 0.0, "sugar": 4.0, "sodium": 220.0
    },
    {
        "item_id": 32,
        "name": "Warm Gulab Jamun (2 pcs)",
        "description": "Melt-in-mouth fried milk dough spheres soaked in hot saffron and rosewater sugar syrup.",
        "category": "Sweets",
        "price": 35.0,
        "ingredients": "milk solids,sugar syrup,rose water,cardamom",
        "serving_size": "2 pcs (120g)",
        "vegetarian": True, "vegan": False, "jain": True,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": True, "contains_nuts": False,
        "spicy": False, "sweet": True,
        "preparation_time": 3, "available": True, "cuisine": "Indian",
        "tags": "sweet-tooth,dessert,warm,treat",
        "image_emoji": "🍮",
        "calories": 290.0, "protein": 4.0, "carbohydrates": 46.0, "fat": 10.0,
        "fiber": 0.5, "sugar": 38.0, "sodium": 65.0
    },
    {
        "item_id": 33,
        "name": "Chocolate Walnut Brownie",
        "description": "Fudgy, decadent dark chocolate brownie studded with crunchy roasted California walnut halves.",
        "category": "Sweets",
        "price": 60.0,
        "ingredients": "cocoa,walnuts,refined flour,dark chocolate",
        "serving_size": "1 slice (100g)",
        "vegetarian": True, "vegan": False, "jain": False,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": True, "contains_nuts": True,
        "spicy": False, "sweet": True,
        "preparation_time": 3, "available": True, "cuisine": "Bakery",
        "tags": "chocolate-craving,sweet,comfort,treat",
        "image_emoji": "🍰",
        "calories": 360.0, "protein": 5.0, "carbohydrates": 44.0, "fat": 18.0,
        "fiber": 3.0, "sugar": 30.0, "sodium": 120.0
    },
    {
        "item_id": 34,
        "name": "Fresh Fruit Custard",
        "description": "Chilled smooth vanilla custard packed with crisp diced seasonal apples, bananas, and ruby pomegranate seeds.",
        "category": "Sweets",
        "price": 40.0,
        "ingredients": "vanilla custard,apple,banana,pomegranate,grapes",
        "serving_size": "1 bowl (200g)",
        "vegetarian": True, "vegan": False, "jain": True,
        "contains_egg": False, "contains_dairy": True, "contains_gluten": False, "contains_nuts": False,
        "spicy": False, "sweet": True,
        "preparation_time": 4, "available": True, "cuisine": "Continental",
        "tags": "fruity,light-sweet,chilled,healthy",
        "image_emoji": "🍨",
        "calories": 190.0, "protein": 4.0, "carbohydrates": 38.0, "fat": 3.0,
        "fiber": 2.5, "sugar": 28.0, "sodium": 70.0
    }
]


def seed_database():
    init_db()
    db = SessionLocal()

    # 1. Seed or update Food items
    print("Seeding/updating food items with nutrition data...")
    count = 0
    for data in FOOD_ITEMS:
        item_id = data["item_id"]
        existing = db.query(Food).filter(Food.item_id == item_id).first()
        if existing:
            for k, v in data.items():
                setattr(existing, k, v)
        else:
            db.add(Food(**data))
        count += 1
    db.commit()
    print(f"Seeded {count} food items successfully.")

    # 2. Seed Demo Student
    student_id = "student_lakshay"
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        student = User(
            id=student_id,
            name="Lakshay",
            email="student@example.com",
            password_hash="student123",
            role="student"
        )
        db.add(student)
        db.commit()

        # Seed profile
        profile = StudentProfile(
            user_id=student_id,
            budget=120.0,
            time_limit=10,
            mood="Comfort Food",
            cuisine_preference="Indian",
            dietary_preferences="Vegetarian",
            taste_preferences="Spicy"
        )
        db.add(profile)

        # Seed nutrition goals
        goals = StudentNutritionGoal(
            user_id=student_id,
            calorie_goal=2200.0,
            protein_goal=120.0,
            carb_goal=250.0,
            fat_goal=70.0,
            enabled=True
        )
        db.add(goals)
        db.commit()

        # Seed today's initial consumed orders so dashboard shows exact prompt state:
        # Calories: 850 / 2200, Protein: 48 / 120, Carbs: 105 / 250, Fat: 28 / 70
        # Order 1: Breakfast
        order_1 = Order(
            student_id=student_id,
            total_price=95.0,
            total_calories=400.0,
            total_protein=26.0,
            total_carbs=45.0,
            total_fat=14.0,
            status="completed",
            created_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add(order_1)
        db.commit()

        item_1 = OrderItem(
            order_id=order_1.id,
            food_id=11,  # Cheese Sandwich
            food_name="Paneer Sandwich",
            quantity=1,
            price=50.0,
            calories=320.0,
            protein=20.0,
            carbohydrates=35.0,
            fat=12.0
        )
        item_2 = OrderItem(
            order_id=order_1.id,
            food_id=29,  # Lemon Soda
            food_name="Lemon Soda",
            quantity=1,
            price=30.0,
            calories=80.0,
            protein=6.0,
            carbohydrates=10.0,
            fat=2.0
        )
        db.add_all([item_1, item_2])

        # Order 2: Lunch
        order_2 = Order(
            student_id=student_id,
            total_price=80.0,
            total_calories=450.0,
            total_protein=22.0,
            total_carbs=60.0,
            total_fat=14.0,
            status="completed",
            created_at=datetime.utcnow() - timedelta(hours=1)
        )
        db.add(order_2)
        db.commit()

        item_3 = OrderItem(
            order_id=order_2.id,
            food_id=5,  # Veg Biryani
            food_name="Veg Biryani",
            quantity=1,
            price=80.0,
            calories=450.0,
            protein=22.0,
            carbohydrates=60.0,
            fat=14.0
        )
        db.add(item_3)
        db.commit()
        print(f"Created demo student account '{student.name}' with initial order history.")

    # 3. Seed Demo Owner
    owner_id = "owner_ramesh"
    owner = db.query(User).filter(User.id == owner_id).first()
    if not owner:
        owner = User(
            id=owner_id,
            name="Chef Ramesh",
            email="owner@canteen.edu",
            password_hash="owner123",
            role="cafeteria_owner",
            canteen_name="Campus Central Canteen",
            canteen_location="Student Activity Center, Block B",
            contact_info="+91 98765 43210"
        )
        db.add(owner)
        db.commit()
        print(f"Created demo owner account '{owner.name}'.")

    db.close()
    print("Database seeding finished!")


if __name__ == "__main__":
    seed_database()
