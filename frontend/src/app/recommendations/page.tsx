"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Sparkles,
  Heart,
  Clock,
  Check,
  CheckCircle2,
  Info,
  ArrowLeft,
  Share2
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useOrder } from "@/context/OrderContext";

interface RecItem {
  id: number;
  badge: string;
  badgeColor: string;
  name: string;
  image: string;
  price: number;
  time: string;
  matchScore: number;
  reasons: string[];
  calories?: number;
  protein?: number;
}

export default function RecommendationsPage() {
  const { showToast } = useToast();
  const { addToOrder } = useOrder();
  const [favorites, setFavorites] = useState<number[]>([]);

  const recommendations: RecItem[] = [
    {
      id: 1,
      badge: "Best Match",
      badgeColor: "bg-emerald-700 text-white",
      name: "Paneer Roll + Lemon Soda",
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
      price: 105,
      time: "~ 8 min",
      matchScore: 94,
      calories: 420,
      protein: 18,
      reasons: [
        "Vegetarian certified",
        "Spicy flavor profile",
        "Within ₹120 budget",
        "Ready within 8 mins",
        "18g Protein match"
      ]
    },
    {
      id: 2,
      badge: "Popular",
      badgeColor: "bg-amber-500 text-white",
      name: "Masala Maggi + Lemon Soda",
      image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80",
      price: 75,
      time: "~ 7 min",
      matchScore: 89,
      calories: 390,
      protein: 7,
      reasons: [
        "Late-night campus favorite",
        "Spicy masala taste",
        "Only ₹75 total",
        "Quick 7 min prep"
      ]
    },
    {
      id: 3,
      badge: "Quick Bite",
      badgeColor: "bg-blue-600 text-white",
      name: "Veg Sandwich + Cold Coffee",
      image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
      price: 95,
      time: "~ 6 min",
      matchScore: 86,
      calories: 450,
      protein: 14,
      reasons: [
        "Vegetarian certified",
        "Under ₹100 budget",
        "Fast 6 min prep",
        "Refreshing beverage combo"
      ]
    }
  ];

  const toggleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(f => f !== id));
      showToast("Removed from saved items");
    } else {
      setFavorites([...favorites, id]);
      showToast("Saved to your favorites!");
    }
  };

  const handleOrder = (rec: RecItem) => {
    addToOrder({
      item_id: rec.id,
      name: rec.name,
      category: "Combo",
      price: rec.price,
      ingredients: "Fresh ingredients",
      serving_size: "1 combo meal",
      vegetarian: true,
      vegan: false,
      jain: false,
      spicy: true,
      sweet: false,
      preparation_time: 8,
      available: true,
      cuisine: "Indian",
      tags: "combo",
      image_emoji: "🍱",
      calories: rec.calories || 400,
      protein: rec.protein || 15,
      carbohydrates: 50,
      fat: 14
    }, 1);
    showToast(`Added ${rec.name} to active order!`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Header & Refine Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/chat"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Chat</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Here are your recommendations!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Based on your preferences, these are the best matching options.
          </p>
        </div>

        <Link
          href="/preferences"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition-all"
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span>Refine Search</span>
        </Link>
      </div>

      {/* 3 Food Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map(item => {
          const isFav = favorites.includes(item.id);

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Image & Badges */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />

                {/* Badge Left */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                {/* Heart Favorite Button */}
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-sm transition-colors ${
                    isFav
                      ? "bg-rose-50 text-rose-600"
                      : "bg-white/90 text-slate-400 hover:text-rose-500"
                  }`}
                  aria-label="Save to favorites"
                >
                  <Heart className={`w-4 h-4 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {item.name}
                  </h3>

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                    <span className="text-xl font-black text-slate-900">
                      ₹{item.price}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.time}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                      {item.matchScore}% Match
                    </span>
                  </div>

                  {/* Checklist Reasons */}
                  <ul className="space-y-1.5 mt-4 pt-3 border-t border-slate-100">
                    {item.reasons.map((r, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Add to Order Button */}
                <button
                  onClick={() => handleOrder(item)}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all text-center"
                >
                  Add to Order
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prominent "Why this recommendation?" Explanation Panel */}
      <div className="bg-[#ECFDF5] border border-emerald-200 rounded-3xl p-6 sm:p-7 flex items-start gap-4 shadow-sm">
        <div className="p-2.5 rounded-2xl bg-emerald-700 text-white flex-shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm sm:text-base font-bold text-emerald-950">
            Why this recommendation?
          </h3>
          <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed max-w-4xl">
            You asked for a spicy, vegetarian meal within ₹120 and under 10 minutes. The <strong>Paneer Roll + Lemon Soda</strong> matches all of your key preferences, fits your budget with ₹15 remaining, and is guaranteed to keep you full through your next class.
          </p>
        </div>
      </div>
    </div>
  );
}

