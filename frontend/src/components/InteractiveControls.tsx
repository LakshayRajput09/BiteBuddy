"use client";

import React from "react";
import {
  SlidersHorizontal,
  IndianRupee,
  Clock,
  Sparkles,
  RotateCcw,
  Zap,
  Flame,
  Check,
  Ban
} from "lucide-react";

export interface FilterState {
  budget: number | null;
  diet: string;
  timeLimit: number | null;
  mood: string;
  tastes: string[];
  cravings: string[];
  exclusions: string[];
}

interface Props {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onApplyToChat: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

const BUDGET_PRESETS = [
  { label: "₹30 Snack", value: 30 },
  { label: "₹60 Standard", value: 60 },
  { label: "₹100 Full Meal", value: 100 },
  { label: "₹150 Feast", value: 150 },
  { label: "No Limit", value: null }
];

const DIET_OPTIONS = [
  { label: "All Foods", value: "any", icon: "🍽️" },
  { label: "Pure Veg", value: "vegetarian", icon: "🌱" },
  { label: "100% Vegan", value: "vegan", icon: "🌿" },
  { label: "Strict Jain", value: "jain", icon: "🕊️" },
  { label: "Non-Veg", value: "non-vegetarian", icon: "🍗" }
];

const TIME_OPTIONS = [
  { label: "Any Time", value: null, icon: "⏳" },
  { label: "5m Grab & Go", value: 5, icon: "⚡" },
  { label: "10m Break", value: 10, icon: "⏱️" },
  { label: "15m Relaxed", value: 15, icon: "☕" }
];

const MOOD_OPTIONS = [
  { label: "Tired & Drained", value: "tired", emoji: "😴", desc: "Comforting, warm & filling" },
  { label: "Exam Stress", value: "stressed", emoji: "📚", desc: "Soothing & brain-friendly" },
  { label: "In a Rush", value: "rushed", emoji: "🏃", desc: "Ultra-fast grab-and-go" },
  { label: "Starving", value: "hungry", emoji: "🤤", desc: "Hearty, high-protein portions" },
  { label: "Celebration", value: "celebrating", emoji: "🎉", desc: "Indulgent treats & sweets" }
];

const TASTE_OPTIONS = [
  { label: "Spicy", value: "spicy", icon: "🌶️" },
  { label: "Sweet", value: "sweet", icon: "🍯" },
  { label: "Tangy", value: "tangy", icon: "🍋" },
  { label: "Crispy", value: "crispy", icon: "🍟" },
  { label: "Cheesy", value: "cheesy", icon: "🧀" },
  { label: "Mild / Non-Spicy", value: "mild", icon: "🥗" }
];

const EXCLUSION_OPTIONS = [
  { label: "No Noodles", value: "noodles" },
  { label: "No Dairy", value: "dairy" },
  { label: "No Onion/Garlic", value: "onion" },
  { label: "No Rice", value: "rice" }
];

export const InteractiveControls: React.FC<Props> = ({
  filters,
  onChange,
  onApplyToChat,
  onReset,
  isLoading
}) => {
  const toggleTaste = (taste: string) => {
    const exists = filters.tastes.includes(taste);
    const updated = exists
      ? filters.tastes.filter(t => t !== taste)
      : [...filters.tastes, taste];
    onChange({ ...filters, tastes: updated });
  };

  const toggleExclusion = (excl: string) => {
    const exists = filters.exclusions.includes(excl);
    const updated = exists
      ? filters.exclusions.filter(e => e !== excl)
      : [...filters.exclusions, excl];
    onChange({ ...filters, exclusions: updated });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col gap-5 text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900">Custom Meal Filters</h2>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
          title="Reset to default filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* 1. Budget Slider & Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-orange-600" />
            <span>Maximum Budget</span>
          </label>
          <span className="text-sm font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
            {filters.budget !== null ? `₹${filters.budget}` : "No Limit"}
          </span>
        </div>

        <input
          type="range"
          min="15"
          max="200"
          step="5"
          value={filters.budget !== null ? filters.budget : 200}
          onChange={e => onChange({ ...filters, budget: Number(e.target.value) })}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
        />

        {/* Quick Budget Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {BUDGET_PRESETS.map(preset => {
            const active = filters.budget === preset.value;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange({ ...filters, budget: preset.value })}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                  active
                    ? "bg-orange-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Dietary Requirement Segmented Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Dietary Requirement
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {DIET_OPTIONS.map(opt => {
            const active = filters.diet === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...filters, diet: opt.value })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                  active
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{opt.icon}</span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Break Time Limit */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Break Time Available</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {TIME_OPTIONS.map(opt => {
            const active = filters.timeLimit === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => onChange({ ...filters, timeLimit: opt.value })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  active
                    ? "bg-blue-50 border-blue-300 text-blue-900 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{opt.icon}</span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Mood & Vibe Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Current Mood / Vibe</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {MOOD_OPTIONS.map(opt => {
            const active = filters.mood === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...filters, mood: active ? "" : opt.value })}
                className={`p-2 rounded-xl text-left border transition-all flex items-start gap-2 ${
                  active
                    ? "bg-amber-50/80 border-amber-300 shadow-sm text-amber-950"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700"
                }`}
              >
                <span className="text-lg">{opt.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Taste & Cravings Chips */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span>Taste Preferences</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TASTE_OPTIONS.map(opt => {
            const active = filters.tastes.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleTaste(opt.value)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  active
                    ? "bg-rose-50 border-rose-300 text-rose-800 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
                {active && <Check className="w-3 h-3 text-rose-600 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Ingredient Exclusions */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
          <Ban className="w-3.5 h-3.5 text-slate-400" />
          <span>Exclusions (Strictly Avoid)</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EXCLUSION_OPTIONS.map(opt => {
            const active = filters.exclusions.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleExclusion(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  active
                    ? "bg-rose-100 border-rose-300 text-rose-900 font-bold line-through"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Apply Button */}
      <button
        type="button"
        onClick={onApplyToChat}
        disabled={isLoading}
        className="w-full mt-2 py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
        <span>{isLoading ? "Calculating Matches..." : "Find Matching Meals Now"}</span>
      </button>
    </div>
  );
};

