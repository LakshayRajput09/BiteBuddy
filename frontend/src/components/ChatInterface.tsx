"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, ChatResponseData, RecommendationCardData, MealCombinationData } from "@/types";
import { RecommendationCard } from "./RecommendationCard";
import { ComboCard } from "./ComboCard";
import { AlternativesList } from "./AlternativesList";
import {
  Send,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  SlidersHorizontal,
  Bot
} from "lucide-react";

interface Props {
  apiUrl: string;
  onOpenMenu?: () => void;
  onRecommendationUpdate?: (
    rec: RecommendationCardData | null,
    combo: MealCombinationData | null
  ) => void;
  externalMessage?: string | null;
  onClearExternalMessage?: () => void;
}

const INITIAL_PROMPTS = [
  "I'm tired, have ₹120, want something spicy and vegetarian, and only have 10 minutes.",
  "Quick snack under ₹50 ready in 5 minutes",
  "100% plant-based vegan lunch under ₹80",
  "Comforting meal for exam stress under ₹100"
];

const REFINE_SUGGESTIONS = [
  "I don't want noodles",
  "Actually make it vegan",
  "Lower budget to ₹60",
  "I have 15 minutes now",
  "Exclude dairy / cheese",
  "Make it spicy"
];

export const ChatInterface: React.FC<Props> = ({
  apiUrl,
  onOpenMenu,
  onRecommendationUpdate,
  externalMessage,
  onClearExternalMessage
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "👋 Hi there! I'm your AI College Canteen Assistant.\n\nTell me what you're craving, your budget, dietary preference, break time, or mood — or use the interactive filters on the left!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [activePreferences, setActivePreferences] = useState<Record<string, any> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle message triggered externally from filter controls
  useEffect(() => {
    if (externalMessage) {
      handleSend(externalMessage);
      if (onClearExternalMessage) {
        onClearExternalMessage();
      }
    }
  }, [externalMessage]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    setInput("");

    // Add user message to thread
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          session_id: sessionId || undefined
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: ChatResponseData = await res.json();

      if (data.session_id) {
        setSessionId(data.session_id);
      }
      if (data.extracted_preferences) {
        setActivePreferences(data.extracted_preferences);
      }

      // Notify parent about new recommendation for the Spotlight
      if (onRecommendationUpdate && data.recommendation) {
        onRecommendationUpdate(data.recommendation, data.combo || null);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: data.reply_text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        recommendation: data.recommendation,
        combo: data.combo,
        alternatives: data.alternatives,
        isClarification: data.is_clarification,
        clarificationType: data.clarification_type,
        extractedPreferences: data.extracted_preferences
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        text: "Sorry, I couldn't reach the canteen server. Please make sure the backend is running on http://127.0.0.1:8000.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = () => {
    setSessionId("");
    setActivePreferences(null);
    if (onRecommendationUpdate) {
      onRecommendationUpdate(null, null);
    }
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        text: "Session reset! What would you like to eat today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
      {/* Session State Header */}
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline">Active Context:</span>
          </div>

          {activePreferences ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {activePreferences.budget && (
                <span className="bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                  Budget: ₹{activePreferences.budget}
                </span>
              )}
              {activePreferences.diet && (
                <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md text-[11px] capitalize">
                  {activePreferences.diet}
                </span>
              )}
              {activePreferences.time_limit && (
                <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                  ⏱️ {activePreferences.time_limit}m
                </span>
              )}
              {activePreferences.taste && activePreferences.taste.length > 0 && (
                <span className="bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                  🌶️ {activePreferences.taste.join(", ")}
                </span>
              )}
              {activePreferences.exclusions && activePreferences.exclusions.length > 0 && (
                <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[11px] line-through">
                  🚫 {activePreferences.exclusions.join(", ")}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 italic text-[11px]">No active constraints — type or use filters</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleResetSession}
            title="Reset conversation and clear session state"
            className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors text-[11px] font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
        {messages.map(msg => {
          const isUser = msg.sender === "user";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {!isUser && <Bot className="w-3.5 h-3.5 text-orange-600" />}
                <span className="text-[11px] font-semibold text-slate-400">
                  {isUser ? "You" : "CampusBite Assistant"}
                </span>
                <span className="text-[10px] text-slate-300">• {msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? "bg-slate-900 text-white rounded-tr-none shadow-sm"
                    : msg.isClarification
                    ? "bg-amber-50/95 text-amber-950 border border-amber-300/80 rounded-tl-none shadow-sm"
                    : "bg-white text-slate-900 border border-slate-200 rounded-tl-none shadow-sm"
                }`}
              >
                {/* Clarification Callout Icon */}
                {msg.isClarification && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 pb-1.5 border-b border-amber-200/70">
                    {msg.clarificationType === "conflict" ? (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>
                      {msg.clarificationType === "conflict"
                        ? "Contradiction Detected"
                        : msg.clarificationType === "missing_budget"
                        ? "Approximate Budget Needed"
                        : "Clarification Needed"}
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Main Recommendation Card */}
                {msg.recommendation && (
                  <RecommendationCard data={msg.recommendation} />
                )}

                {/* Value Combo Pairing */}
                {msg.combo && <ComboCard combo={msg.combo} />}

                {/* Ranked Alternatives */}
                {msg.alternatives && msg.alternatives.length > 0 && (
                  <AlternativesList
                    alternatives={msg.alternatives}
                    onSelectAlternative={itemName =>
                      handleSend(`Can you switch my recommendation to ${itemName}?`)
                    }
                  />
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-500">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-orange-600 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>Searching canteen menu & calculating deterministic matches...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Refinements & Prompts */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap pl-1">
            {messages.length <= 2 ? "Popular queries:" : "Quick refine:"}
          </span>
          {(messages.length <= 2 ? INITIAL_PROMPTS : REFINE_SUGGESTIONS).map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-900 border border-slate-200/80 transition-colors whitespace-nowrap text-xs font-medium"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 mt-1"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything, e.g. 'I want spicy noodles under ₹80' or 'no dairy'..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm flex items-center gap-1.5 shadow-sm transition-all flex-shrink-0"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
