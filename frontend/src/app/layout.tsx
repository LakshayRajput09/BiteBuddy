import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { OrderProvider } from "@/context/OrderContext";
import OrderDrawer from "@/components/OrderDrawer";
import NamePromptModal from "@/components/NamePromptModal";
import CanteenChatWidget from "@/components/CanteenChatWidget";

export const metadata: Metadata = {
  title: "BiteBuddy — Good Food. Smarter Choices.",
  description: "AI-powered college canteen assistant. Personalized meal recommendations based on budget, mood, cravings, diet, and nutrition goals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFAF8] text-slate-900 antialiased flex flex-col font-sans relative overflow-x-hidden">
        {/* Ambient Liquid Glass Mesh Canvas */}
        <div className="liquid-canvas" aria-hidden="true">
          <div className="liquid-blob liquid-blob-1" />
          <div className="liquid-blob liquid-blob-2" />
          <div className="liquid-blob liquid-blob-3" />
          <div className="liquid-blob liquid-blob-4" />
        </div>

        <AuthProvider>
          <OrderProvider>
            <ToastProvider>
              <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
                <OrderDrawer />
                <NamePromptModal />
                <CanteenChatWidget />
              </div>
            </ToastProvider>
          </OrderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
