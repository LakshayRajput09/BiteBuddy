"use client";

import React, { useState } from "react";
import { RecommendationCardData } from "@/types";
import { Clock, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Tag } from "lucide-react";

interface Props {
  data: RecommendationCardData;
}

export const RecommendationCard: React.FC<Props> = ({ data }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { item, match_percentage, reasons, score_breakdown } = data;

  return (
    <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-5 my-3">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl p-2 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-center">
            {item.image_emoji || "🍽️"}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 uppercase tracking-wide">
                Top Pick • {item.category}
              </span>
              <span className="text-xs text-slate-500 font-medium">{item.cuisine}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1 leading-tight">{item.name}</h3>
          </div>
        </div>

        {/* Match Percentage Badge */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200 text-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{match_percentage}% Match</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 font-medium">Weighted Score</span>
        </div>
      </div>

      {/* Price, Prep Time, Diet Badges */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100">
        <div className="text-2xl font-black text-slate-900">
          ₹{Math.round(item.price)}
          <span className="text-xs font-normal text-slate-500 ml-1">/ {item.serving_size}</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold bg-slate-100 px-2.5 py-1 rounded-md">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{item.preparation_time} mins prep</span>
        </div>

        {/* Dietary badges */}
        {item.vegan ? (
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md">
            🌿 100% Vegan
          </span>
        ) : item.jain ? (
          <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md">
            🕊️ Jain Friendly
          </span>
        ) : item.vegetarian ? (
          <span className="text-xs font-semibold bg-green-100 text-green-800 px-2.5 py-1 rounded-md">
            🌱 Pure Veg
          </span>
        ) : (
          <span className="text-xs font-semibold bg-red-100 text-red-800 px-2.5 py-1 rounded-md">
            🍗 Non-Veg
          </span>
        )}

        {item.spicy && (
          <span className="text-xs font-semibold bg-rose-100 text-rose-800 px-2 py-1 rounded-md">
            🌶️ Spicy
          </span>
        )}
        {item.sweet && (
          <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded-md">
            🍯 Sweet
          </span>
        )}
      </div>

      {/* Checklist of why it matched */}
      <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Why this meal matched your request:</span>
        </div>
        <ul className="space-y-1.5">
          {reasons.map((reason, idx) => (
            <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Ingredients */}
      <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
        <Tag className="w-3 h-3 text-slate-400 flex-shrink-0" />
        <span className="truncate">
          <strong className="font-semibold text-slate-600">Ingredients:</strong> {item.ingredients}
        </span>
      </div>

      {/* Expandable Score Breakdown Toggle */}
      <div className="mt-3 pt-2 border-t border-slate-100">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>{showBreakdown ? "Hide score formula breakdown" : "View formula score breakdown (30/25/20/15/10)"}</span>
          {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showBreakdown && score_breakdown && (
          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-orange-50/60 rounded-lg border border-orange-100 text-[11px]">
            <div>
              <span className="text-slate-500">Preference (30%):</span>{" "}
              <strong className="text-slate-800 font-bold">{Math.round((score_breakdown.preference_match || 0) * 100)}%</strong>
            </div>
            <div>
              <span className="text-slate-500">Budget Fit (25%):</span>{" "}
              <strong className="text-slate-800 font-bold">{Math.round((score_breakdown.budget_fit || 0) * 100)}%</strong>
            </div>
            <div>
              <span className="text-slate-500">Dietary (20%):</span>{" "}
              <strong className="text-slate-800 font-bold">{Math.round((score_breakdown.dietary_match || 0) * 100)}%</strong>
            </div>
            <div>
              <span className="text-slate-500">Time Fit (15%):</span>{" "}
              <strong className="text-slate-800 font-bold">{Math.round((score_breakdown.time_fit || 0) * 100)}%</strong>
            </div>
            <div>
              <span className="text-slate-500">Mood/Craving (10%):</span>{" "}
              <strong className="text-slate-800 font-bold">{Math.round((score_breakdown.mood_craving_match || 0) * 100)}%</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

