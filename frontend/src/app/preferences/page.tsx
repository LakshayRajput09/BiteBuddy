"use client";

import React, { useState } from "react";
import {
  SlidersHorizontal,
  History,
  Bookmark,
  ShieldCheck,
  User,
  Check,
  IndianRupee,
  Clock,
  Sparkles
} from "lucide-react";
import { useToast } from "@/components/Toast";

const DIETARY_LIST = [
  "Vegetarian",
  "Vegan",
  "Jain",
  "No Egg",
  "No Dairy",
  "Gluten Free",
  "Nut Allergy"
];

const TASTE_LIST = [
  "Spicy",
  "Sweet",
  "Salty",
  "Crispy",
  "Light",
  "Filling",
  "Refreshing"
];

const CUISINE_LIST = [
  "Any",
  "Indian",
  "Chinese",
  "South Indian",
  "Fast Food"
];

export default function PreferencesPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("Preferences");
  const [selectedDiets, setSelectedDiets] = useState<string[]>(["Vegetarian"]);
  const [selectedTastes, setSelectedTastes] = useState<string[]>(["Spicy", "Crispy"]);
  const [budget, setBudget] = useState<number>(150);
  const [timeLimit, setTimeLimit] = useState<string>("10 minutes");
  const [cuisine, setCuisine] = useState<string>("Any");

  const toggleDiet = (diet: string) => {
    setSelectedDiets(prev =>
      prev.includes(diet) ? prev.filter(d => d !== diet) : [...prev, diet]
    );
  };

  const toggleTaste = (taste: string) => {
    setSelectedTastes(prev =>
      prev.includes(taste) ? prev.filter(t => t !== taste) : [...prev, taste]
    );
  };

  const handleSave = () => {
    showToast("Preferences saved! Your future recommendations are now updated.");
  };

  const navItems = [
    { label: "Preferences", icon: <SlidersHorizontal className="w-4 h-4" /> },
    { label: "Order History", icon: <History className="w-4 h-4" /> },
    { label: "Saved Items", icon: <Bookmark className="w-4 h-4" /> },
    { label: "Dietary Info", icon: <ShieldCheck className="w-4 h-4" /> },
    { label: "Account Settings", icon: <User className="w-4 h-4" /> }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Your Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Set your preferences for better recommendations.
        </p>
      </div>

      {/* Main Settings Layout: Sidebar + Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar */}
        <div className="md:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 space-y-1.5">
          {navItems.map(item => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all text-left ${
                activeTab === item.label
                  ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className={activeTab === item.label ? "text-emerald-700" : "text-slate-400"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
          {activeTab === "Preferences" ? (
            <>
              {/* 1. Dietary Preferences */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Dietary Preferences
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_LIST.map(diet => {
                    const active = selectedDiets.includes(diet);
                    return (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => toggleDiet(diet)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          active
                            ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                        <span>{diet}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Taste Preferences */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Taste Preferences
                </label>
                <div className="flex flex-wrap gap-2">
                  {TASTE_LIST.map(taste => {
                    const active = selectedTastes.includes(taste);
                    return (
                      <button
                        key={taste}
                        type="button"
                        onClick={() => toggleTaste(taste)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          active
                            ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                        <span>{taste}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Budget Range Slider */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Budget Range
                  </label>
                  <span className="px-3 py-1 bg-emerald-700 text-white rounded-full text-xs font-extrabold shadow-sm">
                    ₹{budget}
                  </span>
                </div>

                <input
                  type="range"
                  min="20"
                  max="500"
                  step="5"
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />

                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>₹20</span>
                  <span>₹250</span>
                  <span>₹500</span>
                </div>
              </div>

              {/* 4. Default Time Limit Dropdown */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Default Time Limit
                </label>
                <select
                  value={timeLimit}
                  onChange={e => setTimeLimit(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                >
                  <option value="5 minutes">5 minutes (Quick Grab & Go)</option>
                  <option value="10 minutes">10 minutes (Standard Lecture Break)</option>
                  <option value="15 minutes">15 minutes (Relaxed Lunch)</option>
                  <option value="20 minutes">20+ minutes (Full Meal)</option>
                </select>
              </div>

              {/* 5. Preferred Cuisine */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Preferred Cuisine
                </label>
                <select
                  value={cuisine}
                  onChange={e => setCuisine(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                >
                  {CUISINE_LIST.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Preferences Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all text-center"
                >
                  Save Preferences
                </button>
              </div>
            </>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center font-bold">
                ✓
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{activeTab}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your past canteen visits, saved favorite combos, and dietary certifications will be stored here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

