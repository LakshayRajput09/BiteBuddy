"use client";

import React from "react";
import { RecommendationCardData } from "@/types";
import { Clock, ArrowRight, Sparkles } from "lucide-react";

interface Props {
  alternatives: RecommendationCardData[];
  onSelectAlternative?: (itemName: string) => void;
}

export const AlternativesList: React.FC<Props> = ({ alternatives, onSelectAlternative }) => {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>Top 2-3 Alternatives ({alternatives.length} ranked options)</span>
        </h4>
        <span className="text-[11px] text-slate-400">Strictly adheres to budget & diet</span>
      </div>

      <div className="space-y-2">
        {alternatives.map((alt, idx) => {
          const { item, match_percentage } = alt;
          return (
            <div
              key={item.item_id || idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-200 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl p-1.5 bg-white rounded-lg border border-slate-200">
                  {item.image_emoji || "🍽️"}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{item.name}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {item.category}
                    </span>
                    {item.vegan && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Vegan
                      </span>
                    )}
                    {item.jain && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        Jain
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="font-bold text-slate-800">₹{Math.round(item.price)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.preparation_time}m
                    </span>
                    <span className="text-emerald-700 font-medium">
                      {match_percentage}% match
                    </span>
                  </div>
                </div>
              </div>

              {onSelectAlternative && (
                <button
                  onClick={() => onSelectAlternative(item.name)}
                  className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 group-hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors ml-2 flex-shrink-0"
                >
                  <span>Choose this</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

