"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Utensils, Sparkles, AlertCircle, Bot, User as UserIcon } from "lucide-react";
import { usePathname } from "next/navigation";

interface MatchedItem {
  id: number;
  name: string;
  price: number;
  cuisine_tags: string[];
  dietary_tags: string[];
  available_time: string;
  popularity_score: number;
  ingredients: string[];
  description: string;
  spice_level: string;
}

interface WidgetMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  matched_items?: MatchedItem[];
  intent?: string;
  timestamp: string;
}

const SUGGESTIONS = [
  "What's under ₹50 and veg?",
  "Is the fried rice spicy?",
  "I want something light and not too expensive",
  "Any high protein rolls?",
];

export default function CanteenChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Hi! I'm your **Canteen AI Assistant**. Ask me anything about our canteen menu or ask for dish recommendations!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Don't render floating widget on the dedicated full-screen /chat page
  if (pathname === "/chat") {
    return null;
  }

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: WidgetMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/canteen/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const botMsg: WidgetMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: data.reply_text || "Here is what I found on the menu!",
        matched_items: data.matched_items || [],
        intent: data.intent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Widget chat error:", err);
      const errorMsg: WidgetMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "⚠️ Sorry, I couldn't reach the canteen server. Please make sure the backend is running on port 8000.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 liquid-glass-button bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 border border-white/40"
          aria-label="Open Canteen Assistant"
        >
          <Utensils className="w-6 h-6 transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-xs"></span>
          </span>
        </button>
      )}

      {/* Expanded Chat Widget Window */}
      {isOpen && (
        <div className="flex flex-col w-[360px] sm:w-[400px] h-[540px] liquid-glass rounded-3xl shadow-2xl border border-white/90 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800/90 to-emerald-700/90 backdrop-blur-xl p-4 text-white flex items-center justify-between shadow-xs border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  BiteBuddy AI Assistant
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                </h3>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  Grounded Menu Q&A & Recommendations
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              aria-label="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white/40 backdrop-blur-md">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border border-emerald-200 shadow-2xs">
                    🍽️
                  </div>
                )}
                <div className={`max-w-[82%] space-y-2`}>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "liquid-glass-button bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-br-none shadow-xs"
                        : "liquid-glass text-slate-800 rounded-bl-none shadow-xs"
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Render Matched Food Cards */}
                    {msg.matched_items && msg.matched_items.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2">
                        {msg.matched_items.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 bg-white/70 backdrop-blur-md rounded-xl border border-white/80 hover:border-emerald-300 transition-all shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-xs text-slate-900 line-clamp-1">{item.name}</span>
                              <span className="font-black text-emerald-700 text-xs shrink-0">₹{item.price}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 flex-wrap">
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold">{item.dietary_tags.join(", ")}</span>
                              <span>•</span>
                              <span>⏱️ {item.available_time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] text-slate-400 block px-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 p-2.5 bg-white/60 backdrop-blur-md rounded-xl text-slate-500 text-xs w-fit border border-white/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] ml-1">Checking kitchen...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-3 py-2 bg-white/50 backdrop-blur-md border-t border-white/60 overflow-x-auto whitespace-nowrap flex gap-1.5 text-[11px] scrollbar-none">
            {SUGGESTIONS.map((sugg) => (
              <button
                key={sugg}
                type="button"
                onClick={() => handleSend(sugg)}
                className="px-2.5 py-1 rounded-full liquid-glass-pill text-slate-700 hover:text-emerald-900 transition-all hover:scale-105 shrink-0"
              >
                {sugg}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white/70 backdrop-blur-xl border-t border-white/60 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about prices, veg options, or recommendations..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl liquid-glass-input text-slate-800 placeholder-slate-400"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2.5 liquid-glass-button disabled:opacity-40 text-white rounded-xl shadow-xs transition-all"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

