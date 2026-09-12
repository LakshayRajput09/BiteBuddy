"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Plus, Minus, Check, Heart, Sparkles } from "lucide-react";
import { getFoodImage } from "@/data/foodData";
import { useAuth } from "@/context/AuthContext";
import { useOrder } from "@/context/OrderContext";
import { useToast } from "@/components/Toast";
import { FoodItem, DailyNutrition } from "@/types";

const API_BASE = "http://127.0.0.1:8000";

export default function FoodDetailsPage() {
  const params = useParams();
  const itemId = Number(params?.id);
  const { user } = useAuth();
  const { addToOrder } = useOrder();
  const { showToast } = useToast();

  const [item, setItem] = useState<FoodItem | null>(null);
  const [nutrition, setNutrition] = useState<DailyNutrition | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const studentId = user?.id || "student_lakshay";

  useEffect(() => {
    const loadData = async () => {
      try {
        const [foodRes, nutrRes] = await Promise.all([
          fetch(`${API_BASE}/menu/${itemId}`),
          fetch(`${API_BASE}/student/nutrition?user_id=${studentId}`)
        ]);

        if (foodRes.ok) {
          const fData = await foodRes.json();
          setItem(fData);
        }
        if (nutrRes.ok) {
          const nData = await nutrRes.json();
          setNutrition(nData);
        }
      } catch (e) {
        console.error("Failed to load food details:", e);
      } finally {
        setIsLoading(false);
      }
    };
    if (itemId) {
      loadData();
    }
  }, [itemId, studentId]);

  if (isLoading || !item) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading dish details...</p>
      </div>
    );
  }

  const imageUrl = item.image_url || getFoodImage(item.name);
  const ingredientsList = (item.ingredients || "").split(",").map((s) => s.trim()).filter(Boolean);

  // Goal alignment calculation
  const goals = nutrition?.goals;
  const hasGoals = goals?.enabled && (goals.protein_goal > 0 || goals.calorie_goal > 0);
  const proteinRemaining = goals ? Math.max(0, Math.round(goals.protein_goal - (nutrition?.consumed_protein || 0))) : 0;
  const caloriesRemaining = goals ? Math.max(0, Math.round(goals.calorie_goal - (nutrition?.consumed_calories || 0))) : 0;

  const handleAddOrder = () => {
    if (!item.available) return;
    addToOrder(item, quantity);
    showToast(`Added ${quantity}× ${item.name} to your order tray!`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Back Button */}
      <Link
        href="/menu"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-emerald-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Menu
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Large Food Image */}
        <div className="lg:col-span-5 relative aspect-square lg:aspect-auto bg-slate-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex items-center gap-1.5 flex-wrap">
            {item.vegetarian ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-700 text-white shadow">
                Vegetarian
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-700 text-white shadow">
                Non-Vegetarian
              </span>
            )}
            {item.spicy && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-600 text-white shadow">
                🌶️ Spicy
              </span>
            )}
          </div>
        </div>

        {/* Right: Food Details & Controls */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {item.name}
                </h1>
                <div className="flex items-center gap-3 mt-1.5 text-sm">
                  <span className="font-extrabold text-[#0C3B25] text-2xl">₹{item.price}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500 flex items-center gap-1 text-xs">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {item.preparation_time} min preparation
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-500">{item.serving_size || "1 serving"}</span>
                </div>
              </div>

              {item.available ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Available
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 shrink-0">
                  Sold Out
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              {item.description || "Freshly cooked to order in the college canteen using authentic spices."}
            </p>

            {/* Ingredients */}
            {ingredientsList.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Ingredients
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ingredientsList.map((ing, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition per serving cards */}
            <div className="pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Nutrition Information
                </span>
                <span className="text-[11px] text-gray-400">Approx. per serving</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-[#F8FAF7] border border-slate-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Calories</span>
                  <span className="text-base font-black text-gray-900">{Math.round(item.calories)}</span>
                  <span className="text-[9px] text-gray-400 block">kcal</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Protein</span>
                  <span className="text-base font-black text-emerald-700">{Math.round(item.protein)}</span>
                  <span className="text-[9px] text-gray-400 block">grams</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">Carbs</span>
                  <span className="text-base font-black text-amber-700">{Math.round(item.carbohydrates)}</span>
                  <span className="text-[9px] text-gray-400 block">grams</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <span className="text-[10px] text-rose-800 font-bold uppercase block">Fat</span>
                  <span className="text-base font-black text-rose-700">{Math.round(item.fat)}</span>
                  <span className="text-[9px] text-gray-400 block">grams</span>
                </div>
              </div>

              {/* Secondary macros (Fiber, Sugar, Sodium) */}
              <div className="flex items-center justify-around py-1 text-[11px] text-gray-500 font-mono">
                <span>Fiber: {item.fiber || 3}g</span>
                <span>•</span>
                <span>Sugar: {item.sugar || 2}g</span>
                <span>•</span>
                <span>Sodium: {item.sodium || 420}mg</span>
              </div>
            </div>

            {/* "How this fits your goals" Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>How This Fits Your Goals</span>
              </div>

              {hasGoals ? (
                <p className="text-xs text-emerald-900">
                  You have <span className="font-bold">{proteinRemaining}g protein</span> remaining in your daily goal. This serving provides <span className="font-bold">{Math.round(item.protein)}g protein</span> ({Math.round(((item.protein || 1) / Math.max(1, proteinRemaining)) * 100)}% of remaining target).
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs text-emerald-900">
                    Set nutrition goals to see personalized daily nutrition insights.
                  </p>
                  <Link
                    href="/student/preferences"
                    className="text-xs font-bold text-emerald-800 hover:underline shrink-0"
                  >
                    Set Nutrition Goals →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quantity & Add to Order Bar */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center hover:bg-gray-50 shadow-sm"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-sm text-gray-800 w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center hover:bg-gray-50 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Total and CTA */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-gray-400 block font-semibold">Subtotal</span>
                <span className="text-lg font-black text-[#0C3B25]">₹{item.price * quantity}</span>
              </div>
              <button
                onClick={handleAddOrder}
                disabled={!item.available}
                className="px-6 py-3 bg-[#059669] hover:bg-[#047857] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                Add to Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
