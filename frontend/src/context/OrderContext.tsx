"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { FoodItem, OrderCartItem } from "@/types";
import { useAuth } from "./AuthContext";

interface OrderContextType {
  cart: OrderCartItem[];
  addToOrder: (food: FoodItem, quantity?: number) => void;
  removeFromOrder: (food_id: number) => void;
  updateQuantity: (food_id: number, quantity: number) => void;
  clearOrder: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  totalPrice: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalItems: number;
  toggleDrawer: () => void;
  placeOrder: () => Promise<boolean>;
  isPlacingOrder: boolean;
  orderSuccessMessage: string | null;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const API_BASE = "http://127.0.0.1:8000";

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<OrderCartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);
  const { user } = useAuth();

  const addToOrder = (food: FoodItem, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.food_id === food.item_id);
      if (existing) {
        return prev.map((item) =>
          item.food_id === food.item_id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { food_id: food.item_id, food, quantity }];
    });
    setIsDrawerOpen(true);
  };

  const removeFromOrder = (food_id: number) => {
    setCart((prev) => prev.filter((item) => item.food_id !== food_id));
  };

  const updateQuantity = (food_id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(food_id);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.food_id === food_id ? { ...item, quantity } : item
      )
    );
  };

  const clearOrder = () => {
    setCart([]);
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  // Dynamic calculations across all cart items
  const { totalPrice, totalCalories, totalProtein, totalCarbs, totalFat } = useMemo(() => {
    let price = 0;
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const item of cart) {
      const q = item.quantity;
      price += (item.food.price || 0) * q;
      calories += (item.food.calories || 0) * q;
      protein += (item.food.protein || 0) * q;
      carbs += (item.food.carbohydrates || 0) * q;
      fat += (item.food.fat || 0) * q;
    }

    return {
      totalPrice: Math.round(price),
      totalCalories: Math.round(calories),
      totalProtein: Math.round(protein * 10) / 10,
      totalCarbs: Math.round(carbs * 10) / 10,
      totalFat: Math.round(fat * 10) / 10
    };
  }, [cart]);

  const placeOrder = async () => {
    if (cart.length === 0) return false;
    setIsPlacingOrder(true);
    try {
      const payload = {
        student_id: user?.id || "student_lakshay",
        items: cart.map((c) => ({ food_id: c.food_id, quantity: c.quantity }))
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCart([]);
        setOrderSuccessMessage("🎉 Order confirmed! Nutrition added to today's intake.");
        // Broadcast custom event so student dashboard & nutrition tracker re-fetch live macros
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("canteen_order_placed"));
        }
        setTimeout(() => {
          setOrderSuccessMessage(null);
          setIsDrawerOpen(false);
        }, 2200);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to place order:", e);
      return false;
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  return (
    <OrderContext.Provider
      value={{
        cart,
        addToOrder,
        removeFromOrder,
        updateQuantity,
        clearOrder,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        totalItems,
        totalPrice,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        placeOrder,
        isPlacingOrder,
        orderSuccessMessage
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}

