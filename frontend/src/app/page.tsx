"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Compass,
  Wallet,
  ShieldCheck,
  Clock,
  ChevronRight,
  UtensilsCrossed,
  Heart,
  CheckCircle2,
  Smile
} from "lucide-react";

export default function LandingPage() {
  const highlights = [
    {
      icon: <Compass className="w-5 h-5 text-emerald-600" />,
      title: "Personalized Recommendations",
      desc: "Tailored to your cravings, mood, and hunger levels in real time."
    },
    {
      icon: <Wallet className="w-5 h-5 text-amber-600" />,
      title: "Budget Friendly",
      desc: "Delicious meals and combos strictly calculated within your pocket money."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      title: "Dietary Aware",
      desc: "100% verified pure veg, vegan, jain, and allergy exclusions from ingredients."
    },
    {
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      title: "Saves Time",
      desc: "Filter by 5-10 minute break times so you never miss your next lecture."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Tell Us",
      desc: "Share your budget, mood, dietary preferences, and cravings naturally.",
      icon: "💬",
      color: "bg-amber-100 text-amber-800"
    },
    {
      num: "02",
      title: "We Understand",
      desc: "Our AI interprets your request and extracts exact nutritional and time constraints.",
      icon: "🧠",
      color: "bg-emerald-100 text-emerald-800"
    },
    {
      num: "03",
      title: "Get Recommendations",
      desc: "Receive ranked meal combos with transparent checklist explanations.",
      icon: "🍱",
      color: "bg-blue-100 text-blue-800"
    },
    {
      num: "04",
      title: "Enjoy Your Meal",
      desc: "Head to the canteen counter and enjoy fresh, delicious food without the guesswork.",
      icon: "😋",
      color: "bg-rose-100 text-rose-800"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-emerald-900 text-xs font-bold tracking-wide shadow-xs border-emerald-300/50">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 animate-pulse" />
              <span>AI-powered college food assistant</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Good Food. <br />
              <span className="text-emerald-600 drop-shadow-xs">Smarter</span> Choices.
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Tell us your budget, mood, cravings, and dietary preferences — we'll suggest the perfect meal for you with real-time canteen inventory.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/chat"
                className="px-6 py-3.5 rounded-2xl liquid-glass-button font-bold text-sm shadow-lg flex items-center gap-2"
              >
                <span>Start Exploring</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/how-it-works"
                className="px-6 py-3.5 rounded-2xl liquid-glass-pill text-slate-800 font-bold text-sm shadow-xs transition-all hover:scale-105"
              >
                How It Works
              </Link>
            </div>

            {/* Trust Indicator */}
            <div className="pt-4 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Tested on real campus menus • No guesswork • 100% Deterministic Safety</span>
            </div>
          </div>

          {/* Right Column: Hero Graphic Visual */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Visual Container with Liquid Glass Frame */}
            <div className="relative w-full max-w-md aspect-[4/4.5] rounded-3xl overflow-hidden shadow-2xl border border-white/90 liquid-glass p-6 flex flex-col justify-between">
              {/* Badge Sticker in top right */}
              <div className="self-end liquid-glass-pill shadow-md px-3.5 py-1.5 rounded-2xl border border-amber-300/80 text-xs font-black text-amber-950 flex items-center gap-1.5 rotate-2">
                <span>Good Food, Brighter Days!</span>
                <span>✨</span>
              </div>

              {/* Student illustration & Canteen Food Graphic */}
              <div className="relative flex-1 flex flex-col items-center justify-center my-2">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-emerald-700/10 flex items-center justify-center border-2 border-white/60 shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80"
                    alt="College students enjoying fresh food"
                    className="w-44 h-44 sm:w-52 sm:h-52 rounded-full object-cover shadow-lg border-4 border-white/90"
                  />
                </div>

                {/* Floating Meal Tray Card */}
                <div className="absolute -bottom-4 liquid-glass-card p-3.5 shadow-xl flex items-center gap-3 w-[90%] animate-in fade-in zoom-in-95 duration-500">
                  <span className="text-3xl p-2 bg-emerald-50/80 rounded-xl border border-emerald-100">🌯</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">Paneer Kathi Roll</span>
                      <span className="text-xs font-extrabold text-emerald-700">₹65</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>🌱 Pure Veg</span>
                      <span>•</span>
                      <span>⏱️ 8 mins</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">94% Fit</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quote Banner */}
              <div className="liquid-glass-pill rounded-xl p-2.5 text-center text-xs font-semibold text-slate-700 mt-6">
                💡 BiteBuddy calculates budget, break time, and diet before suggesting.
              </div>
            </div>
          </div>
        </div>

        {/* Four Feature Highlights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 pt-8 border-t border-slate-200/50">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="liquid-glass-card p-5 text-left"
            >
              <div className="p-2.5 rounded-xl bg-white/70 w-fit mb-3 border border-white/80 shadow-2xs">
                {item.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section className="bg-white/40 backdrop-blur-xl py-16 px-4 sm:px-8 border-y border-white/60" id="about">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div>
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-widest liquid-glass-pill px-3 py-1 rounded-full border-emerald-300/60">
              Simple & Fast
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
              How BiteBuddy Works
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
              From hungry student craving to your hot meal in 4 easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="liquid-glass-card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${step.color}`}>
                      {step.num}
                    </span>
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Final Call to Action */}
          <div className="liquid-glass-dark rounded-3xl p-8 sm:p-12 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl text-left border border-white/20">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Not sure what to eat?</h3>
              <p className="text-sm text-emerald-100 max-w-lg">
                Tell BiteBuddy how much money you have and how fast you need it — we'll do the rest!
              </p>
            </div>
            <Link
              href="/chat"
              className="px-6 py-3.5 rounded-2xl liquid-glass-pill bg-white/95 text-emerald-950 font-extrabold text-sm shadow-md hover:bg-white hover:scale-105 transition-all flex items-center gap-2 flex-shrink-0"
            >
              <span>Ask BiteBuddy</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
