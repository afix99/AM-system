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
    <aside className="hidden md:flex flex-col w-60 bg-slate-950 min-h-full shrink-0">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/40">
          <span className="text-white text-xs font-bold tracking-tight">AM</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">Area Manager</p>
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
                  ? "bg-indigo-600/15 text-indigo-400 ring-1 ring-inset ring-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon size={17} className={active ? "text-indigo-400" : "text-slate-500"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs text-slate-600 font-medium">Japanese Streetwear</p>
        <p className="text-xs text-slate-600">Jersey Retail Co.</p>
      </div>
    </aside>
  );
}
