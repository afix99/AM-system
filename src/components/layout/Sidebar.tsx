"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, Users, CheckSquare, BookOpen } from "lucide-react";
import { ClaudeSparkle } from "@/components/ui/ClaudeSparkle";
import { LogoutButton } from "@/components/auth/LogoutButton";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/library", label: "Library", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="hidden md:flex flex-col w-60 min-h-full shrink-0 border-r border-white/[0.06]"
      style={{ background: "#141210" }}
    >
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.06]">
        <ClaudeSparkle size={40} />
        <div>
          <p className="text-stone-100 font-semibold text-sm leading-none">Area Manager</p>
          <p className="text-stone-600 text-xs mt-0.5 font-normal">Powered by Claude</p>
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
                active ? "text-[#E8926A]" : "text-stone-500 hover:text-stone-300 hover:bg-white/[0.04]"
              }`}
              style={active ? { background: "rgba(217,119,86,0.12)", boxShadow: "inset 0 0 0 1px rgba(217,119,86,0.20)" } : {}}
            >
              <Icon size={16} className={active ? "text-[#D97756]" : "text-stone-600"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06] space-y-2">
        <LogoutButton />
        <div className="px-3">
          <p className="text-xs text-stone-700 font-medium">Japanese Streetwear</p>
          <p className="text-xs text-stone-700">Jersey Retail Co.</p>
        </div>
      </div>
    </aside>
  );
}
