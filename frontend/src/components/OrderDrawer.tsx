"use client";

import React from "react";
import { useOrder } from "@/context/OrderContext";

export default function OrderDrawer() {
  const {
    cart,
    removeFromOrder,
    updateQuantity,
    clearOrder,
    isDrawerOpen,
    closeDrawer,
    totalPrice,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    placeOrder,
    isPlacingOrder,
    orderSuccessMessage
  } = useOrder();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#FAFAF8]">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛍️</span>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Your Active Order</h3>
                <p className="text-xs text-gray-500">{cart.length} unique item{cart.length === 1 ? "" : "s"}</p>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          {/* Success Notification */}
          {orderSuccessMessage && (
            <div className="mx-4 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2 animate-bounce">
              <span>{orderSuccessMessage}</span>
            </div>
          )}

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <span className="text-5xl mb-3">🍽️</span>
                <p className="font-semibold text-gray-700">Your order tray is empty</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add items from the menu, AI recommendations, or chat assistant.
                </p>
              </div>
            ) : (
              cart.map(({ food, quantity }) => (
                <div
                  key={food.item_id}
                  className="p-3.5 rounded-2xl border border-gray-100 bg-[#FDFDFD] hover:border-gray-200 shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{food.image_emoji || "🍽️"}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{food.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-emerald-700">₹{food.price} each</span>
                          <span className="text-[11px] text-gray-400">• {food.preparation_time}m prep</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromOrder(food.item_id)}
                      className="text-gray-300 hover:text-red-500 p-1 text-xs"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Item Macros per selected quantity */}
                  <div className="mt-2.5 pt-2 border-t border-dashed border-gray-100 flex items-center justify-between text-xs">
                    <div className="text-gray-500 font-mono text-[11px]">
                      {Math.round((food.calories || 0) * quantity)} kcal •{" "}
                      <span className="text-emerald-700 font-medium">{Math.round((food.protein || 0) * quantity)}g P</span> •{" "}
                      {Math.round((food.carbohydrates || 0) * quantity)}g C •{" "}
                      {Math.round((food.fat || 0) * quantity)}g F
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                      <button
                        onClick={() => updateQuantity(food.item_id, quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center font-bold text-gray-500 hover:text-gray-800"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs text-gray-800 w-4 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(food.item_id, quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center font-bold text-emerald-700 hover:text-emerald-800"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Dynamic Cumulative Summary */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-gray-100 bg-[#FAFAF8] space-y-3">
              {/* Macros Breakdown */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-emerald-950">
                  <span>⚡ Total Nutrition Per Serving</span>
                  <span>{totalCalories} kcal</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-emerald-100/60 text-[11px]">
                  <div className="bg-white/70 py-1 rounded-md">
                    <span className="text-gray-500 block">Protein</span>
                    <span className="font-bold text-emerald-700">{totalProtein}g</span>
                  </div>
                  <div className="bg-white/70 py-1 rounded-md">
                    <span className="text-gray-500 block">Carbs</span>
                    <span className="font-bold text-amber-700">{totalCarbs}g</span>
                  </div>
                  <div className="bg-white/70 py-1 rounded-md">
                    <span className="text-gray-500 block">Fat</span>
                    <span className="font-bold text-rose-700">{totalFat}g</span>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-700/80 text-center pt-0.5">
                  Approx. nutrition • Updates your daily dashboard intake on order
                </p>
              </div>

              {/* Price & Action */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs text-gray-400 block">Total Amount</span>
                  <span className="text-2xl font-black text-[#0C3B25]">₹{totalPrice}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearOrder}
                    className="px-3 py-2.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-all"
                  >
                    Clear
                  </button>
                  <button
                    onClick={placeOrder}
                    disabled={isPlacingOrder}
                    className="px-6 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isPlacingOrder ? "Placing Order..." : "Confirm & Order →"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

