import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Toaster } from "@/components/ui/Toaster";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { readSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "AM System",
  description: "Japanese streetwear jersey retail — Area Manager System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AM System",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1C1917",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  return (
    <html lang="en" className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        ` }} />
      </head>
      <body className="h-full" style={{ background: "#1C1917" }}>
        <div className="flex h-full">
          {session && <Sidebar />}
          <main className="flex-1 min-w-0 flex flex-col overflow-auto pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </main>
        </div>
        {session && <MobileNav />}
        {session && <LogoutButton variant="floating" />}
        <Toaster />
      </body>
    </html>
  );
}
