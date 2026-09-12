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
  Minus,
  AlertCircle,
  HelpCircle,
  ShoppingBag,
  RotateCcw,
  Mic,
  MicOff,
  Flame,
  Check,
  ChevronRight,
  UtensilsCrossed,
  Leaf,
  Zap,
  Coffee
} from "lucide-react";
import { getFoodImage } from "@/data/foodData";
import { useAuth } from "@/context/AuthContext";
import { useOrder } from "@/context/OrderContext";
import { useToast } from "@/components/Toast";
import { FoodItem } from "@/types";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  recommendation?: any;
  combo?: any;
  alternatives?: any[];
  matchedItems?: any[];
  suggestedFollowups?: string[];
  isClarification?: boolean;
  clarificationType?: string;
  intent?: string;
  timestamp: string;
}

const INITIAL_SUGGESTIONS = [
  "I'm hungry and want something spicy.",
  "Vegetarian lunch under ₹120 in 10 mins",
  "Highest protein meal under ₹100",
  "What is the cheapest item available?",
  "What dishes have paneer?"
];

const QUICK_FILTERS = [
  { label: "🌱 Pure Veg", prompt: "Show vegetarian options under ₹120" },
  { label: "⚡ < 10 mins", prompt: "Ready in under 10 minutes" },
  { label: "💰 Under ₹100", prompt: "Meals and snacks under ₹100" },
  { label: "💪 High Protein", prompt: "What has the highest protein?" },
  { label: "🥤 Combos", prompt: "Show me popular meal combos with a drink" }
];

