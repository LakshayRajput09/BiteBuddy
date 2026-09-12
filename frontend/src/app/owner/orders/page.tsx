"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ShoppingBag, CheckCircle, RefreshCw } from "lucide-react";
import { OrderRecord } from "@/types";

const API_BASE = "http://127.0.0.1:8000";

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s live kitchen polling
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
            Kitchen Orders Queue
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time incoming student food orders and item fulfillment.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Orders
        </button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-gray-400 space-y-2">
          <ShoppingBag className="w-10 h-10 mx-auto text-gray-300" />
          <p className="font-bold text-gray-700">No active canteen orders right now</p>
          <p className="text-xs">When students place orders via BiteBuddy, they will appear here instantly.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const dateStr = new Date(order.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 font-black text-xs flex items-center justify-center">
                      #{order.id}
                    </span>
                    <div>
                      <span className="font-bold text-gray-900 text-sm block">
                        Student ID: {order.student_id}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-[#0C3B25]">₹{order.total_price}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      ● {order.status}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-wrap gap-2">
                  {order.items.map((it) => (
                    <div
                      key={it.id}
                      className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-medium text-gray-800"
                    >
                      <span className="font-bold text-emerald-700 mr-1.5">{it.quantity}×</span>
                      <span>{it.food_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

