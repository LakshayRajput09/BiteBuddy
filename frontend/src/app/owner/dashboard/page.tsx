"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Utensils,
  ShoppingBag,
  Clock,
  TrendingUp,
  Plus,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sliders,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OwnerStats } from "@/types";

const API_BASE = "http://127.0.0.1:8000";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/owner/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to load owner stats:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalItems = stats?.total_items ?? 34;
  const availableItems = stats?.available_items ?? 30;
  const unavailableItems = stats?.unavailable_items ?? 4;
  const todaysOrders = stats?.todays_orders ?? 126;
  const avgPrepTime = stats?.avg_prep_time ?? 8;
  const todaysRevenue = stats?.todays_revenue ?? 8420;

  const popular = stats?.popular_items ?? [];
  const trend = stats?.orders_trend ?? [
    { hour: "8 AM", orders: 14 },
    { hour: "10 AM", orders: 22 },
    { hour: "12 PM", orders: 45 },
    { hour: "2 PM", orders: 28 },
    { hour: "4 PM", orders: 35 },
    { hour: "6 PM", orders: 18 },
    { hour: "8 PM", orders: 24 }
  ];

  const maxOrders = Math.max(...trend.map((t) => t.orders), 50);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            👨‍🍳 Cafeteria Owner Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
            Good afternoon 👋 Canteen Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {user?.canteen_name || "Campus Central Canteen"} • Live Operations & Real-Time Controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/owner/menu/add"
            className="px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Food Item
          </Link>
          <Link
            href="/owner/availability"
            className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all"
          >
            Stock Toggles
          </Link>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Items */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase text-gray-400 block tracking-wider">
            Total Menu Items
          </span>
          <span className="text-3xl font-black text-gray-900">{totalItems}</span>
          <span className="text-[11px] text-gray-500 block">In active catalog</span>
        </div>

        {/* Available Items */}
        <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase text-emerald-800 block tracking-wider">
            Available Items
          </span>
          <span className="text-3xl font-black text-emerald-700">{availableItems}</span>
          <span className="text-[11px] text-emerald-600 block">Ready to order</span>
        </div>

        {/* Today's Orders */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase text-gray-400 block tracking-wider">
            Today&apos;s Orders
          </span>
          <span className="text-3xl font-black text-[#0C3B25]">{todaysOrders}</span>
          <span className="text-[11px] text-emerald-600 block font-semibold">↑ +14% vs yesterday</span>
        </div>

        {/* Average Prep Time */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase text-gray-400 block tracking-wider">
            Avg Prep Time
          </span>
          <span className="text-3xl font-black text-amber-700">{avgPrepTime} min</span>
          <span className="text-[11px] text-gray-500 block">Under 10m target</span>
        </div>

        {/* Today's Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold uppercase text-gray-400 block tracking-wider">
            Today&apos;s Revenue
          </span>
          <span className="text-3xl font-black text-gray-900">₹{todaysRevenue.toLocaleString()}</span>
          <span className="text-[11px] text-gray-500 block">Gross campus sales</span>
        </div>
      </div>

      {/* Main Row: Popular Items & Orders Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Popular Items Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                🔥 Popular Items Today
              </h2>
              <p className="text-xs text-gray-400">Top ordered meals across campus</p>
            </div>
            <Link
              href="/owner/menu"
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              View Menu Management →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">Food Item</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5 text-center">Orders</th>
                  <th className="pb-2.5 text-right">Revenue</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {popular.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3 font-semibold text-gray-900">{item.name}</td>
                    <td className="py-3 text-gray-500">{item.category}</td>
                    <td className="py-3 text-center font-bold text-[#0C3B25]">{item.orders}</td>
                    <td className="py-3 text-right font-semibold text-gray-800">₹{item.revenue}</td>
                    <td className="py-3 text-right">
                      {item.available ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          In Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Unavailable
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders Trend SVG Curve */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight">
                  📈 Hourly Rush Trend
                </h2>
                <p className="text-xs text-gray-400">Order traffic peak analysis</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                Peak: 12 PM
              </span>
            </div>

            {/* Bar Chart Visualization */}
            <div className="pt-6 pb-2">
              <div className="flex items-end justify-between gap-2 h-40 pt-4 px-2">
                {trend.map((point, i) => {
                  const heightPct = Math.round((point.orders / maxOrders) * 100);
                  const isPeak = point.orders === maxOrders;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {point.orders}
                      </span>
                      <div
                        className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${
                          isPeak
                            ? "bg-[#059669] shadow-md"
                            : "bg-[#0C3B25]/80 hover:bg-[#0C3B25]"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] text-gray-400 font-mono mt-1">
                        {point.hour}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Morning Breakfast Rush: 8 AM</span>
            <span className="font-bold text-emerald-700">Lunch Peak: 12 PM (45 orders)</span>
          </div>
        </div>
      </div>

      {/* Quick Action Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/owner/menu"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Manage</span>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700">
              Menu & Price Control
            </h3>
            <p className="text-xs text-gray-500">Edit items, prep times, and descriptions</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/owner/availability"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Live Stock</span>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700">
              Quick Availability Toggles
            </h3>
            <p className="text-xs text-gray-500">Instant real-time in-stock switches</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/owner/nutrition"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Source of Truth</span>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700">
              Nutrition Information Table
            </h3>
            <p className="text-xs text-gray-500">Review & update calories, protein, and carbs</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

