"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Utensils, Sliders, History, PieChart, ShoppingBag, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrder } from "@/context/OrderContext";
import { useToast } from "@/components/Toast";
import { DailyNutrition, FoodItem } from "@/types";

const API_BASE = "http://127.0.0.1:8000";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { addToOrder } = useOrder();
  const { showToast } = useToast();

  const [nutrition, setNutrition] = useState<DailyNutrition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const studentId = user?.id || "student_lakshay";
  const studentName = user?.name || "Lakshay";

  const fetchNutrition = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/nutrition?user_id=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setNutrition(data);
      }
    } catch (e) {
      console.error("Failed to load nutrition data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNutrition();

    // Listen for order completion event to dynamically update progress bars
    const handleOrderPlaced = () => {
      fetchNutrition();
    };

    window.addEventListener("canteen_order_placed", handleOrderPlaced);
    return () => {
      window.removeEventListener("canteen_order_placed", handleOrderPlaced);
    };
  }, [studentId]);

  // Fallbacks if backend is booting or goals disabled
  const goals = nutrition?.goals || {
    calorie_goal: 2200,
    protein_goal: 120,
    carb_goal: 250,
    fat_goal: 70,
    enabled: true
  };

  const consumedCal = nutrition?.consumed_calories ?? 0;
  const consumedProt = nutrition?.consumed_protein ?? 0;
  const consumedCarb = nutrition?.consumed_carbs ?? 0;
  const consumedFat = nutrition?.consumed_fat ?? 0;

  const calPct = Math.min(100, Math.round((consumedCal / goals.calorie_goal) * 100));
  const protPct = Math.min(100, Math.round((consumedProt / goals.protein_goal) * 100));
  const carbPct = Math.min(100, Math.round((consumedCarb / goals.carb_goal) * 100));
  const fatPct = Math.min(100, Math.round((consumedFat / goals.fat_goal) * 100));

  // Best Match sample combo for direct addition
  const bestMatchItem: FoodItem = {
    item_id: 1,
    name: "Paneer Kathi Roll",
    category: "Roll",
    price: 75,
    ingredients: "paneer, onion, capsicum, wheat roti, mint chutney",
    serving_size: "1 roll",
    vegetarian: true,
    vegan: false,
    jain: false,
    spicy: true,
    sweet: false,
    preparation_time: 8,
    available: true,
    cuisine: "North Indian",
    tags: "filling,protein-rich,spicy",
    image_emoji: "🌯",
    calories: 340,
    protein: 18,
    carbohydrates: 32,
    fat: 16
  };

  const handleAddBestMatch = () => {
    addToOrder(bestMatchItem, 1);
    showToast("Added Paneer Kathi Roll to your order tray!");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner: Greeting & Hero CTA */}
      <div className="bg-gradient-to-r from-[#0C3B25] to-[#125B38] rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            AI Canteen Assistant Active
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Good afternoon, {studentName} 👋
          </h1>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            What are you craving today? Tell BiteBuddy your budget, mood, or time limit to find your optimal meal.
          </p>
        </div>

        <div className="z-10 flex flex-wrap items-center gap-3">
          <Link
            href="/chat"
            className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
          >
            <span>Ask BiteBuddy</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/menu"
            className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm rounded-2xl transition-all"
          >
            Browse Menu
          </Link>
        </div>
      </div>

      {/* Today's Nutrition Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🥗</span>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Today&apos;s Nutrition</h2>
            </div>
            <p className="text-xs text-gray-500">
              Computed strictly from meals you have ordered/consumed today.
            </p>
          </div>
          <Link
            href="/student/nutrition"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            Detailed Breakdown →
          </Link>
        </div>

        {/* 4 Macro Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Calories */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700 uppercase tracking-wider">Calories</span>
              <span className="font-mono text-gray-500">{calPct}%</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900">{consumedCal}</span>
              <span className="text-xs text-gray-400">/ {goals.calorie_goal} kcal</span>
            </div>
            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#0C3B25] h-full rounded-full transition-all duration-500"
                style={{ width: `${calPct}%` }}
              />
            </div>
          </div>

          {/* Protein */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-900 uppercase tracking-wider">Protein</span>
              <span className="font-mono text-emerald-700 font-bold">{protPct}%</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-800">{consumedProt}</span>
              <span className="text-xs text-gray-400">/ {goals.protein_goal} g</span>
            </div>
            <div className="w-full bg-emerald-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#059669] h-full rounded-full transition-all duration-500"
                style={{ width: `${protPct}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-amber-900 uppercase tracking-wider">Carbs</span>
              <span className="font-mono text-amber-700">{carbPct}%</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-800">{consumedCarb}</span>
              <span className="text-xs text-gray-400">/ {goals.carb_goal} g</span>
            </div>
            <div className="w-full bg-amber-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${carbPct}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-rose-900 uppercase tracking-wider">Fat</span>
              <span className="font-mono text-rose-700">{fatPct}%</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-rose-800">{consumedFat}</span>
              <span className="text-xs text-gray-400">/ {goals.fat_goal} g</span>
            </div>
            <div className="w-full bg-rose-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${fatPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Link
          href="/chat"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-800">Ask BiteBuddy</span>
        </Link>

        <Link
          href="/menu"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Utensils className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-800">Browse Menu</span>
        </Link>

        <Link
          href="/student/preferences"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sliders className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-800">My Preferences</span>
        </Link>

        <Link
          href="/student/nutrition"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PieChart className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-800">Nutrition Goals</span>
        </Link>

        <Link
          href="/student/orders"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group col-span-2 sm:col-span-1"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-800">Order History</span>
        </Link>
      </div>

      {/* Featured AI Recommendation Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              ✨ Based on your preferences
            </span>
            <h3 className="text-xl font-black text-gray-900 tracking-tight mt-2">
              BEST MATCH: Paneer Kathi Roll + Lemon Soda
            </h3>
          </div>
          <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">
            94% Match
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative">
            <img
              src="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80"
              alt="Paneer Roll"
              className="w-full h-full object-cover"
            />
            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#0C3B25] text-white">
              Combo ₹105
            </span>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="font-extrabold text-[#0C3B25] text-lg">₹105</span>
              <span>•</span>
              <span>~8 min prep</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">● Both in Stock</span>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-700">
              <span className="flex items-center gap-1.5 font-medium">✓ Vegetarian verified</span>
              <span className="flex items-center gap-1.5 font-medium">✓ Spicy taste note</span>
              <span className="flex items-center gap-1.5 font-medium">✓ Within ₹120 budget</span>
              <span className="flex items-center gap-1.5 font-medium">✓ Ready under 10 min</span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-700 font-bold">
                ✓ 18g Protein match
              </span>
              <span className="flex items-center gap-1.5 font-medium">✓ 420 kcal total</span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleAddBestMatch}
                className="px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add to Order
              </button>
              <Link
                href="/recommendations"
                className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl transition-all"
              >
                View Full Recommendations →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

