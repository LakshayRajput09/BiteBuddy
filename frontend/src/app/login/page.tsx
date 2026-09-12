"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UtensilsCrossed, Lock, Mail, User, Sparkles, Store, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { UserRole } from "@/types";

export default function LoginPage() {
  const { login, register, demoLogin } = useAuth();
  const { showToast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [canteenName, setCanteenName] = useState("");
  const [demoName, setDemoName] = useState("Lakshay");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please enter email and password.", "error");
      return;
    }

    setIsSubmitting(true);
    if (isSignUp) {
      if (!name) {
        showToast("Please enter your full name.", "error");
        setIsSubmitting(false);
        return;
      }
      const res = await register(name, email, password, selectedRole);
      if (res.success) {
        showToast(`Account created as ${selectedRole === "student" ? "Student" : "Cafeteria Owner"}!`);
      } else {
        showToast(res.error || "Registration failed", "error");
      }
    } else {
      const res = await login(email, password, demoName || undefined);
      if (res.success) {
        showToast("Signed in successfully!");
      } else {
        showToast(res.error || "Invalid credentials", "error");
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 sm:p-8 bg-[#FAFAF8]">
      <div className="max-w-5xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Authentication Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#0C3B25] flex items-center justify-center text-white">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-base font-black text-slate-900 tracking-tight">BiteBuddy</span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isSignUp ? "Create Your Account" : "Welcome Back!"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Good Food. Smarter Choices.
            </p>
          </div>

          {/* 1-Click Fast Demo Logins Banner with Name Asking */}
          <div className="p-4 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Quick Demo Access (Instant 1-Click)
              </span>
            </div>

            {/* Ask Name Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                What is your name?
              </label>
              <input
                type="text"
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
                placeholder="Enter your name (e.g. Lakshay, Priya, Alex)"
                className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-emerald-700 font-medium">Quick pick:</span>
                {["Lakshay", "Priya", "Alex", "Rohan"].map((quickName) => (
                  <button
                    key={quickName}
                    type="button"
                    onClick={() => setDemoName(quickName)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                      demoName === quickName
                        ? "bg-emerald-700 text-white shadow-2xs"
                        : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100/60"
                    }`}
                  >
                    {quickName}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => demoLogin("student", demoName || "Student")}
                className="p-3 bg-white hover:bg-emerald-100/50 border border-emerald-200 text-emerald-950 rounded-xl text-xs font-bold transition-all text-left shadow-xs flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                  <GraduationCap className="w-4 h-4 text-emerald-800" />
                </div>
                <div className="min-w-0">
                  <span className="block font-bold text-slate-900 leading-tight">Student Demo</span>
                  <span className="text-[10px] text-emerald-700 block font-semibold truncate">
                    as {demoName || "Student"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => demoLogin("cafeteria_owner", demoName ? `Chef ${demoName}` : "Chef Ramesh")}
                className="p-3 bg-white hover:bg-emerald-100/50 border border-emerald-200 text-emerald-950 rounded-xl text-xs font-bold transition-all text-left shadow-xs flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                  <Store className="w-4 h-4 text-emerald-800" />
                </div>
                <div className="min-w-0">
                  <span className="block font-bold text-slate-900 leading-tight">Owner Demo</span>
                  <span className="text-[10px] text-emerald-700 block font-semibold truncate">
                    as {demoName ? `Chef ${demoName}` : "Chef Ramesh"}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection Cards on Signup */}
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Select Your Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setSelectedRole("student")}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedRole === "student"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-xs text-gray-900">STUDENT</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      Personalized meals, macro tracking, and smart AI chat.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedRole("cafeteria_owner")}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedRole === "cafeteria_owner"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Store className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-xs text-gray-900">OWNER</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      Manage menu, prices, real-time availability, and nutrition.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lakshay Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => showToast("Password reset link sent to registered email.")}
                    className="text-xs text-emerald-700 hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {isSignUp && selectedRole === "cafeteria_owner" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Canteen / Outlet Name</label>
                <input
                  type="text"
                  value={canteenName}
                  onChange={(e) => setCanteenName(e.target.value)}
                  placeholder="e.g. Campus Central Canteen"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs text-slate-600 font-medium">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-50"
            >
              {isSubmitting
                ? "Processing..."
                : isSignUp
                ? `Continue as ${selectedRole === "student" ? "Student" : "Cafeteria Owner"} →`
                : "Sign In"}
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="text-center pt-2 text-xs text-slate-600">
            {isSignUp ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Create account
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Right: Food Visual & Startup Brand Banner */}
        <div className="hidden lg:col-span-5 lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[#0C3B25] to-[#082819] text-white relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-semibold">
              <span>🌱 Smart Campus Nutrition</span>
            </div>
            <h2 className="text-3xl font-black leading-tight tracking-tight">
              Good Food Fuels Great Ideas.
            </h2>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Experience conversational dining built specifically for college life. Understand macros, control your budget, and skip long queues.
            </p>
          </div>

          <div className="relative z-10 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <span>● Two Unified Roles</span>
            </div>
            <p className="text-xs text-white/90 leading-normal">
              Students find the healthiest, most budget-friendly meals with instant AI explanations. Cafeteria owners publish live availability and nutrition in seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
