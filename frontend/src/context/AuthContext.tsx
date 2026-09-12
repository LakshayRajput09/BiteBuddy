"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "http://127.0.0.1:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("canteen_user");
      const savedToken = localStorage.getItem("canteen_token");
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } else {
        // Default to demo student for frictionless initial exploration
        const defaultStudent: User = {
          id: "student_lakshay",
          name: "Lakshay",
          email: "student@example.com",
          role: "student"
        };
        setUser(defaultStudent);
        setToken("token_student_lakshay");
        localStorage.setItem("canteen_user", JSON.stringify(defaultStudent));
        localStorage.setItem("canteen_token", "token_student_lakshay");
      }
    } catch (e) {
      console.error("Auth init error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Route protection guard
  useEffect(() => {
    if (isLoading || !pathname) return;

    if (user) {
      // Student cannot access /owner/*
      if (user.role === "student" && pathname.startsWith("/owner")) {
        router.replace("/student/dashboard");
      }
      // Owner cannot access /student/*
      if (user.role === "cafeteria_owner" && pathname.startsWith("/student")) {
        router.replace("/owner/dashboard");
      }
    } else {
      // If logged out and trying to access protected routes
      if (pathname.startsWith("/student") || pathname.startsWith("/owner")) {
        router.replace("/login");
      }
    }
  }, [user, pathname, isLoading, router]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Login failed" }));
        return { success: false, error: err.detail || "Invalid credentials" };
      }
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("canteen_user", JSON.stringify(data.user));
      localStorage.setItem("canteen_token", data.token);

      if (data.user.role === "cafeteria_owner") {
        router.push("/owner/dashboard");
      } else {
        router.push("/student/dashboard");
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const register = async (name: string, email: string, pass: string, role: UserRole) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pass, role })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Signup failed" }));
        return { success: false, error: err.detail || "Registration failed" };
      }
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("canteen_user", JSON.stringify(data.user));
      localStorage.setItem("canteen_token", data.token);

      if (role === "student") {
        router.push("/student/onboarding");
      } else {
        router.push("/owner/dashboard");
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const demoLogin = async (role: UserRole) => {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("canteen_user", JSON.stringify(data.user));
        localStorage.setItem("canteen_token", data.token);
        if (role === "cafeteria_owner") {
          router.push("/owner/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      }
    } catch (e) {
      console.error("Demo login failed:", e);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("canteen_user");
    localStorage.removeItem("canteen_token");
    router.push("/login");
  };

  const switchRole = async (newRole: UserRole) => {
    await demoLogin(newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