export default function ChatPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const { user } = useAuth();
  const { addToOrder, totalItems, toggleDrawer } = useOrder();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "ai-welcome",
      sender: "ai",
      text: "Hi 👋 I'm **BiteBuddy**, your smart college canteen assistant!\n\nTell me your cravings, budget limit, break time, or macro goals — and I'll find the best canteen food for you.\n\nYou can also ask me about **nutrition facts**, **high-protein options**, or **specific dish ingredients**!",
      suggestedFollowups: INITIAL_SUGGESTIONS.slice(0, 4),
      timestamp: "Just now"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [showAlternatives, setShowAlternatives] = useState<Record<string, boolean>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      showToast("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast("Listening... speak your order or cravings!");
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  };

  const handleReset = () => {
    setSessionId(`session_${Date.now()}`);
    setMessages([
      {
        id: `ai-welcome-${Date.now()}`,
        sender: "ai",
        text: "Fresh session started! ✨ What are you craving today? Tell me your budget, diet, or prep time constraints.",
        suggestedFollowups: INITIAL_SUGGESTIONS.slice(0, 4),
        timestamp: "Just now"
      }
    ]);
    showToast("Chat session refreshed!");
  };

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
        matchedItems: data.matched_items,
        suggestedFollowups: data.suggested_followups,
        isClarification: data.is_clarification,
        clarificationType: data.clarification_type,
        intent: data.intent,
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
          text: "I had trouble connecting to the canteen server. Please verify that the backend is active at port 8000.",
          isClarification: true,
          suggestedFollowups: ["Try again", "Show canteen menu"],
          timestamp: "Just now"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getQty = (id: string) => itemQuantities[id] || 1;

  const updateQty = (id: string, delta: number) => {
    setItemQuantities((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleAddItem = (item: any) => {
    const qty = getQty(String(item.item_id));
    addToOrder(item, qty);
    showToast(`Added ${qty}x ${item.name} to order!`);
  };

  const handleAddCombo = (combo: any) => {
    addToOrder(combo.main_item, 1);
    addToOrder(combo.side_item, 1);
    showToast(`Added ${combo.main_item.name} + ${combo.side_item.name} combo to order!`);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col h-[calc(100vh-5.5rem)]">
      {/* Chat Window Container */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-3.5 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0C3B25] text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                  Chat with BiteBuddy
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Canteen Open
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500">
                AI meal assistant • Real-time canteen inventory & macros
              </p>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleReset}
              title="Reset conversation"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={toggleDrawer}
              className="relative px-3 py-1.5 bg-[#0C3B25] hover:bg-[#082819] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Order Tray</span>
              {totalItems > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Filter Presets Row */}
        <div className="px-3 sm:px-6 py-2 bg-[#FAFAF8] border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Quick Ask:
          </span>
          {QUICK_FILTERS.map((f, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(f.prompt)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 font-medium text-[11px] shrink-0 hover:border-emerald-300 transition-all shadow-xs"
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5 bg-[#FAFAF8]/50">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 sm:gap-3.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
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

                {/* Message Content Container */}
                <div className={`flex flex-col max-w-[92%] sm:max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                      isUser
                        ? "bg-[#ECFDF5] text-emerald-950 font-medium rounded-tr-none border border-emerald-200/80"
                        : msg.isClarification
                        ? "bg-amber-50 text-amber-950 border border-amber-200 rounded-tl-none"
                        : "bg-white text-slate-900 border border-slate-200 rounded-tl-none"
                    }`}
                  >
                    {/* Clarification Alert Header */}
                    {msg.isClarification && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-2">
                        {msg.clarificationType === "conflict" ? (
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <HelpCircle className="w-4 h-4 text-amber-600" />
                        )}
                        <span>
                          {msg.clarificationType === "conflict"
                            ? "Contradiction Detected"
                            : "Quick Clarification Needed"}
                        </span>
                      </div>
                    )}

                    {/* Main Reply Text */}
                    <div className="prose prose-sm max-w-none text-slate-800 font-normal">
                      {msg.text}
                    </div>

                    {/* 1. BEST MATCH SPOTLIGHT CARD */}
                    {msg.recommendation && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 bg-[#FAFAF8] rounded-2xl p-3.5 sm:p-4 border border-emerald-200 text-left space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white tracking-wide uppercase">
                            <Sparkles className="w-3 h-3 text-emerald-200" />
                            BEST MATCH ({msg.recommendation.match_percentage}%)
                          </span>
                          <span className="text-base font-black text-[#0C3B25]">
                            ₹{Math.round(msg.recommendation.item.price)}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <img
                            src={getFoodImage(msg.recommendation.item.name)}
                            alt={msg.recommendation.item.name}
                            className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                              {msg.recommendation.item.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                              <span className="flex items-center gap-1 text-slate-700 font-medium">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                {msg.recommendation.item.preparation_time}m prep
                              </span>
                              <span>•</span>
                              <span className={msg.recommendation.item.vegetarian ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
                                {msg.recommendation.item.vegetarian ? "🌱 Pure Veg" : "🍗 Non-Veg"}
                              </span>
                              <span>•</span>
                              <span className="text-slate-400 capitalize">
                                {msg.recommendation.item.category}
                              </span>
                            </div>

                            {/* Macro Pills */}
                            <div className="grid grid-cols-4 gap-1 mt-2.5 text-center font-mono text-[10px]">
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="block text-slate-400 font-sans text-[9px]">Calories</span>
                                <span className="font-bold text-slate-800">{Math.round(msg.recommendation.item.calories || 340)}</span>
                              </div>
                              <div className="bg-emerald-50 p-1 rounded-lg border border-emerald-200">
                                <span className="block text-emerald-600 font-sans text-[9px]">Protein</span>
                                <span className="font-bold text-emerald-800">{Math.round(msg.recommendation.item.protein || 18)}g</span>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="block text-slate-400 font-sans text-[9px]">Carbs</span>
                                <span className="font-bold text-slate-800">{Math.round(msg.recommendation.item.carbohydrates || 40)}g</span>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="block text-slate-400 font-sans text-[9px]">Fat</span>
                                <span className="font-bold text-slate-800">{Math.round(msg.recommendation.item.fat || 14)}g</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Match Reasons */}
                        {msg.recommendation.reasons && (
                          <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                            {msg.recommendation.reasons.slice(0, 3).map((r: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Quantity Selector + Add to Order Action Bar */}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQty(String(msg.recommendation.item.item_id), -1)}
                                className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-slate-800 min-w-5 text-center">
                                {getQty(String(msg.recommendation.item.item_id))}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQty(String(msg.recommendation.item.item_id), 1)}
                                className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddItem(msg.recommendation.item)}
                              className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add to Order
                            </button>
                          </div>

                          <Link
                            href={`/menu/${msg.recommendation.item.item_id}`}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* 2. VALUE COMBO CARD */}
                    {msg.combo && (
                      <div className="mt-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-left space-y-2.5 shadow-2xs">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                            <Coffee className="w-4 h-4 text-emerald-700" />
                            Suggested Combo Pairing
                          </span>
                          <span className="font-black text-emerald-800 text-sm">
                            ₹{Math.round(msg.combo.total_price)}
                          </span>
                        </div>

                        <p className="text-xs text-emerald-900 font-medium">
                          {msg.combo.description}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-emerald-800 font-mono bg-white/70 px-2.5 py-1.5 rounded-xl border border-emerald-200/60">
                          <span>{msg.combo.total_calories || 420} kcal</span>
                          <span>•</span>
                          <span>{msg.combo.total_protein || 18}g Protein</span>
                          <span>•</span>
                          <span>Ready in ~{msg.combo.max_prep_time || 8} min</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddCombo(msg.combo)}
                          className="w-full py-2 bg-[#0C3B25] hover:bg-[#082819] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          Add Combo to Order (₹{Math.round(msg.combo.total_price)})
                        </button>
                      </div>
                    )}

                    {/* 3. RANKED ALTERNATIVES SHELF */}
                    {msg.alternatives && msg.alternatives.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Other Top Matches ({msg.alternatives.length})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setShowAlternatives((prev) => ({
                                ...prev,
                                [msg.id]: !prev[msg.id]
                              }))
                            }
                            className="text-[11px] font-bold text-emerald-700 hover:underline"
                          >
                            {showAlternatives[msg.id] ? "Hide Alternatives" : "Show Alternatives ▼"}
                          </button>
                        </div>

                        {showAlternatives[msg.id] && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {msg.alternatives.map((alt: any, altIdx: number) => (
                              <div
                                key={altIdx}
                                className="bg-[#F8FAF7] border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={getFoodImage(alt.item.name)}
                                    alt={alt.item.name}
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-slate-800 text-xs truncate">
                                      {alt.item.name}
                                    </h5>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      ₹{Math.round(alt.item.price)} • {alt.item.preparation_time}m • {alt.match_percentage}%
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddItem(alt.item)}
                                  className="p-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg transition-colors shrink-0"
                                  title="Add to order"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. MATCHED INQUIRY ITEMS GRID */}
                    {msg.matchedItems && msg.matchedItems.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.matchedItems.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-[#FAFAF8] border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={getFoodImage(item.name)}
                                  alt={item.name}
                                  className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <h5 className="font-bold text-slate-800 text-xs truncate">
                                    {item.name}
                                  </h5>
                                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                                    <span className="font-black text-[#0C3B25]">₹{Math.round(item.price)}</span>
                                    <span>•</span>
                                    <span>{Math.round(item.protein || 0)}g P</span>
                                    <span>•</span>
                                    <span>{item.preparation_time}m</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddItem(item)}
                                className="px-2.5 py-1 bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contextual Follow-Up Suggestions directly under message */}
                  {!isUser && msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-full">
                      {msg.suggestedFollowups.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => handleSend(chip)}
                          className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 hover:border-emerald-400 font-medium text-[11px] transition-all shadow-2xs flex items-center gap-1"
                        >
                          <span>{chip}</span>
                          <ChevronRight className="w-3 h-3 opacity-60" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}

          {/* Typing / Loading indicator */}
          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0C3B25] text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-700 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-500 font-medium ml-1">BiteBuddy is checking the canteen kitchen...</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Bottom Area: Input Bar & Controls */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white space-y-2">
          {/* Quick Suggestion Chips Header */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {INITIAL_SUGGESTIONS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 text-xs font-medium whitespace-nowrap transition-colors shadow-2xs hover:border-emerald-300 shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Interactive Form Input Bar with Voice Support */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening to your voice..." : "Tell me what you crave, budget, or macros (e.g. ₹120 spicy high protein)..."}
                className={`w-full pl-4 pr-11 py-3 rounded-2xl border text-xs sm:text-sm focus:outline-none focus:ring-2 bg-white shadow-xs transition-all ${
                  isListening
                    ? "border-rose-400 ring-2 ring-rose-200 placeholder:text-rose-500 font-medium"
                    : "border-slate-200 focus:ring-emerald-500"
                }`}
                disabled={loading}
              />

              {/* Voice Input Mic Button */}
              <button
                type="button"
                onClick={toggleSpeech}
                title={isListening ? "Stop listening" : "Speak to BiteBuddy"}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "text-slate-400 hover:text-emerald-700 hover:bg-slate-100"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white flex items-center justify-center shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
