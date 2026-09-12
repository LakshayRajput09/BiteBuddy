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

// Curated high-res food images matching college canteen dishes
export const FOOD_IMAGES: Record<string, string> = {
  "paneer roll": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
  "paneer kathi roll": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
  "chicken tikka roll": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80",
  "egg bhurji roll": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
  "veg biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
  "chicken dum biryani": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
  "masala maggi": "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80",
  "classic masala maggi": "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80",
  "cheese masala maggi": "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80",
  "cheese grilled sandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  "veg sandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  "masala dosa": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
  "french fries": "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80",
  "cold coffee": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
  "iced cold coffee": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
  "fresh lime soda": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "lemon soda": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "samosa": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
  "vada pav": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
  "rajma chawal": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
  "veg hakka noodles": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
  "chilli paneer": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
  "masala chai": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
  "mango lassi": "https://images.unsplash.com/photo-1571006682875-a831e5055b88?auto=format&fit=crop&w=800&q=80",
  "gulab jamun": "https://images.unsplash.com/photo-1605197154344-934c56e3b5e0?auto=format&fit=crop&w=800&q=80",
  "chocolate brownie": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
  "combo 1": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
  "default": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
};

export function getFoodImage(name: string): string {
  const lower = name.toLowerCase();
  for (const key in FOOD_IMAGES) {
    if (lower.includes(key)) {
      return FOOD_IMAGES[key];
    }
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

