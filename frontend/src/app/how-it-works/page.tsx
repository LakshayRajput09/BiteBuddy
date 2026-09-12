"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  Database,
  Calculator,
  CheckCircle2
} from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      icon: "💬",
      title: "Tell Us",
      desc: "Share your budget, current mood, dietary constraints, and specific cravings naturally in conversational English."
    },
    {
      num: "02",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      icon: "🧠",
      title: "We Understand",
      desc: "Our AI converts your message into structured preferences: budget limit, dietary rules, spiciness, break time, and exclusions."
    },
    {
      num: "03",
      badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
      icon: "🍱",
      title: "Get Recommendations",
      desc: "Deterministic Python algorithms filter real-time inventory and rank the best meal + beverage combos with transparent checklist explanations."
    },
    {
      num: "04",
      badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
      icon: "😋",
      title: "Enjoy Your Meal",
      desc: "Head straight to the canteen counter and get your hot food within your lecture break without standing in endless queues."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-widest">
          Transparent AI
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          How It Works
        </h1>
        <p className="text-sm text-slate-500">
          Get personalized food recommendations in just a few steps.
        </p>
      </div>

      {/* 4-Step Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 text-left"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${step.badgeColor}`}>
                  {step.num}
                </span>
                <span className="text-3xl">{step.icon}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                {step.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Technical Architecture & Deterministic Safety Explainer */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-10 space-y-6">
        <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Why BiteBuddy is Safer than Generic AI Chatbots</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-left">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 w-fit">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">AI Used Only for Extraction</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              The LLM parses your conversational prompt into structured criteria. It never does financial math or dietary guessing on its own.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 w-fit">
              <Database className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Real Canteen Inventory</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Filtered against actual dishes currently in stock at your college canteen, with exact pricing and live kitchen prep times.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800 w-fit">
              <Calculator className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Deterministic Safety Math</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dietary certifications (pure veg, vegan, jain) and maximum budget limits are strictly enforced in Python code.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 text-left">
            Ready to taste the difference on campus?
          </div>
          <Link
            href="/chat"
            className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Try BiteBuddy Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

