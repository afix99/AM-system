"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, Users, CheckSquare, Sparkles } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/ai", label: "AI", icon: Sparkles },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] backdrop-blur-xl"
      style={{ background: "rgba(20,18,16,0.96)" }}
    >
      <div className="flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isAI = href === "/ai";
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors ${
                active ? "text-[#D97756]" : isAI ? "text-[#D97756]/70" : "text-stone-600"
              }`}
            >
              {isAI ? (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, #D97756, #C86645)"
                      : "rgba(217,119,86,0.15)",
                    boxShadow: active ? "0 0 12px rgba(217,119,86,0.40)" : "none",
                  }}
                >
                  <Icon size={15} strokeWidth={2.2} className={active ? "text-white" : "text-[#D97756]"} />
                </div>
              ) : (
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
              )}
              <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
