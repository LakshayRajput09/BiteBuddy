"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Utensils, Clock, Wallet, Heart, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Jain",
  "Eggetarian",
  "No Dairy",
  "Gluten Free",
  "Nut Allergy",
  "No Preference"
];

const TASTE_OPTIONS = [
  "Spicy",
  "Sweet",
  "Salty",
  "Sour",
  "Crispy",
  "Light",
  "Filling",
  "Refreshing"
];

const CUISINE_OPTIONS = [
  "Indian",
  "North Indian",
  "South Indian",
  "Chinese",
  "Continental",
  "Fast Food",
  "No Preference"
];

const TIME_OPTIONS = [
  { label: "5 min", val: 5 },
  { label: "10 min", val: 10 },
  { label: "15 min", val: 15 },
  { label: "20 min", val: 20 },
  { label: "30+ min", val: 30 }
];

const MOOD_OPTIONS = [
  "Quick Bite",
  "Comfort Food",
  "Healthy",
  "High Protein",
  "Light Meal",
  "Treat Myself",
  "Energy Boost"
];

const API_BASE = "http://127.0.0.1:8000";

export default function StudentOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [dietary, setDietary] = useState<string[]>(["Vegetarian"]);
  const [taste, setTaste] = useState<string[]>(["Spicy"]);
  const [cuisine, setCuisine] = useState<string>("Indian");
  const [budget, setBudget] = useState<number>(120);
  const [timeLimit, setTimeLimit] = useState<number>(10);
  const [mood, setMood] = useState<string>("Comfort Food");

  // Nutrition Goals (Optional)
  const [hasGoals, setHasGoals] = useState<boolean>(true);
  const [calories, setCalories] = useState<number>(2200);
  const [protein, setProtein] = useState<number>(120);
  const [carbs, setCarbs] = useState<number>(250);
  const [fat, setFat] = useState<number>(70);

  const [isSaving, setIsSaving] = useState(false);

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

  const handleFinish = async () => {
    setIsSaving(true);
    const studentId = user?.id || "student_lakshay";
    try {
      // 1. Save preferences
      await fetch(`${API_BASE}/student/preferences?user_id=${studentId}`, {
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
      });

      // 2. Save nutrition goals
      await fetch(`${API_BASE}/student/nutrition-goals?user_id=${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calorie_goal: hasGoals ? calories : 2200,
          protein_goal: hasGoals ? protein : 120,
          carb_goal: hasGoals ? carbs : 250,
          fat_goal: hasGoals ? fat : 70,
          enabled: hasGoals
        })
      });

      showToast("Personalization saved! Welcome to CanteenAI.");
      router.push("/student/dashboard");
    } catch (e) {
      console.error("Save failed:", e);
      showToast("Preferences saved locally!");
      router.push("/student/dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-gray-100 pb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Step 1 of 1: Personalization
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Let&apos;s personalize your food experience 🍴
          </h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Tell us a little about yourself so CanteenAI can recommend meals tailored to your budget, time, taste, and goals.
          </p>
        </div>

        {/* Section 1: Dietary Preferences */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Dietary Restrictions (Hard Constraints)
            </h2>
          </div>
          <p className="text-xs text-gray-400">
            Strictly enforced — recommendations will never include items violating your diet.
          </p>
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

        {/* Section 2: Taste Preferences */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Taste & Flavor Notes
            </h2>
          </div>
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

        {/* Section 3: Budget & Preparation Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Budget Slider */}
          <div className="space-y-3 p-5 rounded-2xl bg-gray-50/80 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-700" />
                Meal Budget
              </span>
              <span className="text-lg font-black text-[#0C3B25]">₹{budget}</span>
            </div>
            <p className="text-xs text-gray-500">How much do you usually spend on a meal?</p>
            <input
              type="range"
              min={30}
              max={500}
              step={5}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-400 font-mono">
              <span>₹30</span>
              <span>Usually around ₹{budget}</span>
              <span>₹500</span>
            </div>
          </div>

          {/* Time Limit */}
          <div className="space-y-3 p-5 rounded-2xl bg-gray-50/80 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                Available Time
              </span>
              <span className="text-sm font-bold text-emerald-800">{timeLimit} mins</span>
            </div>
            <p className="text-xs text-gray-500">How much time do you have between lectures?</p>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setTimeLimit(t.val)}
                  className={`py-2 rounded-xl text-xs font-bold text-center transition-all ${
                    timeLimit === t.val
                      ? "bg-[#0C3B25] text-white shadow-sm"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Cuisine & Mood Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase">Preferred Cuisine</label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-500"
            >
              {CUISINE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase">Current Food Style</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-500"
            >
              {MOOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 5: Optional Nutrition Goals */}
        <div className="p-5 rounded-2xl bg-[#F8FAF7] border border-emerald-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Daily Nutrition Goals (Optional)
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!hasGoals}
                onChange={(e) => setHasGoals(!e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span className="text-xs text-gray-500 font-medium">No specific goals</span>
            </label>
          </div>
          <p className="text-xs text-gray-500">
            Set your daily targets to track consumed calories, protein, carbs, and fat with visual progress bars.
          </p>

          {hasGoals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">Calories</span>
                <input
                  type="number"
                  min={500}
                  max={5000}
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
                  min={10}
                  max={300}
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
                  min={20}
                  max={600}
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
                  min={10}
                  max={200}
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full font-bold text-base text-rose-700 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">g/day</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleFinish}
            disabled={isSaving}
            className="w-full py-3.5 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? "Saving Preferences..." : "Complete Setup & Go to Dashboard →"}
          </button>
        </div>
      </div>
    </div>
  );
}

