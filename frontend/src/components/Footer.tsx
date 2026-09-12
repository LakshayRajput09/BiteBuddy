"use client";

import React from "react";
import Link from "next/link";
import { UtensilsCrossed, Heart, ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200/80 py-12 px-4 sm:px-8 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="text-base font-black text-slate-900 tracking-tight">BiteBuddy</span>
          </div>
          <p className="text-slate-500 max-w-sm leading-relaxed">
            Your personal AI college canteen assistant. Bringing intelligent, dietary-safe, and budget-friendly meal recommendations to hungry students everyday.
          </p>
          <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 w-fit font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Verified Canteen Database Math</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Explore</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="hover:text-emerald-700 transition-colors">Home</Link>
            </li>
            <li>
              <Link href="/menu" className="hover:text-emerald-700 transition-colors">Canteen Menu</Link>
            </li>
            <li>
              <Link href="/chat" className="hover:text-emerald-700 transition-colors">AI Chat Assistant</Link>
            </li>
            <li>
              <Link href="/recommendations" className="hover:text-emerald-700 transition-colors">Recommendations</Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-emerald-700 transition-colors">How It Works</Link>
            </li>
          </ul>
        </div>

        {/* Canteen Operations */}
        <div>
          <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Canteen Staff</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/admin" className="hover:text-emerald-700 transition-colors">Admin Dashboard</Link>
            </li>
            <li>
              <Link href="/preferences" className="hover:text-emerald-700 transition-colors">Student Dietary Settings</Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-emerald-700 transition-colors">Sign In / Register</Link>
            </li>
            <li className="text-slate-400">
              Timings: 8:00 AM — 9:30 PM
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
        <div>
          © {new Date().getFullYear()} BiteBuddy. Good Food. Smarter Choices.
        </div>
        <div className="flex items-center gap-1">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>for college campus food lovers</span>
        </div>
      </div>
    </footer>
  );
};

