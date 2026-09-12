"use client";

import React from "react";
import { MealCombinationData } from "@/types";
import { Sparkles, Plus, Clock, IndianRupee } from "lucide-react";

interface Props {
  combo: MealCombinationData;
}

export const ComboCard: React.FC<Props> = ({ combo }) => {
  const { main_item, side_item, total_price, max_prep_time, budget_remaining } = combo;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/80 p-4 my-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Recommended Meal Combination</span>
        </div>
        <div className="text-xs font-semibold px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded-full">
          Fits in Budget
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white/80 rounded-lg p-3 border border-amber-100">
        {/* Main Item */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{main_item.image_emoji || "🌯"}</span>
          <div>
            <div className="text-xs text-slate-500 font-medium">Main Meal</div>
            <div className="text-sm font-bold text-slate-900 leading-tight">{main_item.name}</div>
            <div className="text-xs text-slate-600 font-semibold">₹{Math.round(main_item.price)}</div>
          </div>
        </div>

        {/* Plus Divider */}
        <div className="p-1 rounded-full bg-amber-100 text-amber-700">
          <Plus className="w-3.5 h-3.5" />
        </div>

        {/* Side/Drink Item */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{side_item.image_emoji || "🥤"}</span>
          <div>
            <div className="text-xs text-slate-500 font-medium">{side_item.category}</div>
            <div className="text-sm font-bold text-slate-900 leading-tight">{side_item.name}</div>
            <div className="text-xs text-slate-600 font-semibold">₹{Math.round(side_item.price)}</div>
          </div>
        </div>
      </div>

      {/* Combo Details & Savings */}
      <div className="flex items-center justify-between mt-3 pt-2 text-xs text-slate-700 border-t border-amber-200/50">
        <div className="flex items-center gap-1 font-bold text-slate-900">
          <IndianRupee className="w-3.5 h-3.5 text-amber-700" />
          <span>Total: ₹{Math.round(total_price)}</span>
          {budget_remaining > 0 && (
            <span className="text-[11px] font-medium text-emerald-700 ml-1.5">
              (₹{Math.round(budget_remaining)} left over)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-600 font-medium">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Max prep: {max_prep_time} mins</span>
        </div>
      </div>
    </div>
  );
};

