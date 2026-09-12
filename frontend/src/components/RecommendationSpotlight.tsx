"use client";

import React from "react";
import { RecommendationCardData, MealCombinationData } from "@/types";
import { Sparkles, Clock, CheckCircle2, IndianRupee, Plus, Utensils, ArrowRight } from "lucide-react";

interface Props {
  recommendation?: RecommendationCardData | null;
  combo?: MealCombinationData | null;
  onAskAboutItem?: (itemName: string) => void;
}

export const RecommendationSpotlight: React.FC<Props> = ({
  recommendation,
  combo,
  onAskAboutItem
}) => {
  if (!recommendation) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-3xl mb-3 shadow-inner">
          🍱
        </div>
        <h3 className="font-bold text-slate-800 text-base">Recommendation Spotlight</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
          Ask the assistant or select your preferences on the left to see your top personalized canteen pick and combo right here!
        </p>
      </div>
    );
  }

  const { item, match_percentage, reasons } = recommendation;

  return (
    <div className="bg-white rounded-2xl border-2 border-orange-300 shadow-md p-5 flex flex-col gap-4 sticky top-20">
      {/* Badge Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-600 text-white text-xs font-extrabold rounded-full tracking-wide uppercase shadow-sm">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Top Pick Spotlight</span>
        </div>

        <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-xs font-bold">
          <span>{match_percentage}% Fit</span>
        </div>
      </div>

      {/* Main Meal Item Details */}
      <div className="flex items-start gap-3.5 pt-1">
        <div className="text-4xl p-3 bg-orange-50 border border-orange-200 rounded-2xl flex-shrink-0 flex items-center justify-center">
          {item.image_emoji || "🍽️"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
              {item.category}
            </span>
            <span className="text-xs text-slate-500 font-medium">{item.cuisine}</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 leading-tight mt-1">{item.name}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xl font-black text-slate-900">₹{Math.round(item.price)}</span>
            <span className="flex items-center gap-1 text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
              <Clock className="w-3 h-3 text-slate-400" />
              {item.preparation_time} mins
            </span>
          </div>
        </div>
      </div>

      {/* Dietary Badges */}
      <div className="flex flex-wrap gap-1.5">
        {item.vegan && (
          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md">
            🌿 Vegan
          </span>
        )}
        {item.jain && (
          <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-md">
            🕊️ Jain Friendly
          </span>
        )}
        {item.vegetarian && !item.vegan && !item.jain && (
          <span className="text-xs font-bold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-md">
            🌱 Pure Veg
          </span>
        )}
        {!item.vegetarian && (
          <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-md">
            🍗 Non-Veg
          </span>
        )}
        {item.spicy && (
          <span className="text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md">
            🌶️ Spicy
          </span>
        )}
      </div>

      {/* Why It Matched Checklist */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Match Justification:</span>
        </div>
        <ul className="space-y-1">
          {reasons.slice(0, 3).map((r, i) => (
            <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <span className="line-clamp-1">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pinned Combo Pairing */}
      {combo && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-3">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1.5">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Suggested Combo Pairing</span>
            </span>
            <span className="font-extrabold text-slate-900">Total: ₹{Math.round(combo.total_price)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700 bg-white/90 p-2 rounded-lg border border-amber-100">
            <span className="text-xl">{combo.side_item.image_emoji || "🥤"}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate text-slate-900">{combo.side_item.name}</div>
              <div className="text-[10px] text-slate-500">
                {combo.side_item.category} • ₹{Math.round(combo.side_item.price)}
              </div>
            </div>
            {combo.budget_remaining > 0 && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                ₹{Math.round(combo.budget_remaining)} left
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Action */}
      {onAskAboutItem && (
        <button
          onClick={() => onAskAboutItem(item.name)}
          className="w-full py-2 px-3 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Ask Assistant about this item</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

