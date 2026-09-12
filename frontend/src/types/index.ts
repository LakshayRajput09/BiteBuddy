export interface FoodItem {
  item_id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  ingredients: string;
  serving_size: string;
  vegetarian: boolean;
  vegan: boolean;
  jain: boolean;
  contains_egg?: boolean;
  contains_dairy?: boolean;
  contains_gluten?: boolean;
  contains_nuts?: boolean;
  spicy: boolean;
  sweet: boolean;
  preparation_time: number;
  available: boolean;
  cuisine: string;
  tags: string;
  image_emoji: string;
  image_url?: string;

  // Approximate nutrition per serving
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface RecommendationCardData {
  item: FoodItem;
  score: number;
  match_percentage: number;
  reasons: string[];
  score_breakdown: Record<string, number>;
}

export interface MealCombinationData {
  main_item: FoodItem;
  side_item: FoodItem;
  total_price: number;
  max_prep_time: number;
  budget_remaining: number;
  description: string;
  total_calories?: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
}

export interface FoodComparisonResult {
  dish_a: FoodItem;
  dish_b: FoodItem;
  verdict: string;
  highlights: string[];
}

export interface OrderAction {
  action_type: string;
  item: FoodItem;
  quantity: number;
  total_price: number;
}

export interface RemovedItemData {
  item_id: number;
  name: string;
  price: number;
  preparation_time: number;
  reason: string;
}

export interface ScoreEntryData {
  name: string;
  score: number;
  match_percentage: number;
  breakdown: Record<string, number>;
  reasons: string[];
}

export interface DebugInfoData {
  raw_message: string;
  detected_intent: string;
  extracted_constraints: Record<string, any>;
  extracted_preferences: Record<string, any>;
  filtered_items: string[];
  removed_items: RemovedItemData[];
  final_scores: ScoreEntryData[];
  top_3: string[];
  llm_provider?: string;
}

export interface ChatResponseData {
  reply_text: string;
  response_type?: string;
  is_clarification: boolean;
  clarification_type?: string | null;
  recommendation?: RecommendationCardData | null;
  combo?: MealCombinationData | null;
  alternatives: RecommendationCardData[];
  recommendations?: RecommendationCardData[];
  closest_match?: RecommendationCardData | null;
  failing_constraints?: Record<string, any> | null;
  explanation?: string | null;
  session_id: string;
  extracted_preferences?: Record<string, any> | null;
  suggested_followups?: string[];
  quick_actions?: string[];
  matched_items?: FoodItem[];
  intent?: string | null;
  comparison?: FoodComparisonResult | null;
  order_action?: OrderAction | null;
  debug_info?: DebugInfoData | null;
  turn_count?: number;
  conversation_stage?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "ai";
  text: string;
  timestamp: string;
  response_type?: string;
  recommendation?: RecommendationCardData | null;
  combo?: MealCombinationData | null;
  alternatives?: RecommendationCardData[];
  recommendations?: RecommendationCardData[];
  closest_match?: RecommendationCardData | null;
  failing_constraints?: Record<string, any> | null;
  isClarification?: boolean;
  clarificationType?: string | null;
  extractedPreferences?: Record<string, any> | null;
  suggestedFollowups?: string[];
  quick_actions?: string[];
  matchedItems?: FoodItem[];
  intent?: string | null;
  comparison?: FoodComparisonResult | null;
  orderAction?: OrderAction | null;
  debug_info?: DebugInfoData | null;
  turnCount?: number;
  conversationStage?: string;
}

// ==========================================
// Multi-Role & Auth Types
// ==========================================

export type UserRole = "student" | "cafeteria_owner";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  canteen_name?: string | null;
  canteen_location?: string | null;
  contact_info?: string | null;
  created_at?: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// ==========================================
// Student Profile & Nutrition Types
// ==========================================

export interface StudentProfile {
  user_id: string;
  budget: number;
  time_limit: number;
  mood: string;
  cuisine_preference: string;
  dietary_preferences: string[];
  taste_preferences: string[];
}

export interface StudentNutritionGoals {
  calorie_goal: number;
  protein_goal: number;
  carb_goal: number;
  fat_goal: number;
  enabled: boolean;
}

export interface ConsumedMeal {
  order_id: number;
  meal_time: string;
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface DailyNutrition {
  goals: StudentNutritionGoals;
  consumed_calories: number;
  consumed_protein: number;
  consumed_carbs: number;
  consumed_fat: number;
  meals_today: ConsumedMeal[];
}

// ==========================================
// Order Types
// ==========================================

export interface OrderCartItem {
  food_id: number;
  food: FoodItem;
  quantity: number;
}

export interface OrderItemRecord {
  id: number;
  food_id: number;
  food_name: string;
  quantity: number;
  price: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface OrderRecord {
  id: number;
  student_id: string;
  total_price: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  status: string;
  created_at: string;
  items: OrderItemRecord[];
}

// ==========================================
// Cafeteria Owner Stats Types
// ==========================================

export interface PopularItemStat {
  name: string;
  orders: number;
  revenue: number;
  available: boolean;
  category: string;
}

export interface OrderTrendPoint {
  hour: string;
  orders: number;
}

export interface OwnerStats {
  total_items: number;
  available_items: number;
  unavailable_items: number;
  todays_orders: number;
  avg_prep_time: number;
  todays_revenue: number;
  popular_items: PopularItemStat[];
  orders_trend: OrderTrendPoint[];
}
