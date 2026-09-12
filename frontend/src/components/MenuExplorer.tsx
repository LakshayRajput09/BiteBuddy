"use client";

import React, { useState, useEffect } from "react";
import { FoodItem } from "@/types";
import { Search, Power, Clock, Utensils, RefreshCw, MessageSquarePlus } from "lucide-react";

interface Props {
  apiUrl: string;
  onAskAboutItem?: (itemName: string) => void;
  className?: string;
}

export const MenuExplorer: React.FC<Props> = ({
  apiUrl,
  onAskAboutItem,
  className = ""
}) => {
  const [menu, setMenu] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [vegOnly, setVegOnly] = useState(false);
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
    fetchMenu();
  }, []);

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
        setMenu(prev => prev.map(f => (f.item_id === updated.item_id ? updated : f)));
      }
    } catch (err) {
      console.error("Failed to toggle availability:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const categories = ["All", ...Array.from(new Set(menu.map(m => m.category)))];

  const filteredItems = menu.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.ingredients.toLowerCase().includes(search.toLowerCase());
    const matchesVeg = !vegOnly || item.vegetarian;
    return matchesCategory && matchesSearch && matchesVeg;
  });

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Canteen Inventory</h3>
            <p className="text-[11px] text-slate-500">Real-time items & admin availability toggles</p>
          </div>
        </div>
        <button
          onClick={fetchMenu}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          title="Refresh inventory"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Search & Veg Filter */}
      <div className="space-y-2 pt-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items, ingredients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
          />
        </div>

        {/* Category horizontal scroll */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[550px]">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No canteen items found matching your filters.
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.item_id}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                item.available
                  ? "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-orange-200"
                  : "bg-slate-100/60 border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-2xl p-1 bg-white rounded-lg border border-slate-200 flex-shrink-0">
                  {item.image_emoji || "🍽️"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">{item.name}</span>
                    {item.vegan && (
                      <span className="text-[9px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                        Vegan
                      </span>
                    )}
                    {item.jain && (
                      <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800">
                        Jain
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span className="font-black text-slate-900 text-xs">₹{Math.round(item.price)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {item.preparation_time}m
                    </span>
                    <span>•</span>
                    <span className="truncate">{item.category}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {onAskAboutItem && (
                  <button
                    onClick={() => onAskAboutItem(item.name)}
                    className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Ask assistant about this item"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => toggleAvailability(item)}
                  disabled={togglingId === item.item_id}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1 ${
                    item.available
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                      : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                  }`}
                  title="Click to toggle availability"
                >
                  <Power className="w-2.5 h-2.5" />
                  <span>{item.available ? "In Stock" : "Sold Out"}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer info */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>{filteredItems.length} items available</span>
        <span className="text-[10px]">Tap "Sold Out" to test real-time AI adaptation</span>
      </div>
    </div>
  );
};

