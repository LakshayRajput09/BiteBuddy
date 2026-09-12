"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, Menu, X, ShoppingBag, ArrowRightLeft, LogOut, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrder } from "@/context/OrderContext";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, switchRole, logout } = useAuth();
  const { cart, openDrawer } = useOrder();

  const isOwner = user?.role === "cafeteria_owner";

  const studentLinks = [
    { name: "Dashboard", href: "/student/dashboard" },
    { name: "AI Assistant", href: "/chat" },
    { name: "Menu", href: "/menu" },
    { name: "Recommendations", href: "/recommendations" },
    { name: "Nutrition", href: "/student/nutrition" },
    { name: "Preferences", href: "/student/preferences" },
    { name: "Orders", href: "/student/orders" },
  ];

  const ownerLinks = [
    { name: "Dashboard", href: "/owner/dashboard" },
    { name: "Menu Management", href: "/owner/menu" },
    { name: "Add Food", href: "/owner/menu/add" },
    { name: "Availability", href: "/owner/availability" },
    { name: "Nutrition", href: "/owner/nutrition" },
    { name: "Orders", href: "/owner/orders" },
  ];

  const currentLinks = isOwner ? ownerLinks : studentLinks;

  const isActive = (href: string) => {
    if (href === "/menu" && pathname === "/menu") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  const handleToggleRole = () => {
    const targetRole = isOwner ? "student" : "cafeteria_owner";
    switchRole(targetRole);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Name */}
        <Link href={isOwner ? "/owner/dashboard" : "/student/dashboard"} className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#0C3B25] flex items-center justify-center text-white shadow-sm group-hover:bg-[#059669] transition-colors">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-slate-900 tracking-tight">BiteBuddy</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium -mt-1 hidden sm:block">
              Good Food. Smarter Choices.
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-0.5 bg-slate-50 p-1 rounded-full border border-slate-200/70 overflow-x-auto">
          {currentLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                isActive(link.href)
                  ? "bg-white text-emerald-800 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right: Order Button, Role Switcher, and User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Order Tray Button (Students) */}
          {!isOwner && (
            <button
              onClick={openDrawer}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-xs font-bold transition-all"
              title="View your current order"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">Order</span>
              {cartItemCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#059669] text-white text-[10px] flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Role Switcher Pill */}
          <button
            onClick={handleToggleRole}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-700 transition-all"
            title={`Currently logged in as ${user?.role}. Click to switch role.`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">
              {isOwner ? "Owner: Chef Ramesh" : "Student: Lakshay"}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
              {isOwner ? "Owner" : "Student"}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-lg">
          {currentLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isActive(link.href)
                  ? "bg-emerald-50 text-emerald-800 font-bold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 px-3">
            <span>Signed in as {user?.name} ({user?.role})</span>
            <button onClick={handleToggleRole} className="text-emerald-700 font-bold hover:underline">
              Switch to {isOwner ? "Student" : "Owner"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;
