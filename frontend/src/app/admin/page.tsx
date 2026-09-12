"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  Power,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { FoodItem } from "@/types";
import { useToast } from "@/components/Toast";

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/menu`);
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch (e) {
      console.log("Failed to fetch menu in admin:", e);
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
        setMenuItems(prev =>
          prev.map(f => (f.item_id === updated.item_id ? updated : f))
        );
        showToast(
          `${item.name} is now ${!item.available ? "In Stock" : "Marked Out of Stock"}`
        );
      }
    } catch (err) {
      showToast("Could not update availability", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const totalCount = menuItems.length || 48;
  const availableCount = menuItems.filter(i => i.available).length || 42;

  const popularItems = [
    { rank: 1, name: "Masala Maggi", orders: 32 },
    { rank: 2, name: "Paneer Roll", orders: 28 },
    { rank: 3, name: "Cold Coffee", orders: 25 },
    { rank: 4, name: "Veg Sandwich", orders: 21 },
    { rank: 5, name: "Lemon Soda", orders: 18 }
  ];

  const sidebarLinks = [
    { label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Menu Management", icon: <Utensils className="w-4 h-4" /> },
    { label: "Orders", icon: <ShoppingBag className="w-4 h-4" /> },
    { label: "Availability", icon: <Power className="w-4 h-4" /> },
    { label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { label: "Users", icon: <Users className="w-4 h-4" /> },
    { label: "Settings", icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 space-y-2">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Canteen Portal
          </div>

          <div className="space-y-1">
            {sidebarLinks.map(link => (
              <button
                key={link.label}
                onClick={() => setActiveTab(link.label)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left ${
                  activeTab === link.label
                    ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={activeTab === link.label ? "text-emerald-700" : "text-slate-400"}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Overview of your canteen operations
              </p>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Sep 12, 2026
            </span>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Total Items</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="text-xs text-emerald-700 font-medium">Available Items</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">{availableCount}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="text-xs text-amber-700 font-medium">Today's Orders</div>
              <div className="text-2xl font-black text-slate-900 mt-1">126</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="text-xs text-blue-700 font-medium">Avg. Prep Time</div>
              <div className="text-2xl font-black text-slate-900 mt-1">8 min</div>
            </div>
          </div>

          {/* Grid: Popular Items + Orders Trend Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Popular Items Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Popular Items Today</h3>
                <span className="text-[11px] text-slate-400 font-medium">By order frequency</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {popularItems.map(item => (
                  <div key={item.rank} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                        {item.rank}
                      </span>
                      <span className="font-bold text-slate-800">{item.name}</span>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {item.orders} orders
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders Trend SVG Chart */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Orders Trend</h3>
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Peak lunch rush</span>
                </span>
              </div>

              {/* Chart SVG Canvas */}
              <div className="h-44 w-full flex flex-col justify-between pt-4">
                <div className="relative flex-1 w-full flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3"
                      points="0,80 50,70 100,20 150,55 200,30 250,45 300,35"
                    />
                    {/* Data dots */}
                    <circle cx="100" cy="20" r="4" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="200" cy="30" r="4" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-2 border-t border-slate-100">
                  <span>8AM</span>
                  <span>10AM</span>
                  <span className="text-emerald-800 font-bold">12PM</span>
                  <span>2PM</span>
                  <span className="text-emerald-800 font-bold">4PM</span>
                  <span>6PM</span>
                  <span>8PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Inventory & Availability Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Real-Time Canteen Availability</h3>
                <p className="text-xs text-slate-500">
                  Toggle items in/out of stock. The AI recommendation engine adapts dynamically!
                </p>
              </div>
              <button
                onClick={fetchMenu}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="pb-2">Item Name</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Prep Time</th>
                    <th className="pb-2 text-right">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {menuItems.slice(0, 10).map(item => (
                    <tr key={item.item_id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-bold text-slate-900">{item.name}</td>
                      <td className="py-2.5 text-slate-500">{item.category}</td>
                      <td className="py-2.5 font-black text-slate-800">₹{Math.round(item.price)}</td>
                      <td className="py-2.5 text-slate-500">{item.preparation_time} min</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => toggleAvailability(item)}
                          disabled={togglingId === item.item_id}
                          className={`px-3 py-1 rounded-xl font-bold text-xs transition-all border inline-flex items-center gap-1.5 ${
                            item.available
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{item.available ? "Available" : "Sold Out"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

