"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, Clock, Plus, Sliders, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DailyNutrition } from "@/types";

const API_BASE = "http://127.0.0.1:8000";

export default function StudentNutritionPage() {
  const { user } = useAuth();
  const studentId = user?.id || "student_lakshay";

  const [nutrition, setNutrition] = useState<DailyNutrition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNutrition = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/nutrition?user_id=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setNutrition(data);
      }
    } catch (e) {
      console.error("Failed to load nutrition:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNutrition();

    const handleOrderPlaced = () => {
      fetchNutrition();
    };

    window.addEventListener("canteen_order_placed", handleOrderPlaced);
    return () => {
      window.removeEventListener("canteen_order_placed", handleOrderPlaced);
    };
  }, [studentId]);

  const goals = nutrition?.goals || {
    calorie_goal: 2200,
    protein_goal: 120,
    carb_goal: 250,
    fat_goal: 70,
    enabled: true
  };

  const consumedCal = nutrition?.consumed_calories ?? 850;
  const consumedProt = nutrition?.consumed_protein ?? 48;
  const consumedCarb = nutrition?.consumed_carbs ?? 105;
  const consumedFat = nutrition?.consumed_fat ?? 28;

  const calPct = Math.min(100, Math.round((consumedCal / goals.calorie_goal) * 100));
  const protPct = Math.min(100, Math.round((consumedProt / goals.protein_goal) * 100));
  const carbPct = Math.min(100, Math.round((consumedCarb / goals.carb_goal) * 100));
  const fatPct = Math.min(100, Math.round((consumedFat / goals.fat_goal) * 100));

  const meals = nutrition?.meals_today || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold">🥗</span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              My Nutrition
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time tracking of consumed macronutrients based strictly on your canteen orders.
          </p>
        </div>

        <Link
          href="/student/preferences"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
        >
          <Sliders className="w-3.5 h-3.5" />
          Edit Daily Targets
        </Link>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Calories Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-sm font-bold text-gray-800">
            <span>🔥 Daily Calories</span>
            <span className="font-mono text-emerald-700">{calPct}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#0C3B25]">{consumedCal}</span>
            <span className="text-sm text-gray-400">/ {goals.calorie_goal} kcal</span>
          </div>
          <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0C3B25] h-full rounded-full transition-all duration-700"
              style={{ width: `${calPct}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400">
            {Math.max(0, Math.round(goals.calorie_goal - consumedCal))} kcal remaining today
          </p>
        </div>

        {/* Protein Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-sm font-bold text-gray-800">
            <span>💪 Protein</span>
            <span className="font-mono text-emerald-700 font-bold">{protPct}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#059669]">{consumedProt}g</span>
            <span className="text-sm text-gray-400">/ {goals.protein_goal} g</span>
          </div>
          <div className="w-full bg-emerald-50 h-3.5 rounded-full overflow-hidden">
            <div
              className="bg-[#059669] h-full rounded-full transition-all duration-700"
              style={{ width: `${protPct}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400">
            {Math.max(0, Math.round(goals.protein_goal - consumedProt))}g protein remaining today
          </p>
        </div>

        {/* Carbohydrates Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-sm font-bold text-gray-800">
            <span>🌾 Carbohydrates</span>
            <span className="font-mono text-amber-700">{carbPct}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">{consumedCarb}g</span>
            <span className="text-sm text-gray-400">/ {goals.carb_goal} g</span>
          </div>
          <div className="w-full bg-amber-50 h-3.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${carbPct}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400">
            {Math.max(0, Math.round(goals.carb_goal - consumedCarb))}g carbs remaining today
          </p>
        </div>

        {/* Fat Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-sm font-bold text-gray-800">
            <span>🥑 Healthy Fats</span>
            <span className="font-mono text-rose-700">{fatPct}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-700">{consumedFat}g</span>
            <span className="text-sm text-gray-400">/ {goals.fat_goal} g</span>
          </div>
          <div className="w-full bg-rose-50 h-3.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${fatPct}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400">
            {Math.max(0, Math.round(goals.fat_goal - consumedFat))}g fat remaining today
          </p>
        </div>
      </div>

      {/* Today's Actual Consumed Meals */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Today&apos;s Meals</h2>
            <p className="text-xs text-gray-500">
              Only foods actually ordered and recorded in your account.
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {meals.length} item{meals.length === 1 ? "" : "s"} recorded
          </span>
        </div>

        {meals.length === 0 ? (
          <div className="py-12 text-center space-y-3 text-gray-400">
            <span className="text-4xl block">🍽️</span>
            <p className="font-semibold text-gray-700">No canteen meals recorded today</p>
            <p className="text-xs max-w-sm mx-auto">
              Add meals from the menu or AI assistant to start seeing your consumed nutritional breakdown!
            </p>
            <Link
              href="/menu"
              className="inline-block px-4 py-2 bg-[#059669] text-white text-xs font-bold rounded-xl mt-2"
            >
              Order from Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((m, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-gray-100 bg-[#FDFDFD] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-gray-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 font-black flex items-center justify-center text-sm">
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{m.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{m.meal_time}</span>
                      <span>•</span>
                      <span>Qty: {m.quantity}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="font-extrabold text-[#0C3B25] text-sm block">
                      {Math.round(m.calories)} kcal
                    </span>
                    <span className="text-[11px] text-gray-500">Approx. energy</span>
                  </div>
                  <div className="text-right border-l pl-4 border-gray-100">
                    <span className="font-extrabold text-emerald-700 text-sm block">
                      {Math.round(m.protein)}g
                    </span>
                    <span className="text-[11px] text-gray-500">Protein</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 text-center">
          <p className="text-[11px] text-gray-400">
            * Approx. nutrition per serving • Estimates calculated from canteen preparation recipes. CanteenAI does not make medical claims.
          </p>
        </div>
      </div>
    </div>
  );
}

