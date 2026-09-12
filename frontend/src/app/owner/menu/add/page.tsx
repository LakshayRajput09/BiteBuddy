"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Sparkles, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

const CATEGORIES = ["Roll", "Rice", "Snacks", "Noodles", "Chinese", "Beverages", "Sweets"];

const TASTE_OPTIONS = ["Spicy", "Sweet", "Salty", "Sour", "Crispy", "Light", "Filling"];

const API_BASE = "http://127.0.0.1:8000";

export default function AddFoodPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Roll");
  const [price, setPrice] = useState<number>(60);
  const [servingSize, setServingSize] = useState("1 portion");
  const [prepTime, setPrepTime] = useState<number>(8);
  const [ingredients, setIngredients] = useState("");
  const [cuisine, setCuisine] = useState("Indian");
  const [imageUrl, setImageUrl] = useState("");
  const [imageEmoji, setImageEmoji] = useState("🍽️");
  const [available, setAvailable] = useState(true);

  // Dietary checkboxes
  const [vegetarian, setVegetarian] = useState(true);
  const [vegan, setVegan] = useState(false);
  const [jain, setJain] = useState(false);
  const [containsEgg, setContainsEgg] = useState(false);
  const [containsDairy, setContainsDairy] = useState(true);
  const [containsGluten, setContainsGluten] = useState(true);
  const [containsNuts, setContainsNuts] = useState(false);

  // Tastes
  const [selectedTastes, setSelectedTastes] = useState<string[]>(["Spicy"]);

  // Nutrition Fields
  const [calories, setCalories] = useState<number>(320);
  const [protein, setProtein] = useState<number>(12);
  const [carbs, setCarbs] = useState<number>(40);
  const [fat, setFat] = useState<number>(14);
  const [fiber, setFiber] = useState<number>(4);
  const [sugar, setSugar] = useState<number>(3);
  const [sodium, setSodium] = useState<number>(520);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTaste = (t: string) => {
    if (selectedTastes.includes(t)) {
      setSelectedTastes(selectedTastes.filter((x) => x !== t));
    } else {
      setSelectedTastes([...selectedTastes, t]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (!name.trim()) {
      showToast("Please enter a food name", "error");
      return;
    }
    if (price < 0 || calories < 0 || protein < 0 || carbs < 0 || fat < 0) {
      showToast("Price and nutritional values cannot be negative", "error");
      return;
    }
    if (prepTime <= 0) {
      showToast("Preparation time must be greater than 0 minutes", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        price,
        ingredients: ingredients.trim() || name,
        serving_size: servingSize,
        vegetarian,
        vegan,
        jain,
        contains_egg: containsEgg,
        contains_dairy: containsDairy,
        contains_gluten: containsGluten,
        contains_nuts: containsNuts,
        spicy: selectedTastes.includes("Spicy"),
        sweet: selectedTastes.includes("Sweet"),
        preparation_time: prepTime,
        available,
        cuisine,
        tags: selectedTastes.join(","),
        image_emoji: imageEmoji || "🍽️",
        image_url: imageUrl.trim(),
        calories,
        protein,
        carbohydrates: carbs,
        fat,
        fiber,
        sugar,
        sodium
      };

      const res = await fetch(`${API_BASE}/owner/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Successfully added ${name} to canteen catalog!`);
        router.push("/owner/menu");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Failed to add food item", "error");
      }
    } catch (e) {
      showToast("Network error creating item", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <Link
        href="/owner/menu"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Menu Management
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
        <div className="border-b border-gray-100 pb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Add a New Food Item
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Publish meal details, real-time availability, and approximate nutritional values.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Basic Item Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Food Item Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Paneer Kathi Roll"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Price (₹) *</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Prep Time (minutes) *</label>
                <input
                  type="number"
                  min={1}
                  value={prepTime}
                  onChange={(e) => setPrepTime(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Serving Size</label>
                <input
                  type="text"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  placeholder="e.g. 1 roll (220g)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Cuisine</label>
                <input
                  type="text"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="e.g. North Indian"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Ingredients (comma-separated)</label>
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                rows={2}
                placeholder="paneer, onion, capsicum, wheat roti, mint chutney, spices"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Short Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A delicious roll filled with grilled paneer cubes, vegetables, and mint chutney."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Dietary & Allergen Information */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Dietary & Allergen Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={vegetarian}
                  onChange={(e) => setVegetarian(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="text-xs font-semibold text-gray-800">Vegetarian</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={vegan}
                  onChange={(e) => setVegan(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="text-xs font-semibold text-gray-800">100% Vegan</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={jain}
                  onChange={(e) => setJain(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="text-xs font-semibold text-gray-800">Jain Friendly</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={containsEgg}
                  onChange={(e) => setContainsEgg(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="text-xs font-semibold text-gray-800">Contains Egg</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={containsDairy}
                  onChange={(e) => setContainsDairy(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="text-xs font-semibold text-gray-800">Contains Dairy</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={containsGluten}
                  onChange={(e) => setContainsGluten(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="text-xs font-semibold text-gray-800">Contains Gluten</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={containsNuts}
                  onChange={(e) => setContainsNuts(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="text-xs font-semibold text-gray-800">Contains Nuts</span>
              </label>
            </div>
          </div>

          {/* Taste Characteristics */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Flavor Notes
            </h3>
            <div className="flex flex-wrap gap-2">
              {TASTE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTaste(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedTastes.includes(t)
                      ? "bg-[#0C3B25] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Nutrition Per Serving Section */}
          <div className="p-6 rounded-2xl bg-[#F8FAF7] border border-emerald-100 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Nutrition Information Per Serving
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Enter approximate nutritional values per serving. Used by the student recommendation engine.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Calories (kcal)</span>
                <input
                  type="number"
                  min={0}
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full font-bold text-base text-gray-800 focus:outline-none"
                  required
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Protein (g)</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full font-bold text-base text-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-amber-800 font-bold uppercase block">Carbs (g)</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={carbs}
                  onChange={(e) => setCarbs(Number(e.target.value))}
                  className="w-full font-bold text-base text-amber-700 focus:outline-none"
                  required
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-rose-800 font-bold uppercase block">Fat (g)</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full font-bold text-base text-rose-700 focus:outline-none"
                  required
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 font-semibold block">Fiber (g)</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={fiber}
                  onChange={(e) => setFiber(Number(e.target.value))}
                  className="w-full text-sm font-semibold text-gray-700 focus:outline-none"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 font-semibold block">Sugar (g)</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={sugar}
                  onChange={(e) => setSugar(Number(e.target.value))}
                  className="w-full text-sm font-semibold text-gray-700 focus:outline-none"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200 col-span-2">
                <span className="text-[10px] text-gray-500 font-semibold block">Sodium (mg)</span>
                <input
                  type="number"
                  min={0}
                  value={sodium}
                  onChange={(e) => setSodium(Number(e.target.value))}
                  className="w-full text-sm font-semibold text-gray-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Availability Status */}
          <div className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-gray-800 block">Initial Stock Status</span>
              <span className="text-xs text-gray-500">Should this item be immediately discoverable by students?</span>
            </div>
            <button
              type="button"
              onClick={() => setAvailable(!available)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                available
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-rose-100 text-rose-800 border border-rose-300"
              }`}
            >
              {available ? "● Available Now" : "○ Currently Unavailable"}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm disabled:opacity-50"
          >
            {isSubmitting ? "Publishing Item..." : "Publish Food Item to Menu →"}
          </button>
        </form>
      </div>
    </div>
  );
}

