"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Save, Check, Sparkles, Utensils, Wallet, Clock, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { StudentProfile, StudentNutritionGoals } from "@/types";

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Jain", "Eggetarian", "No Dairy", "Gluten Free", "Nut Allergy", "No Preference"
];

const TASTE_OPTIONS = [
  "Spicy", "Sweet", "Salty", "Sour", "Crispy", "Light", "Filling", "Refreshing"
];

const CUISINE_OPTIONS = [
  "Indian", "North Indian", "South Indian", "Chinese", "Continental", "Fast Food", "No Preference"
];

const TIME_OPTIONS = [5, 10, 15, 20, 30];

const API_BASE = "http://127.0.0.1:8000";

export default function StudentPreferencesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const studentId = user?.id || "student_lakshay";

  const [dietary, setDietary] = useState<string[]>(["Vegetarian"]);
  const [taste, setTaste] = useState<string[]>(["Spicy"]);
  const [cuisine, setCuisine] = useState<string>("Indian");
  const [budget, setBudget] = useState<number>(120);
  const [timeLimit, setTimeLimit] = useState<number>(10);
  const [mood, setMood] = useState<string>("Comfort Food");

  const [hasGoals, setHasGoals] = useState<boolean>(true);
  const [calories, setCalories] = useState<number>(2200);
  const [protein, setProtein] = useState<number>(120);
  const [carbs, setCarbs] = useState<number>(250);
  const [fat, setFat] = useState<number>(70);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pRes, nRes] = await Promise.all([
          fetch(`${API_BASE}/student/preferences?user_id=${studentId}`),
          fetch(`${API_BASE}/student/nutrition?user_id=${studentId}`)
        ]);

        if (pRes.ok) {
          const pData: StudentProfile = await pRes.json();
          if (pData.dietary_preferences?.length) setDietary(pData.dietary_preferences);
          if (pData.taste_preferences?.length) setTaste(pData.taste_preferences);
          if (pData.cuisine_preference) setCuisine(pData.cuisine_preference);
          if (pData.budget) setBudget(pData.budget);
          if (pData.time_limit) setTimeLimit(pData.time_limit);
          if (pData.mood) setMood(pData.mood);
        }

        if (nRes.ok) {
          const nData = await nRes.json();
          if (nData.goals) {
            setHasGoals(nData.goals.enabled);
            setCalories(nData.goals.calorie_goal);
            setProtein(nData.goals.protein_goal);
            setCarbs(nData.goals.carb_goal);
            setFat(nData.goals.fat_goal);
          }
        }
      } catch (e) {
        console.error("Failed to load preferences:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [studentId]);

  const toggleItem = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (item === "No Preference") {
      setList(["No Preference"]);
      return;
    }
    const filtered = list.filter((i) => i !== "No Preference");
    if (filtered.includes(item)) {
      setList(filtered.filter((i) => i !== item));
    } else {
      setList([...filtered, item]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        fetch(`${API_BASE}/student/preferences?user_id=${studentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            budget,
            time_limit: timeLimit,
            mood,
            cuisine_preference: cuisine,
            dietary_preferences: dietary,
            taste_preferences: taste
          })
        }),
        fetch(`${API_BASE}/student/nutrition-goals?user_id=${studentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            calorie_goal: calories,
            protein_goal: protein,
            carb_goal: carbs,
            fat_goal: fat,
            enabled: hasGoals
          })
        })
      ]);

      showToast("Preferences & Nutrition goals updated successfully!");
    } catch (e) {
      showToast("Error updating preferences", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            My Dining Preferences
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Customize constraints, flavors, budget, and daily macronutrient targets.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
        {/* Dietary */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
            Dietary Requirements (Strict Hard Filtering)
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((item) => {
              const selected = dietary.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleItem(dietary, setDietary, item)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selected
                      ? "bg-[#0C3B25] text-white shadow-sm"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {selected && <Check className="w-3 h-3 text-emerald-400" />}
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Taste */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
            Preferred Flavors
          </label>
          <div className="flex flex-wrap gap-2">
            {TASTE_OPTIONS.map((item) => {
              const selected = taste.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleItem(taste, setTaste, item)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selected
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {selected && <Check className="w-3 h-3 text-emerald-300" />}
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700 uppercase">Default Budget</span>
              <span className="text-lg font-black text-[#0C3B25]">₹{budget}</span>
            </div>
            <input
              type="range"
              min={30}
              max={500}
              step={5}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700 uppercase">Max Prep Time</span>
              <span className="text-sm font-bold text-emerald-800">{timeLimit} mins</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeLimit(t)}
                  className={`py-2 rounded-xl text-xs font-bold text-center transition-all ${
                    timeLimit === t
                      ? "bg-[#0C3B25] text-white shadow-sm"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {t}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Nutrition Targets */}
        <div className="p-6 rounded-2xl bg-[#F8FAF7] border border-emerald-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Daily Nutrition Targets
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasGoals}
                onChange={(e) => setHasGoals(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span className="text-xs text-gray-700 font-semibold">Enable Tracking</span>
            </label>
          </div>

          {hasGoals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">Calories</span>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full font-bold text-base text-gray-800 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">kcal/day</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-emerald-700 font-semibold uppercase block">Protein</span>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full font-bold text-base text-emerald-700 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">g/day</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-amber-700 font-semibold uppercase block">Carbs</span>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(Number(e.target.value))}
                  className="w-full font-bold text-base text-amber-700 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">g/day</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-rose-700 font-semibold uppercase block">Fat</span>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full font-bold text-base text-rose-700 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">g/day</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

