import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "Area Manager Dashboard",
  description: "Japanese streetwear jersey retail — Area Manager System",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full" style={{ background: "#1C1917" }}>
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 min-w-0 flex flex-col overflow-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>
        <MobileNav />
        <Toaster />
      </body>
    </html>
  );
}
