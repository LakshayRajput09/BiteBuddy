"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Clock,
  Plus,
  AlertCircle,
  HelpCircle,
  ShoppingBag
} from "lucide-react";
import { getFoodImage } from "@/data/foodData";
import { useAuth } from "@/context/AuthContext";
import { useOrder } from "@/context/OrderContext";
import { useToast } from "@/components/Toast";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  recommendation?: any;
  combo?: any;
  alternatives?: any[];
  isClarification?: boolean;
  clarificationType?: string;
  timestamp: string;
}

const QUICK_CHIPS = [
  "I'm hungry and want something spicy.",
  "Vegetarian under ₹120 in 10 mins",
  "High protein lunch",
  "Something light and gut-friendly",
  "Under ₹50 quick bite"
];

export default function ChatPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const { user } = useAuth();
  const { addToOrder } = useOrder();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "ai-welcome",
      sender: "ai",
      text: "Hi 👋 I'm BiteBuddy, your personal canteen assistant.\n\nTell me what you're in the mood for, your budget, or any nutrition targets!\n\nFor example:\n\"I'm hungry, have ₹120, want something spicy and vegetarian within 10 minutes.\"",
      timestamp: "Just now"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (customText?: string) => {
    const messageToSend = (customText || input).trim();
    if (!messageToSend || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          session_id: sessionId || undefined,
          student_id: user?.id || "student_lakshay"
        })
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const data = await res.json();
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.reply_text,
        recommendation: data.recommendation,
        combo: data.combo,
        alternatives: data.alternatives,
        isClarification: data.is_clarification,
        clarificationType: data.clarification_type,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: "I had trouble connecting to the canteen server. Please make sure the backend is running.",
          isClarification: true,
          timestamp: "Just now"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRec = (recItem: any) => {
    addToOrder(recItem, 1);
    showToast(`Added ${recItem.name} to your order!`);
  };

  const handleAddCombo = (combo: any) => {
    addToOrder(combo.main_item, 1);
    addToOrder(combo.side_item, 1);
    showToast(`Added ${combo.main_item.name} + ${combo.side_item.name} to order!`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Chat Window Container */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0C3B25] text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <span>Chat with BiteBuddy</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-500">Ask about cravings, budget limits, or macros</p>
            </div>
          </div>

          <Link
            href="/recommendations"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
          >
            Recommendations
          </Link>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs shadow-sm ${
                    isUser
                      ? "bg-slate-800 text-white"
                      : "bg-[#0C3B25] text-white"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                      isUser
                        ? "bg-[#ECFDF5] text-emerald-950 font-medium rounded-tr-none border border-emerald-200/60"
                        : msg.isClarification
                        ? "bg-amber-50 text-amber-950 border border-amber-200 rounded-tl-none"
                        : "bg-slate-50 text-slate-900 border border-slate-200/70 rounded-tl-none"
                    }`}
                  >
                    {msg.isClarification && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1.5">
                        {msg.clarificationType === "conflict" ? (
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <HelpCircle className="w-4 h-4 text-amber-600" />
                        )}
                        <span>{msg.clarificationType === "conflict" ? "Contradiction Detected" : "Clarification Needed"}</span>
                      </div>
                    )}

                    {msg.text}

                    {/* Recommendation Card Preview */}
                    {msg.recommendation && (
                      <div className="mt-4 pt-3 border-t border-slate-200/80 bg-white rounded-2xl p-4 shadow-sm border border-emerald-200 text-left space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            BEST MATCH ({msg.recommendation.match_percentage}%)
                          </span>
                          <span className="text-sm font-black text-[#0C3B25]">
                            ₹{Math.round(msg.recommendation.item.price)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <img
                            src={getFoodImage(msg.recommendation.item.name)}
                            alt={msg.recommendation.item.name}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-sm">{msg.recommendation.item.name}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {msg.recommendation.item.preparation_time}m prep
                              </span>
                              <span>•</span>
                              <span>{msg.recommendation.item.vegetarian ? "🌱 Veg" : "🍗 Non-Veg"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Nutrition pill preview */}
                        <div className="bg-[#F8FAF7] p-2 rounded-xl border border-gray-100 flex items-center justify-between text-[11px] font-mono">
                          <span>{Math.round(msg.recommendation.item.calories || 340)} kcal</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">{Math.round(msg.recommendation.item.protein || 18)}g Protein</span>
                          <span>•</span>
                          <span>{Math.round(msg.recommendation.item.carbohydrates || 40)}g Carbs</span>
                          <span>•</span>
                          <span>{Math.round(msg.recommendation.item.fat || 14)}g Fat</span>
                        </div>

                        {/* Reasons */}
                        {msg.recommendation.reasons && (
                          <div className="space-y-1 text-[11px] text-gray-600">
                            {msg.recommendation.reasons.slice(0, 3).map((r: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => handleAddRec(msg.recommendation.item)}
                            className="px-4 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add to Order
                          </button>

                          <Link
                            href="/recommendations"
                            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            Full Analysis →
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Meal Combo Preview if exists */}
                    {msg.combo && (
                      <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-left space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-emerald-950">
                            🥤 Suggested Combo: {msg.combo.description}
                          </span>
                          <span className="font-black text-emerald-800">
                            ₹{Math.round(msg.combo.total_price)}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-800 flex justify-between font-mono">
                          <span>{msg.combo.total_calories || 420} kcal</span>
                          <span>{msg.combo.total_protein || 18}g Protein</span>
                          <span>~{msg.combo.max_prep_time || 8} min</span>
                        </div>
                        <button
                          onClick={() => handleAddCombo(msg.combo)}
                          className="w-full py-1.5 bg-[#0C3B25] hover:bg-[#082819] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Combo to Order (₹{msg.combo.total_price})
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0C3B25] text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-700 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Bottom Area: Suggestions + Chat Input */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-[#FAFAF8]">
          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 text-xs font-medium whitespace-nowrap transition-colors shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Form Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you crave, budget, or macros (e.g. ₹120 spicy high protein)..."
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white flex items-center justify-center shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
