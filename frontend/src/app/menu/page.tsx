"use client";

import React, { useState, useEffect } from "react";
import { Search, SlidersHorizontal, RefreshCw } from "lucide-react";
import { FoodCard } from "@/components/FoodCard";
import { REFERENCE_MENU_ITEMS, FoodDisplayItem, getFoodImage } from "@/data/foodData";

const CATEGORIES = [
  "All",
  "Main Course",
  "Snacks",
  "Beverages",
  "Desserts",
  "South Indian",
  "Chinese",
  "Fast Food"
];

export default function MenuPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [items, setItems] = useState<FoodDisplayItem[]>(REFERENCE_MENU_ITEMS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showVegOnly, setShowVegOnly] = useState(false);

  // Fetch real items from backend API
  const loadMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/menu`);
      if (res.ok) {
        const data = await res.json();
        // Enrich backend items with images, nutrition, and category normalization
        const enriched: FoodDisplayItem[] = data.map((d: any) => {
          let category = d.category;
          if (category === "Roll" || category === "Rice") category = "Main Course";
          if (category === "Sweets") category = "Desserts";

          return {
            id: d.item_id,
            name: d.name,
            category: category,
            price: Math.round(d.price),
            prepTime: d.preparation_time,
            available: d.available,
            image: getFoodImage(d.name),
            description: `${d.cuisine || "Canteen"} style dish made with ${d.ingredients}.`,
            ingredients: d.ingredients.split(",").map((s: string) => s.trim()),
            nutrition: {
              calories: `${Math.round(200 + d.price * 1.8)} kcal`,
              protein: `${Math.round(4 + d.price * 0.1)}g`,
              carbs: `${Math.round(25 + d.price * 0.2)}g`,
              fat: `${Math.round(3 + d.price * 0.08)}g`
            },
            tags: [d.vegetarian ? "Vegetarian" : "Non-Veg", ...(d.spicy ? ["Spicy"] : [])],
            isVegetarian: d.vegetarian,
            isVegan: d.vegan,
            isJain: d.jain,
            isSpicy: d.spicy,
            isPopular: d.price <= 60 && d.preparation_time <= 8
          };
        });

        // Ensure reference items like French Fries exist
        const hasFries = enriched.some(i => i.name.toLowerCase().includes("fries"));
        if (!hasFries) {
          const fries = REFERENCE_MENU_ITEMS.find(i => i.name.toLowerCase().includes("fries"));
          if (fries) enriched.push(fries);
        }

        setItems(enriched);
      }
    } catch (err) {
      console.log("Using reference menu items fallback:", err);
      setItems(REFERENCE_MENU_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesCategory =
      selectedCategory === "All" ||
      item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.ingredients.some(ing => ing.toLowerCase().includes(search.toLowerCase()));
    const matchesVeg = !showVegOnly || item.isVegetarian;

    return matchesCategory && matchesSearch && matchesVeg;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Explore Our Menu
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse all available items with real-time availability.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search for items (e.g. maggi, roll, coffee)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
          />
        </div>

        <button
          onClick={() => setShowVegOnly(!showVegOnly)}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all shadow-sm ${
            showVegOnly
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
          <span>{showVegOnly ? "Veg Only (Active)" : "Filters"}</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map(cat => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Food Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          Loading canteen menu...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm space-y-2">
          <p className="font-bold text-slate-800">No food items found matching your criteria</p>
          <p className="text-xs text-slate-400">Try clearing your search or switching categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

