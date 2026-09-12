"use client";

import React, { useState, useEffect } from "react";
import { FoodItem } from "@/types";
import { X, Search, Check, Power, Clock, Utensils, RefreshCw } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
}

export const MenuDrawer: React.FC<Props> = ({ isOpen, onClose, apiUrl }) => {
  const [menu, setMenu] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/menu`);
      if (res.ok) {
        const data = await res.json();
        setMenu(data);
      }
    } catch (err) {
      console.error("Failed to fetch menu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMenu();
    }
  }, [isOpen]);

  const toggleAvailability = async (item: FoodItem) => {
    setTogglingId(item.item_id);
    try {
      const res = await fetch(`${apiUrl}/menu/${item.item_id}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !item.available })
      });
      if (res.ok) {
        const updated = await res.json();
        setMenu(prev => prev.map(f => f.item_id === updated.item_id ? updated : f));
      }
    } catch (err) {
      console.error("Failed to toggle availability:", err);
    } finally {
      setTogglingId(null);
    }
  };

  if (!isOpen) return null;

  const categories = ["All", ...Array.from(new Set(menu.map(m => m.category)))];

  const filteredItems = menu.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.ingredients.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-slate-900">Canteen Live Menu & Admin Toggle</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse all items or toggle availability to test real-time AI adaptation!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMenu}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Refresh menu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by food name, ingredient (e.g. paneer, potato, noodles)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-orange-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No menu items match your search or filter.
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.item_id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  item.available
                    ? "bg-white border-slate-200 hover:border-orange-200 shadow-sm"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    {item.image_emoji || "🍽️"}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
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
                      {item.spicy && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                          Spicy
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {item.ingredients}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 font-medium">
                      <span className="font-bold text-slate-900">₹{Math.round(item.price)}</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        {item.preparation_time} mins
                      </span>
                      <span className="text-slate-400">• {item.serving_size}</span>
                    </div>
                  </div>
                </div>

                {/* Availability Toggle Button */}
                <button
                  onClick={() => toggleAvailability(item)}
                  disabled={togglingId === item.item_id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                    item.available
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                  }`}
                  title={item.available ? "Click to mark Out of Stock" : "Click to mark In Stock"}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{item.available ? "Available" : "Out of Stock"}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
          Showing {filteredItems.length} of {menu.length} total canteen items
        </div>
      </div>
    </div>
  );
};

