"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";
import { FoodItem } from "@/types";

const CATEGORIES = ["Roll", "Rice", "Snacks", "Noodles", "Chinese", "Beverages", "Sweets"];
const TASTE_OPTIONS = ["Spicy", "Sweet", "Salty", "Sour", "Crispy", "Light", "Filling"];

const API_BASE = "http://127.0.0.1:8000";

export default function EditFoodPage() {
  const params = useParams();
  const itemId = Number(params?.id);
  const router = useRouter();
  const { showToast } = useToast();

  const [item, setItem] = useState<FoodItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Roll");
  const [price, setPrice] = useState<number>(60);
  const [servingSize, setServingSize] = useState("1 portion");
  const [prepTime, setPrepTime] = useState<number>(8);
  const [ingredients, setIngredients] = useState("");
  const [cuisine, setCuisine] = useState("Indian");
  const [imageUrl, setImageUrl] = useState("");
  const [available, setAvailable] = useState(true);

  // Dietary checkboxes
  const [vegetarian, setVegetarian] = useState(true);
  const [vegan, setVegan] = useState(false);
  const [jain, setJain] = useState(false);
  const [containsEgg, setContainsEgg] = useState(false);
  const [containsDairy, setContainsDairy] = useState(false);
  const [containsGluten, setContainsGluten] = useState(false);
  const [containsNuts, setContainsNuts] = useState(false);

  // Tastes
  const [selectedTastes, setSelectedTastes] = useState<string[]>([]);

  // Nutrition Fields
  const [calories, setCalories] = useState<number>(320);
  const [protein, setProtein] = useState<number>(12);
  const [carbs, setCarbs] = useState<number>(40);
  const [fat, setFat] = useState<number>(14);
  const [fiber, setFiber] = useState<number>(4);
  const [sugar, setSugar] = useState<number>(3);
  const [sodium, setSodium] = useState<number>(520);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`${API_BASE}/menu/${itemId}`);
        if (res.ok) {
          const d: FoodItem = await res.json();
          setItem(d);
          setName(d.name);
          setDescription(d.description || "");
          setCategory(d.category);
          setPrice(d.price);
          setServingSize(d.serving_size || "1 portion");
          setPrepTime(d.preparation_time);
          setIngredients(d.ingredients);
          setCuisine(d.cuisine || "Indian");
          setImageUrl(d.image_url || "");
          setAvailable(d.available);

          setVegetarian(d.vegetarian);
          setVegan(d.vegan);
          setJain(d.jain);
          setContainsEgg(d.contains_egg ?? false);
          setContainsDairy(d.contains_dairy ?? false);
          setContainsGluten(d.contains_gluten ?? false);
          setContainsNuts(d.contains_nuts ?? false);

          const tastes = (d.tags || "").split(",").map((s) => s.trim()).filter(Boolean);
          setSelectedTastes(tastes);

          setCalories(d.calories || 300);
          setProtein(d.protein || 10);
          setCarbs(d.carbohydrates || 35);
          setFat(d.fat || 10);
          setFiber(d.fiber || 3);
          setSugar(d.sugar || 2);
          setSodium(d.sodium || 400);
        }
      } catch (e) {
        console.error("Failed to load item:", e);
      } finally {
        setIsLoading(false);
      }
    };
    if (itemId) fetchItem();
  }, [itemId]);

  const toggleTaste = (t: string) => {
    if (selectedTastes.includes(t)) {
      setSelectedTastes(selectedTastes.filter((x) => x !== t));
    } else {
      setSelectedTastes([...selectedTastes, t]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (price < 0 || calories < 0 || protein < 0 || carbs < 0 || fat < 0) {
      showToast("Price and nutritional values cannot be negative", "error");
      return;
    }
    if (prepTime <= 0) {
      showToast("Prep time must be greater than 0", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        price,
        ingredients: ingredients.trim(),
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
        image_url: imageUrl.trim(),
        calories,
        protein,
        carbohydrates: carbs,
        fat,
        fiber,
        sugar,
        sodium
      };

      const res = await fetch(`${API_BASE}/owner/menu/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Updated ${name} successfully!`);
        router.push("/owner/menu");
      } else {
        showToast("Failed to update item", "error");
      }
    } catch (e) {
      showToast("Network error updating item", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-gray-500">
        <p>Loading item details...</p>
      </div>
    );
  }

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
        <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Edit Menu Item: {item?.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Update pricing, preparation time, availability, and nutrition facts.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Food Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Category</label>
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
              <label className="text-xs font-bold text-gray-700">Price (₹)</label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Preparation Time (min)</label>
              <input
                type="number"
                min={1}
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Nutrition Per Serving Inputs */}
          <div className="p-5 rounded-2xl bg-[#F8FAF7] border border-emerald-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Macronutrient Profile (Per Serving)
            </h3>
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
            </div>
          </div>

          {/* Availability Switch */}
          <div className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800">Available to Students</span>
            <button
              type="button"
              onClick={() => setAvailable(!available)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                available
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-rose-100 text-rose-800 border border-rose-300"
              }`}
            >
              {available ? "● In Stock" : "○ Sold Out"}
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/owner/menu"
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

