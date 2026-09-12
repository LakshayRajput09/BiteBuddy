"use client";

import React, { useState, useEffect } from "react";
import { User, Sparkles, X, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";

export default function NamePromptModal() {
  const { user, isNameModalOpen, setIsNameModalOpen, updateUserName } = useAuth();
  const { showToast } = useToast();
  const [nameInput, setNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setNameInput(user.name);
    }
  }, [user]);

  if (!isNameModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      showToast("Please enter a valid name.", "error");
      return;
    }

    setIsSaving(true);
    try {
      await updateUserName(trimmed);
      showToast(`Welcome, ${trimmed}! Your profile has been updated.`);
      setIsNameModalOpen(false);
    } catch (e) {
      showToast("Failed to update name.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 relative">
        <button
          type="button"
          onClick={() => setIsNameModalOpen(false)}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Personalize Your Experience</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            What should we call you?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter your name so BiteBuddy can personalize your meal recommendations, receipts, and orders.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Your Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Lakshay, Priya, Alex, Rahul"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium text-slate-900"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNameModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Keep as &ldquo;{user?.name || "Student"}&rdquo;
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save & Continue"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

