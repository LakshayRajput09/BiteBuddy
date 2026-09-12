import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { OrderProvider } from "@/context/OrderContext";
import OrderDrawer from "@/components/OrderDrawer";
import NamePromptModal from "@/components/NamePromptModal";

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
      <body className="min-h-screen bg-[#FAFAF8] text-slate-900 antialiased flex flex-col font-sans">
        <AuthProvider>
          <OrderProvider>
            <ToastProvider>
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <OrderDrawer />
              <NamePromptModal />
            </ToastProvider>
          </OrderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
