"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Filter
} from "lucide-react";
import { getFoodImage } from "@/data/foodData";
import { useToast } from "@/components/Toast";
import { FoodItem } from "@/types";

const API_BASE = "http://127.0.0.1:8000";

export default function OwnerMenuPage() {
  const { showToast } = useToast();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<FoodItem | null>(null);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/owner/menu`);
      if (res.ok) {
        const data = await res.json();
        setFoods(data);
      }
    } catch (e) {
      console.error("Failed to load menu:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleToggleAvailability = async (item: FoodItem) => {
    const newStatus = !item.available;
    // Optimistic UI update
    setFoods((prev) =>
      prev.map((f) => (f.item_id === item.item_id ? { ...f, available: newStatus } : f))
    );

    try {
      const res = await fetch(`${API_BASE}/owner/menu/${item.item_id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: newStatus })
      });

      if (res.ok) {
        showToast(`${item.name} is now ${newStatus ? "In Stock" : "Unavailable"}`);
      } else {
        // Revert on error
        fetchMenu();
        showToast("Failed to update availability", "error");
      }
    } catch (e) {
      fetchMenu();
      showToast("Network error updating status", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE}/owner/menu/${deleteTarget.item_id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setFoods((prev) => prev.filter((f) => f.item_id !== deleteTarget.item_id));
        showToast(`Deleted ${deleteTarget.name} from menu`);
      } else {
        showToast("Failed to delete item", "error");
      }
    } catch (e) {
      showToast("Error deleting item", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  // Filtering
  const filteredFoods = foods.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase()) ||
      (f.ingredients && f.ingredients.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === "available") return f.available;
    if (activeFilter === "unavailable") return !f.available;
    if (activeFilter === "vegetarian") return f.vegetarian;
    if (activeFilter === "high_protein") return f.protein >= 15;
    if (activeFilter === "low_calorie") return f.calories <= 300;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Menu Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Search, update prices, manage nutritional values, and toggle real-time availability.
          </p>
        </div>

        <Link
          href="/owner/menu/add"
          className="px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Food Item
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by name, category, ingredient..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { label: "All Items", val: "all" },
            { label: "Available", val: "available" },
            { label: "Unavailable", val: "unavailable" },
            { label: "Vegetarian", val: "vegetarian" },
            { label: "High Protein", val: "high_protein" },
            { label: "Low Calorie", val: "low_calorie" }
          ].map((pill) => (
            <button
              key={pill.val}
              type="button"
              onClick={() => setActiveFilter(pill.val)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeFilter === pill.val
                  ? "bg-[#0C3B25] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Nutrition</th>
                <th className="py-3 px-4 text-center">Prep Time</th>
                <th className="py-3 px-4 text-center">Availability</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFoods.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No food items match your filter.
                  </td>
                </tr>
              ) : (
                filteredFoods.map((item) => (
                  <tr key={item.item_id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Item Name & Image */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url || getFoodImage(item.name)}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-gray-900 text-sm block">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {item.vegetarian ? "🌱 Veg" : "🍗 Non-Veg"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-gray-600 font-medium">
                      {item.category}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-black text-gray-900 text-sm">
                      ₹{item.price}
                    </td>

                    {/* Nutrition */}
                    <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                      <span>{Math.round(item.calories)} kcal</span> •{" "}
                      <span className="text-emerald-700 font-bold">{Math.round(item.protein)}g P</span>
                    </td>

                    {/* Prep Time */}
                    <td className="py-3.5 px-4 text-center text-gray-600">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {item.preparation_time}m
                      </span>
                    </td>

                    {/* Availability Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                          item.available
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                        }`}
                        title="Click to toggle availability"
                      >
                        {item.available ? "● In Stock" : "○ Sold Out"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/owner/menu/${item.item_id}/edit`}
                          className="p-2 text-gray-400 hover:text-emerald-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Confirm Deletion</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to permanently delete <strong>{deleteTarget.name}</strong> from the campus menu?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
              >
                Delete Food
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

