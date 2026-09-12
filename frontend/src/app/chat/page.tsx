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
  Coffee,
  Scale,
  Bug,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { getFoodImage } from "@/data/foodData";
import { useAuth } from "@/context/AuthContext";
import { useOrder } from "@/context/OrderContext";
import { useToast } from "@/components/Toast";
import { FoodItem, DebugInfoData, RecommendationCardData } from "@/types";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  response_type?: string;
  recommendation?: any;
  combo?: any;
  alternatives?: any[];
  recommendations?: any[];
  closest_match?: any;
  failing_constraints?: Record<string, any> | null;
  quick_actions?: string[];
  matchedItems?: any[];
  suggestedFollowups?: string[];
  isClarification?: boolean;
  clarificationType?: string;
  intent?: string;
  comparison?: any;
  orderAction?: any;
  debug_info?: DebugInfoData | null;
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

function DevDebugAccordion({ debugInfo }: { debugInfo: DebugInfoData }) {
  const [isOpen, setIsOpen] = useState(true);
  const [showRemoved, setShowRemoved] = useState(false);

  return (
    <div className="mt-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 overflow-hidden shadow-md text-xs font-mono">
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-850 flex items-center justify-between text-left transition-colors border-b border-slate-800"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-bold text-slate-100 text-[11px] tracking-wide">
            DEV DEBUG TRACE
          </span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 text-[10px] font-sans font-semibold">
            {debugInfo.detected_intent}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[10px] hidden sm:inline">
            {debugInfo.filtered_items?.length || 0} passed • {debugInfo.removed_items?.length || 0} filtered out
          </span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3.5 space-y-3 bg-slate-950 text-[11px] divide-y divide-slate-800/80">
          {/* Step 1: Input & Intent */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              1. Input & Intent Detection
            </div>
            <div className="text-slate-300">
              <span className="text-slate-500">Raw Input: </span>
              <span className="text-emerald-300 font-sans">"{debugInfo.raw_message}"</span>
            </div>
            <div className="text-slate-300">
              <span className="text-slate-500">Detected Intent: </span>
              <span className="text-indigo-300 font-bold">{debugInfo.detected_intent}</span>
            </div>
          </div>

          {/* Step 2: Extracted Constraints (Hard Filter) */}
          <div className="pt-2.5 space-y-1">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              2. Parsed Hard Constraints (Database Filter)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Budget Limit</span>
                <span className={debugInfo.extracted_constraints?.budget != null ? "text-emerald-400 font-bold" : "text-slate-500 italic"}>
                  {debugInfo.extracted_constraints?.budget != null ? `₹${debugInfo.extracted_constraints.budget}` : "null (none)"}
                </span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Max Prep Time</span>
                <span className={debugInfo.extracted_constraints?.max_time != null ? "text-emerald-400 font-bold" : "text-slate-500 italic"}>
                  {debugInfo.extracted_constraints?.max_time != null ? `${debugInfo.extracted_constraints.max_time} mins` : "null (none)"}
                </span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Vegetarian</span>
                <span className={debugInfo.extracted_constraints?.vegetarian != null ? "text-emerald-400 font-bold" : "text-slate-500 italic"}>
                  {debugInfo.extracted_constraints?.vegetarian != null ? (debugInfo.extracted_constraints.vegetarian ? "true (Veg Only)" : "false (Non-Veg)") : "null (any)"}
                </span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 block">Allergies</span>
                <span className={debugInfo.extracted_constraints?.allergies?.length ? "text-rose-400 font-bold" : "text-slate-500 italic"}>
                  {debugInfo.extracted_constraints?.allergies?.length ? debugInfo.extracted_constraints.allergies.join(", ") : "[]"}
                </span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 col-span-2">
                <span className="text-[10px] text-slate-500 block">Excluded Categories</span>
                <span className={debugInfo.extracted_constraints?.excluded_categories?.length ? "text-amber-400 font-bold" : "text-slate-500 italic"}>
                  {debugInfo.extracted_constraints?.excluded_categories?.length ? debugInfo.extracted_constraints.excluded_categories.join(", ") : "[]"}
                </span>
              </div>
            </div>
          </div>

          {/* Step 3: Extracted Preferences */}
          <div className="pt-2.5 space-y-1">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              3. Extracted Soft Preferences (Ranking Weights)
            </div>
            <div className="flex flex-wrap gap-2 pt-1 text-[10px]">
              <span className={`px-2 py-0.5 rounded border ${debugInfo.extracted_preferences?.high_protein ? "bg-emerald-950 text-emerald-300 border-emerald-700" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                High Protein: {String(debugInfo.extracted_preferences?.high_protein ?? false)}
              </span>
              <span className={`px-2 py-0.5 rounded border ${debugInfo.extracted_preferences?.low_calorie ? "bg-emerald-950 text-emerald-300 border-emerald-700" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                Low Calorie: {String(debugInfo.extracted_preferences?.low_calorie ?? false)}
              </span>
              <span className={`px-2 py-0.5 rounded border ${debugInfo.extracted_preferences?.spicy != null ? "bg-amber-950 text-amber-300 border-amber-700" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                Spicy: {debugInfo.extracted_preferences?.spicy != null ? String(debugInfo.extracted_preferences.spicy) : "null"}
              </span>
              <span className={`px-2 py-0.5 rounded border ${debugInfo.extracted_preferences?.beverage_wanted ? "bg-blue-950 text-blue-300 border-blue-700" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                Beverage: {String(debugInfo.extracted_preferences?.beverage_wanted ?? false)}
              </span>
            </div>
          </div>

          {/* Step 4: Candidates & Removed Breakdown */}
          <div className="pt-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                4. Candidates Filtered: {debugInfo.filtered_items?.length || 0} Passed / {debugInfo.removed_items?.length || 0} Filtered Out
              </div>
              {debugInfo.removed_items && debugInfo.removed_items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRemoved(!showRemoved)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                >
                  {showRemoved ? "Hide Filtered Reasons" : `View Reasons (${debugInfo.removed_items.length})`}
                </button>
              )}
            </div>

            {debugInfo.filtered_items && debugInfo.filtered_items.length > 0 ? (
              <div className="text-emerald-400 text-[10px] bg-slate-900/80 p-2 rounded border border-emerald-900/40">
                ✓ Passed candidates: {debugInfo.filtered_items.join(", ")}
              </div>
            ) : (
              <div className="text-rose-400 text-[10px] bg-rose-950/40 p-2 rounded border border-rose-900/50 font-bold">
                ⚠️ Zero canteen items passed all hard constraints!
              </div>
            )}

            {showRemoved && debugInfo.removed_items && debugInfo.removed_items.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1 bg-slate-900 p-2 rounded border border-slate-800 text-[10px]">
                {debugInfo.removed_items.map((r, rIdx) => (
                  <div key={rIdx} className="flex items-start justify-between gap-2 border-b border-slate-800/60 pb-1">
                    <span className="text-slate-300 font-semibold">{r.name}</span>
                    <span className="text-rose-400 text-right">{r.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 5: Final Ranking Scores */}
          {debugInfo.final_scores && debugInfo.final_scores.length > 0 && (
            <div className="pt-2.5 space-y-1">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                5. Deterministic Match Scores
              </div>
              <div className="space-y-1 pt-1">
                {debugInfo.final_scores.slice(0, 5).map((sc, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded border border-slate-800 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-bold">#{sIdx + 1}</span>
                      <span className="text-slate-200 font-medium">{sc.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">{sc.match_percentage}%</span>
                      <span className="text-slate-500">score: {sc.score.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Top 3 Recommendations */}
          <div className="pt-2.5 space-y-1">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              6. Final Recommendations (Strictly ≤ 3 items)
            </div>
            <div className="text-slate-200 text-[10px] font-semibold">
              {debugInfo.top_3 && debugInfo.top_3.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">Items:</span>
                  <span className="bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/60">
                    {debugInfo.top_3.join(" • ")}
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 italic">No recommendations (0 matches)</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [devDebugMode, setDevDebugMode] = useState<boolean>(false);

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

      // Auto-trigger order tray addition if order_action returned
      if (data.order_action && data.order_action.item) {
        addToOrder(data.order_action.item, data.order_action.quantity || 1);
        showToast(`Added ${data.order_action.item.name} to order tray! 🛒`);
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.reply_text,
        response_type: data.response_type,
        recommendation: data.recommendation,
        combo: data.combo,
        alternatives: data.alternatives,
        recommendations: data.recommendations,
        closest_match: data.closest_match,
        failing_constraints: data.failing_constraints,
        quick_actions: data.quick_actions,
        matchedItems: data.matched_items,
        suggestedFollowups: data.suggested_followups,
        isClarification: data.is_clarification,
        clarificationType: data.clarification_type,
        intent: data.intent,
        comparison: data.comparison,
        orderAction: data.order_action,
        debug_info: data.debug_info,
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
            {/* Developer Debug Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !devDebugMode;
                setDevDebugMode(next);
                showToast(next ? "Developer Debug Mode Enabled 🛠️" : "Developer Debug Mode Disabled");
              }}
              title={devDebugMode ? "Developer Debug Mode: ON" : "Developer Debug Mode: OFF"}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                devDebugMode
                  ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-transparent"
              }`}
            >
              <Bug className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Debug</span>
              <span className={`w-2 h-2 rounded-full ${devDebugMode ? "bg-amber-600 animate-pulse" : "bg-slate-400"}`} />
            </button>

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
            const primaryRec = (msg.recommendations && msg.recommendations.length > 0) ? msg.recommendations[0] : msg.recommendation;
            const additionalRecs = (msg.recommendations && msg.recommendations.length > 1) ? msg.recommendations.slice(1, 3) : (msg.alternatives || []);
            const isNoMatch = msg.response_type === "no_match" || (!primaryRec && Boolean(msg.failing_constraints));

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

                    {msg.intent === "unavailable_item" && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-2.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 w-fit">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Item Unavailable • Fresh Alternatives Recommended</span>
                      </div>
                    )}

                    {msg.intent === "off_menu" && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900 mb-2.5 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/80 w-fit">
                        <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span>Not On Canteen Menu • Fresh Alternatives Recommended</span>
                      </div>
                    )}

                    {msg.intent === "irrelevant" && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 w-fit">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>BiteBuddy Scope Notice</span>
                      </div>
                    )}

                    {/* Main Reply Text */}
                    <div className="prose prose-sm max-w-none text-slate-800 font-normal">
                      {msg.text}
                    </div>

                    {/* Order Confirmation Notification */}
                    {msg.orderAction && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>
                            Added <strong>{msg.orderAction.quantity}x {msg.orderAction.item.name}</strong> (₹{Math.round(msg.orderAction.item.price)}) to your tray!
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={toggleDrawer}
                          className="px-2.5 py-1 bg-[#0C3B25] text-white text-[11px] font-bold rounded-lg hover:bg-[#082819] transition-all shadow-2xs shrink-0"
                        >
                          View Tray
                        </button>
                      </div>
                    )}

                    {/* Side-by-Side Food Comparison Table (Section 11) */}
                    {msg.comparison && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 bg-[#FAFAF8] rounded-2xl p-3.5 sm:p-4 border border-indigo-200 text-left space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-700 text-white tracking-wide uppercase">
                            <Scale className="w-3 h-3 text-indigo-200" />
                            Side-by-Side Comparison
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                              <tr>
                                <th className="p-2.5">Attribute</th>
                                <th className="p-2.5 text-[#0C3B25]">{msg.comparison.dish_a.name}</th>
                                <th className="p-2.5 text-[#0C3B25]">{msg.comparison.dish_b.name}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                              <tr>
                                <td className="p-2.5 font-sans font-medium text-slate-500">Price</td>
                                <td className="p-2.5 font-bold text-slate-900">₹{Math.round(msg.comparison.dish_a.price)}</td>
                                <td className="p-2.5 font-bold text-slate-900">₹{Math.round(msg.comparison.dish_b.price)}</td>
                              </tr>
                              <tr>
                                <td className="p-2.5 font-sans font-medium text-slate-500">Prep Time</td>
                                <td className="p-2.5 text-slate-800">{msg.comparison.dish_a.preparation_time} mins</td>
                                <td className="p-2.5 text-slate-800">{msg.comparison.dish_b.preparation_time} mins</td>
                              </tr>
                              <tr>
                                <td className="p-2.5 font-sans font-medium text-slate-500">Calories</td>
                                <td className="p-2.5 text-slate-800">{Math.round(msg.comparison.dish_a.calories || 0)} kcal</td>
                                <td className="p-2.5 text-slate-800">{Math.round(msg.comparison.dish_b.calories || 0)} kcal</td>
                              </tr>
                              <tr>
                                <td className="p-2.5 font-sans font-medium text-slate-500">Protein</td>
                                <td className="p-2.5 font-bold text-emerald-700">{Math.round(msg.comparison.dish_a.protein || 0)}g</td>
                                <td className="p-2.5 font-bold text-emerald-700">{Math.round(msg.comparison.dish_b.protein || 0)}g</td>
                              </tr>
                              <tr>
                                <td className="p-2.5 font-sans font-medium text-slate-500">Carbs</td>
                                <td className="p-2.5 text-slate-800">{Math.round(msg.comparison.dish_a.carbohydrates || 0)}g</td>
                                <td className="p-2.5 text-slate-800">{Math.round(msg.comparison.dish_b.carbohydrates || 0)}g</td>
                              </tr>
                              <tr>
                                <td className="p-2.5 font-sans font-medium text-slate-500">Fat</td>
                                <td className="p-2.5 text-slate-800">{Math.round(msg.comparison.dish_a.fat || 0)}g</td>
                                <td className="p-2.5 text-slate-800">{Math.round(msg.comparison.dish_b.fat || 0)}g</td>
                              </tr>
                              <tr>
                                <td className="p-2.5 font-sans font-medium text-slate-500">Diet</td>
                                <td className="p-2.5 font-sans">{msg.comparison.dish_a.vegetarian ? "🌱 Pure Veg" : "🍗 Non-Veg"}</td>
                                <td className="p-2.5 font-sans">{msg.comparison.dish_b.vegetarian ? "🌱 Pure Veg" : "🍗 Non-Veg"}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAddItem(msg.comparison.dish_a)}
                            className="w-full py-2 bg-[#0C3B25] hover:bg-[#082819] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs truncate px-2"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">Order {msg.comparison.dish_a.name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddItem(msg.comparison.dish_b)}
                            className="w-full py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs truncate px-2"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                            <span className="truncate">Order {msg.comparison.dish_b.name}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Dev Debug Trace Accordion */}
                    {devDebugMode && msg.debug_info && (
                      <DevDebugAccordion debugInfo={msg.debug_info} />
                    )}

                    {/* NO_MATCH State & Recovery Actions */}
                    {isNoMatch && (
                      <div className="mt-3.5 p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3 text-xs">
                        <div className="flex items-center gap-2 text-amber-900 font-bold">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>No Canteen Items Match All Exact Constraints</span>
                        </div>

                        {/* Failing constraints breakdown */}
                        {msg.failing_constraints && (
                          <div className="bg-white/90 rounded-xl p-2.5 border border-amber-200 text-amber-900 space-y-1 text-[11px]">
                            <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wide">
                              Filter Diagnosis:
                            </span>
                            {msg.failing_constraints.budget_limit && (
                              <div className="flex items-center justify-between">
                                <span>Budget limit (₹{msg.failing_constraints.budget_limit.user_limit}):</span>
                                <span className="font-semibold text-rose-700">
                                  Cheapest item is ₹{msg.failing_constraints.budget_limit.min_price_available}
                                </span>
                              </div>
                            )}
                            {msg.failing_constraints.time_limit && (
                              <div className="flex items-center justify-between">
                                <span>Prep time ({msg.failing_constraints.time_limit.user_limit}m):</span>
                                <span className="font-semibold text-rose-700">
                                  Fastest item takes {msg.failing_constraints.time_limit.min_prep_time_available}m
                                </span>
                              </div>
                            )}
                            {msg.failing_constraints.diet && (
                              <div className="flex items-center justify-between">
                                <span>Diet constraint:</span>
                                <span className="font-semibold text-rose-700">
                                  {msg.failing_constraints.diet.vegetarian ? "Pure Vegetarian" : "Non-Veg"}
                                </span>
                              </div>
                            )}
                            {msg.failing_constraints.allergies && (
                              <div className="flex items-center justify-between">
                                <span>Allergen filters:</span>
                                <span className="font-semibold text-rose-700">
                                  {msg.failing_constraints.allergies.join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Recovery Quick Action Buttons */}
                        {msg.quick_actions && msg.quick_actions.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                              Suggested Adjustments:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {msg.quick_actions.map((act: string, aIdx: number) => (
                                <button
                                  key={aIdx}
                                  type="button"
                                  onClick={() => handleSend(act)}
                                  className="px-3 py-1.5 bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-950 font-bold rounded-xl text-xs transition-colors shadow-2xs flex items-center gap-1.5"
                                >
                                  <span>{act}</span>
                                  <ArrowRight className="w-3 h-3 text-amber-700" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CLOSEST MATCH (When 0 items matched exact constraints) */}
                    {!primaryRec && msg.closest_match && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 bg-[#FAFAF8] rounded-2xl p-3.5 sm:p-4 border border-indigo-200 text-left space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-700 text-white tracking-wide uppercase">
                            <Sparkles className="w-3 h-3 text-indigo-200" />
                            CLOSEST AVAILABLE MATCH ({msg.closest_match.match_percentage}%)
                          </span>
                          <span className="text-base font-black text-[#0C3B25]">
                            ₹{Math.round(msg.closest_match.item.price)}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <img
                            src={getFoodImage(msg.closest_match.item.name)}
                            alt={msg.closest_match.item.name}
                            className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                              {msg.closest_match.item.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                              <span className="flex items-center gap-1 text-slate-700 font-medium">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                {msg.closest_match.item.preparation_time}m prep
                              </span>
                              <span>•</span>
                              <span className={msg.closest_match.item.vegetarian ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
                                {msg.closest_match.item.vegetarian ? "🌱 Pure Veg" : "🍗 Non-Veg"}
                              </span>
                              <span>•</span>
                              <span className="text-slate-400 capitalize">
                                {msg.closest_match.item.category}
                              </span>
                            </div>

                            {/* Macro Pills */}
                            <div className="grid grid-cols-4 gap-1 mt-2.5 text-center font-mono text-[10px]">
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="block text-slate-400 font-sans text-[9px]">Calories</span>
                                <span className="font-bold text-slate-800">{Math.round(msg.closest_match.item.calories || 340)}</span>
                              </div>
                              <div className="bg-emerald-50 p-1 rounded-lg border border-emerald-200">
                                <span className="block text-emerald-600 font-sans text-[9px]">Protein</span>
                                <span className="font-bold text-emerald-800">{Math.round(msg.closest_match.item.protein || 18)}g</span>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="block text-slate-400 font-sans text-[9px]">Carbs</span>
                                <span className="font-bold text-slate-800">{Math.round(msg.closest_match.item.carbohydrates || 40)}g</span>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="block text-slate-400 font-sans text-[9px]">Fat</span>
                                <span className="font-bold text-slate-800">{Math.round(msg.closest_match.item.fat || 14)}g</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {msg.closest_match.reasons && (
                          <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                            {msg.closest_match.reasons.slice(0, 3).map((r: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => handleAddItem(msg.closest_match.item)}
                            className="px-4 py-2 bg-[#0C3B25] hover:bg-[#082819] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            Add Closest Match to Order
                          </button>

                          <Link
                            href={`/menu/${msg.closest_match.item.item_id}`}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* 1. BEST MATCH SPOTLIGHT CARD (Strictly ≤ 3 items total) */}
                    {primaryRec && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 bg-[#FAFAF8] rounded-2xl p-3.5 sm:p-4 border border-emerald-200 text-left space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white tracking-wide uppercase">
                            <Sparkles className="w-3 h-3 text-emerald-200" />
                            BEST MATCH ({primaryRec.match_percentage}%)
                          </span>
                          <span className="text-base font-black text-[#0C3B25]">
                            ₹{Math.round(primaryRec.item.price)}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <img
                            src={getFoodImage(primaryRec.item.name)}
                            alt={primaryRec.item.name}
                            className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                              {primaryRec.item.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                              <span className="flex items-center gap-1 text-slate-700 font-medium">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                {primaryRec.item.preparation_time}m prep
                              </span>
                              <span>•</span>
                              <span className={primaryRec.item.vegetarian ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
                                {primaryRec.item.vegetarian ? "🌱 Pure Veg" : "🍗 Non-Veg"}
                              </span>
                              <span>•</span>
                              <span className="text-slate-400 capitalize">
                                {primaryRec.item.category}
                              </span>
                            </div>

                            {/* Macro Pills */}
                            <div className="grid grid-cols-4 gap-1 mt-2.5 text-center font-mono text-[10px]">
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="block text-slate-400 font-sans text-[9px]">Calories</span>
                                <span className="font-bold text-slate-800">{Math.round(primaryRec.item.calories || 340)}</span>
                              </div>
                              <div className="bg-emerald-50 p-1 rounded-lg border border-emerald-200">
                                <span className="block text-emerald-600 font-sans text-[9px]">Protein</span>
                                <span className="font-bold text-emerald-800">{Math.round(primaryRec.item.protein || 18)}g</span>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="block text-slate-400 font-sans text-[9px]">Carbs</span>
                                <span className="font-bold text-slate-800">{Math.round(primaryRec.item.carbohydrates || 40)}g</span>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-200">
                                <span className="block text-slate-400 font-sans text-[9px]">Fat</span>
                                <span className="font-bold text-slate-800">{Math.round(primaryRec.item.fat || 14)}g</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Match Reasons */}
                        {primaryRec.reasons && (
                          <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                            {primaryRec.reasons.slice(0, 3).map((r: string, idx: number) => (
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
                                onClick={() => updateQty(String(primaryRec.item.item_id), -1)}
                                className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-slate-800 min-w-5 text-center">
                                {getQty(String(primaryRec.item.item_id))}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQty(String(primaryRec.item.item_id), 1)}
                                className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddItem(primaryRec.item)}
                              className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add to Order
                            </button>
                          </div>

                          <Link
                            href={`/menu/${primaryRec.item.item_id}`}
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

                    {/* 3. RANKED ADDITIONAL RECOMMENDATIONS (#2 and #3) */}
                    {additionalRecs && additionalRecs.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Other Top Matches ({additionalRecs.length})
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
                            {showAlternatives[msg.id] ? "Hide Matches" : "Show Matches ▼"}
                          </button>
                        </div>

                        {showAlternatives[msg.id] !== false && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {additionalRecs.map((alt: any, altIdx: number) => (
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
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] font-black text-emerald-700">#{altIdx + 2}</span>
                                      <h5 className="font-bold text-slate-800 text-xs truncate">
                                        {alt.item.name}
                                      </h5>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono block truncate">
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
