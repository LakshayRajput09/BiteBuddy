"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Search, Sparkles } from "lucide-react";
import { getFoodImage } from "@/data/foodData";
import { useToast } from "@/components/Toast";
import { FoodItem } from "@/types";

const API_BASE = "http://127.0.0.1:8000";

export default function OwnerAvailabilityPage() {
  const { showToast } = useToast();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/owner/menu`);
      if (res.ok) {
        const data = await res.json();
        setFoods(data);
      }
    } catch (e) {
      console.error("Failed to load items:", e);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleToggle = async (item: FoodItem) => {
    const nextState = !item.available;
    setFoods((prev) =>
      prev.map((f) => (f.item_id === item.item_id ? { ...f, available: nextState } : f))
    );

    try {
      const res = await fetch(`${API_BASE}/owner/menu/${item.item_id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: nextState })
      });

      if (res.ok) {
        showToast(`${item.name} set to ${nextState ? "In Stock" : "Unavailable"}`);
      } else {
        fetchMenu();
        showToast("Failed to toggle status", "error");
      }
    } catch (e) {
      fetchMenu();
      showToast("Network error", "error");
    }
  };

  const categories = ["All", ...Array.from(new Set(foods.map((f) => f.category)))];

  const filtered = foods.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || f.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const availableCount = foods.filter((f) => f.available).length;
  const unavailableCount = foods.length - availableCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        href="/owner/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Owner Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Live Availability Controls
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Toggle item availability in real time. Unavailable dishes are immediately avoided by BiteBuddy recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            ● {availableCount} In Stock
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
            ○ {unavailableCount} Sold Out
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items to toggle (e.g. Paneer, Maggi, Soda)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? "bg-[#0C3B25] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Availability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <div
            key={item.item_id}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 bg-white ${
              item.available
                ? "border-emerald-200 shadow-sm"
                : "border-slate-200 bg-gray-50/70 opacity-70"
            }`}
          >
            <div className="flex items-start gap-3">
              <img
                src={item.image_url || getFoodImage(item.name)}
                alt={item.name}
                className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                <span className="text-xs text-gray-400 block">{item.category}</span>
                <span className="text-xs font-black text-[#0C3B25] mt-1 block">₹{item.price}</span>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => handleToggle(item)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                item.available
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm"
                  : "bg-white hover:bg-gray-100 text-rose-700 border-rose-200"
              }`}
            >
              {item.available ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>In Stock (Click to Mark Out)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Sold Out (Click to Enable)</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

