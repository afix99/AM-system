"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, Calendar, CheckSquare, BarChart2, Package } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/performance", label: "Performance", icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-56 bg-slate-900 text-white min-h-full shrink-0">
      <div className="p-5 border-b border-slate-700">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Area Manager</p>
        <p className="text-white font-bold text-lg leading-tight mt-0.5">Dashboard</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">Japanese Streetwear</p>
        <p className="text-xs text-slate-500">Jersey Retail Co.</p>
      </div>
    </aside>
  );
}
