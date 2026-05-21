"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, Users, CheckSquare, BarChart2, Package } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/performance", label: "Performance", icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-60 min-h-full shrink-0 border-r border-white/[0.06]" style={{ background: "#060918" }}>
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}>
          <span className="text-white text-xs font-bold tracking-tight">AM</span>
        </div>
        <div>
          <p className="text-slate-100 font-semibold text-sm leading-none">Area Manager</p>
          <p className="text-slate-500 text-xs mt-0.5 font-normal">Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "text-indigo-300"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
              }`}
              style={active ? { background: "rgba(99,102,241,0.12)", boxShadow: "inset 0 0 0 1px rgba(99,102,241,0.20)" } : {}}
            >
              <Icon size={16} className={active ? "text-indigo-400" : "text-slate-600"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.06]">
        <p className="text-xs text-slate-600 font-medium">Japanese Streetwear</p>
        <p className="text-xs text-slate-700">Jersey Retail Co.</p>
      </div>
    </aside>
  );
}
