"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, Users, CheckSquare, BarChart2 } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/performance", label: "Reports", icon: BarChart2 },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-100 z-50">
      <div className="flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors ${
                active ? "text-indigo-600" : "text-slate-400 active:text-slate-600"
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
