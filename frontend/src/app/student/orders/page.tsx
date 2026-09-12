"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { History, Clock, ShoppingBag, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OrderRecord } from "@/types";

const API_BASE = "http://127.0.0.1:8000";

export default function StudentOrdersPage() {
  const { user } = useAuth();
  const studentId = user?.id || "student_lakshay";

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders?student_id=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleOrderPlaced = () => {
      fetchOrders();
    };

    window.addEventListener("canteen_order_placed", handleOrderPlaced);
    return () => {
      window.removeEventListener("canteen_order_placed", handleOrderPlaced);
    };
  }, [studentId]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold">📦</span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Order History
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Historical orders with frozen prices and nutritional values preserved at time of purchase.
          </p>
        </div>

        <Link
          href="/menu"
          className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
        >
          <span>New Order</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <span className="text-5xl block">🍽️</span>
          <h3 className="font-bold text-gray-800 text-lg">No past orders yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Your placed orders and cumulative nutrition logs will appear here.
          </p>
          <Link
            href="/chat"
            className="inline-block px-5 py-2.5 bg-[#059669] text-white text-xs font-bold rounded-xl shadow-sm mt-2"
          >
            Ask CanteenAI for Suggestions
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const dateStr = new Date(order.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-emerald-200 transition-all space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-black text-[#0C3B25] text-sm">Order #{order.id}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {dateStr}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      ● {order.status}
                    </span>
                    <span className="text-lg font-black text-gray-900">
                      ₹{order.total_price}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {order.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 text-xs space-y-1"
                    >
                      <div className="flex justify-between font-bold text-gray-800">
                        <span>{it.food_name}</span>
                        <span className="text-emerald-700">×{it.quantity}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-500">
                        <span>₹{it.price * it.quantity}</span>
                        <span>{Math.round(it.calories * it.quantity)} kcal</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Frozen Macro Summary */}
                <div className="pt-2 border-t border-dashed border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="font-semibold text-gray-700">Total Nutrition:</span>
                    <span>{order.total_calories} kcal</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">{order.total_protein}g Protein</span>
                    <span>•</span>
                    <span className="text-amber-700">{order.total_carbs}g Carbs</span>
                    <span>•</span>
                    <span className="text-rose-700">{order.total_fat}g Fat</span>
                  </div>
                  <span className="text-[10px] text-gray-400 italic">
                    Values frozen at order time
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

