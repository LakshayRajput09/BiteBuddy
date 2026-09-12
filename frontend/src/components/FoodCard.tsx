"use client";

import React from "react";
import Link from "next/link";
import { Clock, Plus } from "lucide-react";
import { getFoodImage } from "@/data/foodData";
import { useOrder } from "@/context/OrderContext";
import { useToast } from "./Toast";
import { FoodItem } from "@/types";

interface Props {
  item: any; // supports FoodItem or FoodDisplayItem
  onSelect?: (item: any) => void;
}

export const FoodCard: React.FC<Props> = ({ item }) => {
  const { addToOrder } = useOrder();
  const { showToast } = useToast();

  const itemId = item.item_id || item.id;
  const name = item.name;
  const price = item.price;
  const prepTime = item.preparation_time || item.prepTime || 8;
  const available = item.available ?? true;
  const isVeg = item.vegetarian ?? item.isVegetarian ?? true;
  const isVegan = item.vegan ?? item.isVegan ?? false;
  const isJain = item.jain ?? item.isJain ?? false;
  const isSpicy = item.spicy ?? item.isSpicy ?? false;

  const calories = Math.round(
    typeof item.calories === "number"
      ? item.calories
      : parseFloat(item.nutrition?.calories || "300")
  );
  const protein = Math.round(
    typeof item.protein === "number"
      ? item.protein
      : parseFloat(item.nutrition?.protein || "10")
  );
  const carbs = Math.round(
    typeof item.carbohydrates === "number"
      ? item.carbohydrates
      : parseFloat(item.nutrition?.carbs || "35")
  );
  const fat = Math.round(
    typeof item.fat === "number"
      ? item.fat
      : parseFloat(item.nutrition?.fat || "10")
  );

  const imageUrl = item.image_url || item.image || getFoodImage(name);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!available) return;

    const normalizedFood: FoodItem = {
      item_id: itemId,
      name,
      category: item.category || "Food",
      price,
      ingredients: typeof item.ingredients === "string" ? item.ingredients : (item.ingredients?.join(", ") || ""),
      serving_size: item.serving_size || "1 serving",
      vegetarian: isVeg,
      vegan: isVegan,
      jain: isJain,
      spicy: isSpicy,
      sweet: item.sweet ?? false,
      preparation_time: prepTime,
      available,
      cuisine: item.cuisine || "Indian",
      tags: item.tags || "",
      image_emoji: item.image_emoji || "🍽️",
      calories,
      protein,
      carbohydrates: carbs,
      fat
    };

    addToOrder(normalizedFood, 1);
    showToast(`Added ${name} to your order!`);
  };

  return (
    <div
      className={`group liquid-glass-card transition-all overflow-hidden flex flex-col ${
        available
          ? "border-white/80 hover:border-emerald-400/50"
          : "border-slate-200/60 opacity-60"
      }`}
    >
      <Link href={`/menu/${itemId}`} className="block relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Dietary Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          {isVegan ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/90 backdrop-blur-md text-white shadow-xs border border-white/30">
              Vegan
            </span>
          ) : isJain ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600/90 backdrop-blur-md text-white shadow-xs border border-white/30">
              Jain
            </span>
          ) : isVeg ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700/90 backdrop-blur-md text-white shadow-xs border border-white/30">
              Veg
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-700/90 backdrop-blur-md text-white shadow-xs border border-white/30">
              Non-Veg
            </span>
          )}

          {isSpicy && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-600/90 backdrop-blur-md text-white shadow-xs border border-white/30">
              🌶️ Spicy
            </span>
          )}
        </div>

        {/* Availability Badge */}
        <div className="absolute top-2.5 right-2.5">
          {available ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold liquid-glass-pill text-emerald-800 border-emerald-200/80 shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Available
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold liquid-glass-pill text-rose-700 border-rose-200/80 shadow-xs">
              Unavailable
            </span>
          )}
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3 relative z-20">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link href={`/menu/${itemId}`}>
              <h3 className="font-bold text-gray-900 text-base group-hover:text-emerald-800 transition-colors line-clamp-1">
                {name}
              </h3>
            </Link>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="font-black text-emerald-900 text-sm">₹{price}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {prepTime} min
            </span>
          </div>
        </div>

        {/* Nutrition Summary (Approx per serving) */}
        <div className="bg-white/50 backdrop-blur-md border border-white/70 rounded-xl p-2 text-center shadow-2xs">
          <div className="grid grid-cols-4 gap-1 text-[11px]">
            <div>
              <span className="text-gray-400 block text-[9px] uppercase font-semibold">Cal</span>
              <span className="font-bold text-gray-800">{calories}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[9px] uppercase font-semibold">Prot</span>
              <span className="font-bold text-emerald-700">{protein}g</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[9px] uppercase font-semibold">Carb</span>
              <span className="font-bold text-amber-700">{carbs}g</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[9px] uppercase font-semibold">Fat</span>
              <span className="font-bold text-rose-700">{fat}g</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Link
            href={`/menu/${itemId}`}
            className="flex-1 text-center py-2 text-xs font-semibold text-slate-700 hover:text-emerald-800 liquid-glass-pill hover:bg-white transition-all"
          >
            Details
          </Link>
          <button
            onClick={handleQuickAdd}
            disabled={!available}
            className="flex items-center justify-center gap-1 px-3.5 py-2 liquid-glass-button text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:pointer-events-none"
            title="Add to active order"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
export default FoodCard;
