"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Search, Sparkles, Check } from "lucide-react";
import { getFoodImage } from "@/data/foodData";
import { useToast } from "@/components/Toast";
import { FoodItem } from "@/types";

const API_BASE = "http://127.0.0.1:8000";

export default function OwnerNutritionPage() {
  const { showToast } = useToast();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  }>({ calories: 0, protein: 0, carbohydrates: 0, fat: 0 });

  const [isSaving, setIsSaving] = useState(false);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/owner/menu`);
      if (res.ok) {
        const data = await res.json();
        setFoods(data);
      }
    } catch (e) {
      console.error("Failed to load menu:", e);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleStartEdit = (item: FoodItem) => {
    setEditingId(item.item_id);
    setEditValues({
      calories: item.calories || 0,
      protein: item.protein || 0,
      carbohydrates: item.carbohydrates || 0,
      fat: item.fat || 0
    });
  };

  const handleSaveItem = async (itemId: number) => {
    if (
      editValues.calories < 0 ||
      editValues.protein < 0 ||
      editValues.carbohydrates < 0 ||
      editValues.fat < 0
    ) {
      showToast("Nutritional values cannot be negative", "error");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/owner/menu/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues)
      });

      if (res.ok) {
        setFoods((prev) =>
          prev.map((f) => (f.item_id === itemId ? { ...f, ...editValues } : f))
        );
        showToast("Nutrition values updated!");
        setEditingId(null);
      } else {
        showToast("Failed to save values", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase())
  );

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
            Nutrition Source of Truth
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage official macronutrient counts per serving. These values power student intake tracking and recommendation ranking.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Nutrition Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Dish</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Calories (kcal)</th>
                <th className="py-3 px-4">Protein (g)</th>
                <th className="py-3 px-4">Carbs (g)</th>
                <th className="py-3 px-4">Fat (g)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => {
                const isEditing = editingId === item.item_id;

                return (
                  <tr key={item.item_id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.image_url || getFoodImage(item.name)}
                          alt={item.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div>
                          <span className="font-bold text-gray-900 block">{item.name}</span>
                          <span className="text-[10px] text-gray-400">₹{item.price}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-gray-500 font-medium">{item.category}</td>

                    {/* Calories */}
                    <td className="py-3 px-4 font-bold text-gray-800">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={editValues.calories}
                          onChange={(e) =>
                            setEditValues({ ...editValues, calories: Number(e.target.value) })
                          }
                          className="w-20 px-2 py-1 border border-emerald-300 rounded-lg text-xs"
                        />
                      ) : (
                        `${Math.round(item.calories)} kcal`
                      )}
                    </td>

                    {/* Protein */}
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={editValues.protein}
                          onChange={(e) =>
                            setEditValues({ ...editValues, protein: Number(e.target.value) })
                          }
                          className="w-16 px-2 py-1 border border-emerald-300 rounded-lg text-xs"
                        />
                      ) : (
                        `${Math.round(item.protein)}g`
                      )}
                    </td>

                    {/* Carbs */}
                    <td className="py-3 px-4 font-bold text-amber-700">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={editValues.carbohydrates}
                          onChange={(e) =>
                            setEditValues({ ...editValues, carbohydrates: Number(e.target.value) })
                          }
                          className="w-16 px-2 py-1 border border-emerald-300 rounded-lg text-xs"
                        />
                      ) : (
                        `${Math.round(item.carbohydrates)}g`
                      )}
                    </td>

                    {/* Fat */}
                    <td className="py-3 px-4 font-bold text-rose-700">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={editValues.fat}
                          onChange={(e) =>
                            setEditValues({ ...editValues, fat: Number(e.target.value) })
                          }
                          className="w-16 px-2 py-1 border border-emerald-300 rounded-lg text-xs"
                        />
                      ) : (
                        `${Math.round(item.fat)}g`
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 rounded-lg text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveItem(item.item_id)}
                            disabled={isSaving}
                            className="px-3 py-1 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-xs font-bold shadow-sm"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="px-3 py-1 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 border border-gray-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

