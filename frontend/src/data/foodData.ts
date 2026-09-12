export interface FoodNutrition {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export interface FoodDisplayItem {
  id: number;
  name: string;
  category: string;
  price: number;
  prepTime: number;
  available: boolean;
  image: string;
  description: string;
  ingredients: string[];
  nutrition: FoodNutrition;
  tags: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isJain: boolean;
  isSpicy: boolean;
  isPopular?: boolean;
}

// Curated high-res food images matching college canteen dishes with verified visual accuracy
export const FOOD_IMAGES: Record<string, string> = {
  // 1. Rolls & Wraps
  "paneer kathi roll": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
  "paneer roll": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
  "chicken tikka roll": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
  "egg bhurji roll": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
  "aloo corn roll": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80",
  "soya chaap tikka roll": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
  "soya chaap": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",

  // 2. Rice & Biryani
  "veg biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
  "chicken dum biryani": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
  "rajma chawal": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
  "jain dal khichdi": "https://images.unsplash.com/photo-1546833998-877b37c2e5c4?auto=format&fit=crop&w=800&q=80",
  "dal khichdi": "https://images.unsplash.com/photo-1546833998-877b37c2e5c4?auto=format&fit=crop&w=800&q=80",
  "curd rice": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
  "schezwan fried rice": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
  "veg fried rice": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
  "paneer butter masala rice bowl": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
  "paneer butter masala": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
  "dal makhani rice bowl": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
  "dal makhani": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
  "chicken curry rice bowl": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
  "chicken curry": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
  "amritsari chole kulche": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
  "chole kulche": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",

  // 3. Snacks & Street Food
  "cheese grilled sandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  "bombay masala toast sandwich": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
  "toast sandwich": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
  "veg sandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  "masala dosa": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
  "mysore masala dosa": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
  "samosa": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
  "mumbai vada pav": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80",
  "vada pav": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80",
  "veg cutlet": "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80",
  "bun maska": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  "indori poha": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
  "poha": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
  "idli sambar": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
  "medu vada sambar": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
  "medu vada": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
  "chole bhature": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80",
  "mumbai pav bhaji": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80",
  "pav bhaji": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80",
  "peri peri french fries": "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80",
  "french fries": "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80",

  // 4. Noodles & Indo-Chinese
  "classic masala maggi": "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80",
  "cheese masala maggi": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
  "peri peri maggi": "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80",
  "masala maggi": "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80",
  "veg hakka noodles": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
  "egg hakka noodles": "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=800&q=80",
  "chilli garlic noodles": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
  "chilli paneer dry": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
  "chilli paneer": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
  "chilli chicken dry": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
  "chilli chicken": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
  "veg manchurian": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",

  // 5. Beverages
  "cutting masala chai": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
  "masala chai": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
  "south indian filter coffee": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
  "filter coffee": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
  "iced cold coffee": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
  "cold coffee": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
  "fresh lime soda": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "lemon soda": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "alphonso mango lassi": "https://images.unsplash.com/photo-1571006682875-a831e5055b88?auto=format&fit=crop&w=800&q=80",
  "mango lassi": "https://images.unsplash.com/photo-1571006682875-a831e5055b88?auto=format&fit=crop&w=800&q=80",
  "chilled masala buttermilk": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
  "masala buttermilk": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
  "chaas": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
  "sweet buttermilk": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
  "oreo chocolate thick shake": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
  "oreo shake": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
  "kesar badam milk": "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80",
  "badam milk": "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80",
  "lemon iced tea": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80",

  // 6. Sweets & Desserts
  "warm gulab jamun": "https://images.unsplash.com/photo-1605197154344-934c56e3b5e0?auto=format&fit=crop&w=800&q=80",
  "gulab jamun": "https://images.unsplash.com/photo-1605197154344-934c56e3b5e0?auto=format&fit=crop&w=800&q=80",
  "chocolate walnut brownie": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
  "brownie": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
  "fresh fruit custard": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80",
  "spongy rasgulla": "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80",
  "rasgulla": "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80",

  // 7. General Fallbacks
  "default": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
};

// Pre-sorted keys by length descending to prioritize exact/specific dishes over generic substrings
const SORTED_IMAGE_KEYS = Object.keys(FOOD_IMAGES).sort((a, b) => b.length - a.length);

export function getFoodImage(name: string): string {
  if (!name) return FOOD_IMAGES["default"];

  // Normalize name by removing quantity/serving notes like (2 pcs), (Sweet/Salt), (Chilled)
  const cleaned = name
    .toLowerCase()
    .replace(/\([0-9]+\s*pcs\)/gi, "")
    .replace(/\([a-z0-9/\s]+\)/gi, "")
    .trim();

  // 1. Check normalized name against pre-sorted keys (longest first)
  for (const key of SORTED_IMAGE_KEYS) {
    if (key === "default") continue;
    if (cleaned.includes(key)) {
      return FOOD_IMAGES[key];
    }
  }

  // 2. Check original lowercased name
  const rawLower = name.toLowerCase();
  for (const key of SORTED_IMAGE_KEYS) {
    if (key === "default") continue;
    if (rawLower.includes(key)) {
      return FOOD_IMAGES[key];
    }
  }

  // 3. Fallback to dish category keywords
  if (cleaned.includes("roll") || cleaned.includes("kathi") || cleaned.includes("wrap")) {
    return FOOD_IMAGES["paneer kathi roll"];
  }
  if (cleaned.includes("biryani") || cleaned.includes("pulao")) {
    return FOOD_IMAGES["veg biryani"];
  }
  if (cleaned.includes("dosa")) {
    return FOOD_IMAGES["masala dosa"];
  }
  if (cleaned.includes("idli")) {
    return FOOD_IMAGES["idli sambar"];
  }
  if (cleaned.includes("vada") && !cleaned.includes("pav")) {
    return FOOD_IMAGES["medu vada sambar"];
  }
  if (cleaned.includes("sandwich") || cleaned.includes("toast")) {
    return FOOD_IMAGES["cheese grilled sandwich"];
  }
  if (cleaned.includes("pav") || cleaned.includes("burger")) {
    return FOOD_IMAGES["mumbai vada pav"];
  }
  if (cleaned.includes("samosa")) {
    return FOOD_IMAGES["samosa"];
  }
  if (cleaned.includes("maggi")) {
    return FOOD_IMAGES["classic masala maggi"];
  }
  if (cleaned.includes("noodle") || cleaned.includes("chowmein")) {
    return FOOD_IMAGES["veg hakka noodles"];
  }
  if (cleaned.includes("chaap")) {
    return FOOD_IMAGES["soya chaap tikka roll"];
  }
  if (cleaned.includes("paneer")) {
    return FOOD_IMAGES["paneer butter masala"];
  }
  if (cleaned.includes("chicken")) {
    return FOOD_IMAGES["chicken curry"];
  }
  if (cleaned.includes("rice") || cleaned.includes("chawal") || cleaned.includes("khichdi")) {
    return FOOD_IMAGES["rajma chawal"];
  }
  if (cleaned.includes("coffee")) {
    return FOOD_IMAGES["iced cold coffee"];
  }
  if (cleaned.includes("chai") || cleaned.includes("tea")) {
    return FOOD_IMAGES["cutting masala chai"];
  }
  if (cleaned.includes("shake")) {
    return FOOD_IMAGES["oreo chocolate thick shake"];
  }
  if (cleaned.includes("lassi") || cleaned.includes("curd") || cleaned.includes("yogurt")) {
    return FOOD_IMAGES["alphonso mango lassi"];
  }
  if (cleaned.includes("fries")) {
    return FOOD_IMAGES["french fries"];
  }
  if (cleaned.includes("jamun") || cleaned.includes("sweet") || cleaned.includes("dessert") || cleaned.includes("halwa")) {
    return FOOD_IMAGES["warm gulab jamun"];
  }
  if (cleaned.includes("brownie") || cleaned.includes("cake") || cleaned.includes("chocolate")) {
    return FOOD_IMAGES["chocolate walnut brownie"];
  }
  if (cleaned.includes("rasgulla")) {
    return FOOD_IMAGES["spongy rasgulla"];
  }

  return FOOD_IMAGES["default"];
}

// Initial fallback/reference items matching the reference screenshot exactly
export const REFERENCE_MENU_ITEMS: FoodDisplayItem[] = [
  {
    id: 1,
    name: "Paneer Roll",
    category: "Main Course",
    price: 60,
    prepTime: 8,
    available: true,
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
    description: "A delicious roll filled with grilled marinated paneer cubes, crunchy onions, and signature mint sauce.",
    ingredients: ["Paneer", "Onion", "Capsicum", "Wheat Roti", "Spices", "Mint Sauce"],
    nutrition: { calories: "320 kcal", protein: "12g", carbs: "40g", fat: "14g" },
    tags: ["Vegetarian", "Spicy", "Popular"],
    isVegetarian: true,
    isVegan: false,
    isJain: false,
    isSpicy: true,
    isPopular: true
  },
  {
    id: 5,
    name: "Veg Biryani",
    category: "Main Course",
    price: 80,
    prepTime: 15,
    available: true,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    description: "Fragrant basmati rice layered with garden vegetables, saffron, and aromatic Hyderabadi spices.",
    ingredients: ["Basmati Rice", "Carrots", "Beans", "Peas", "Spices", "Fried Onions"],
    nutrition: { calories: "380 kcal", protein: "9g", carbs: "65g", fat: "10g" },
    tags: ["Vegetarian", "Spicy"],
    isVegetarian: true,
    isVegan: true,
    isJain: false,
    isSpicy: true
  },
  {
    id: 20,
    name: "Masala Maggi",
    category: "Snacks",
    price: 40,
    prepTime: 7,
    available: true,
    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80",
    description: "The classic hostel soul food! Two-minute noodles tossed with tomatoes, onions, peas, and spicy masala.",
    ingredients: ["Noodles", "Tomatoes", "Onions", "Peas", "Maggi Masala"],
    nutrition: { calories: "290 kcal", protein: "6g", carbs: "45g", fat: "10g" },
    tags: ["Vegetarian", "Spicy", "Popular"],
    isVegetarian: true,
    isVegan: true,
    isJain: false,
    isSpicy: true,
    isPopular: true
  },
  {
    id: 11,
    name: "Veg Sandwich",
    category: "Snacks",
    price: 50,
    prepTime: 5,
    available: true,
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
    description: "Golden grilled sandwich loaded with melted cheese, crisp cucumber, tomatoes, and tangy green chutney.",
    ingredients: ["Bread", "Cheese", "Cucumber", "Tomato", "Butter", "Green Chutney"],
    nutrition: { calories: "260 kcal", protein: "8g", carbs: "32g", fat: "12g" },
    tags: ["Vegetarian", "Quick Bite"],
    isVegetarian: true,
    isVegan: false,
    isJain: false,
    isSpicy: false
  },
  {
    id: 12,
    name: "Masala Dosa",
    category: "South Indian",
    price: 70,
    prepTime: 12,
    available: true,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    description: "Crispy fermented rice crepe stuffed with spiced mashed potatoes, served with coconut chutney and hot sambar.",
    ingredients: ["Rice-Lentil Batter", "Potato Masala", "Curry Leaves", "Coconut Chutney", "Sambar"],
    nutrition: { calories: "310 kcal", protein: "7g", carbs: "52g", fat: "9g" },
    tags: ["Vegetarian", "South Indian"],
    isVegetarian: true,
    isVegan: true,
    isJain: false,
    isSpicy: true
  },
  {
    id: 35,
    name: "French Fries",
    category: "Fast Food",
    price: 60,
    prepTime: 6,
    available: true,
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80",
    description: "Crisp, golden-brown salted potato batons served with ketchup and spicy mayo.",
    ingredients: ["Potatoes", "Refined Oil", "Salt", "Peri-Peri Seasoning"],
    nutrition: { calories: "340 kcal", protein: "4g", carbs: "48g", fat: "15g" },
    tags: ["Vegetarian", "Fast Food"],
    isVegetarian: true,
    isVegan: true,
    isJain: false,
    isSpicy: false
  },
  {
    id: 28,
    name: "Cold Coffee",
    category: "Beverages",
    price: 50,
    prepTime: 3,
    available: true,
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
    description: "Rich chilled espresso blended with velvety milk, vanilla ice cream, and Hershey's chocolate drizzle.",
    ingredients: ["Espresso Coffee", "Chilled Milk", "Sugar", "Vanilla Ice Cream", "Chocolate Sauce"],
    nutrition: { calories: "220 kcal", protein: "5g", carbs: "30g", fat: "9g" },
    tags: ["Vegetarian", "Beverages", "Popular"],
    isVegetarian: true,
    isVegan: false,
    isJain: false,
    isSpicy: false,
    isPopular: true
  },
  {
    id: 29,
    name: "Lemon Soda",
    category: "Beverages",
    price: 30,
    prepTime: 2,
    available: true,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    description: "Sparkling club soda mixed with fresh Key lime juice, kala namak, mint leaves, and sweet syrup.",
    ingredients: ["Soda", "Fresh Lime Juice", "Kala Namak", "Sugar Syrup", "Mint"],
    nutrition: { calories: "60 kcal", protein: "0g", carbs: "15g", fat: "0g" },
    tags: ["Vegan", "Refreshing", "Beverages"],
    isVegetarian: true,
    isVegan: true,
    isJain: false,
    isSpicy: false
  }
];

