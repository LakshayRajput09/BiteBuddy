"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, Menu, X, ShoppingBag, ArrowRightLeft, LogOut, User as UserIcon, Edit3 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrder } from "@/context/OrderContext";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, switchRole, logout, setIsNameModalOpen } = useAuth();
  const { cart, openDrawer } = useOrder();

  const isOwner = user?.role === "cafeteria_owner";

  const publicLinks = [
    { name: "Home", href: "/" },
    { name: "Menu", href: "/menu" },
    { name: "How It Works", href: "/how-it-works" },
  ];

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

  const currentLinks = user ? (isOwner ? ownerLinks : studentLinks) : publicLinks;

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
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
    <header className="sticky top-0 z-40 liquid-glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Name */}
        <Link href={user ? (isOwner ? "/owner/dashboard" : "/student/dashboard") : "/"} className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#0C3B25] flex items-center justify-center text-white shadow-md group-hover:bg-[#059669] transition-all group-hover:scale-105 border border-white/20">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-slate-900 tracking-tight">BiteBuddy</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400/80 animate-pulse"></span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium -mt-1 hidden sm:block">
              Good Food. Smarter Choices.
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/60 backdrop-blur-xl p-1 rounded-full border border-white/80 shadow-xs overflow-x-auto">
          {currentLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                isActive(link.href)
                  ? "liquid-glass-pill-active font-bold"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/70"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Order Tray Button (Students) */}
              {!isOwner && (
                <button
                  onClick={openDrawer}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-emerald-950 text-xs font-bold hover:scale-105 transition-all"
                  title="View your current order"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">Order</span>
                  {cartItemCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#059669] text-white text-[10px] flex items-center justify-center font-bold shadow-xs">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              )}

              {/* User Profile Pill with Name (Click to edit name) */}
              <button
                onClick={() => setIsNameModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-semibold text-emerald-950 transition-all group hover:scale-[1.02]"
                title="Click to edit your name"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center font-bold uppercase shrink-0 shadow-xs">
                  {user.name ? user.name.charAt(0) : "U"}
                </span>
                <span className="hidden sm:inline font-bold truncate max-w-[110px]">
                  {user.name}
                </span>
                <span className="text-[10px] bg-white/90 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md border border-white/80 shadow-2xs">
                  {isOwner ? "Owner" : "Student"}
                </span>
                <Edit3 className="w-3 h-3 text-emerald-700 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Quick Role Switcher */}
              <button
                onClick={handleToggleRole}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl liquid-glass-pill text-xs text-slate-700 transition-all hover:text-slate-900"
                title={`Switch role to ${isOwner ? 'Student' : 'Cafeteria Owner'}`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-semibold">Switch</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex items-center gap-1 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-colors"
                title={`Log Out (${user.name})`}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs hidden md:inline font-semibold">Log Out</span>
              </button>
            </>
          ) : (
            /* Logged Out State: Prominent Log In Button */
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl liquid-glass-button text-xs font-bold"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Log In</span>
            </Link>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:bg-white/60 rounded-xl liquid-glass-pill"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/70 bg-white/90 backdrop-blur-2xl px-4 py-3 space-y-1 shadow-2xl">
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
            {user ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsNameModalOpen(true);
                  }}
                  className="font-bold text-emerald-900 hover:underline flex items-center gap-1"
                >
                  <span>{user.name} ({user.role})</span>
                  <Edit3 className="w-3 h-3 text-emerald-700" />
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={handleToggleRole} className="text-emerald-700 font-bold hover:underline">
                    Switch Role
                  </button>
                  <button onClick={logout} className="text-red-600 font-bold hover:underline">
                    Log Out
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 bg-emerald-600 text-white font-bold rounded-xl"
              >
                Sign In / Log In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;
