"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Home, Store, Users, CheckSquare, BookOpen } from "lucide-react";
import { ClaudeSparkle } from "@/components/ui/ClaudeSparkle";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/library", label: "Library", icon: BookOpen },
];

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const rawIndex = links.findIndex((l) => (l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)));

  // Optimistic index — flips the instant you tap, before navigation completes.
  const [optimistic, setOptimistic] = useState(rawIndex);
  useEffect(() => {
    if (rawIndex >= 0) setOptimistic(rawIndex);
  }, [rawIndex]);

  const activeIndex = optimistic >= 0 ? optimistic : rawIndex;
  const itemWidthPct = 100 / links.length;

  const handleTap = (i: number, href: string) => (e: React.MouseEvent) => {
    if (i === activeIndex) return;
    e.preventDefault();
    setOptimistic(i);
    startTransition(() => router.push(href));
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
    >
      {activeIndex >= 0 && (
        <div
          className="absolute left-0 right-0 mx-3 pointer-events-none"
          style={{ bottom: "calc(100% - 18px + max(env(safe-area-inset-bottom), 0.5rem))" }}
        >
          <div
            className="relative h-0"
            style={{
              transition: `transform 0.22s ${SPRING}`,
              transform: `translateX(${activeIndex * 100}%)`,
              width: `${itemWidthPct}%`,
            }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 -top-3 claude-sparkle-float">
              <ClaudeSparkle size={26} />
            </div>
          </div>
        </div>
      )}

      <div
        className="mx-3 rounded-3xl border border-white/[0.10] backdrop-blur-2xl pointer-events-auto overflow-hidden relative"
        style={{
          background: "linear-gradient(180deg, rgba(38,34,32,0.92) 0%, rgba(20,18,16,0.94) 100%)",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(217,119,86,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {activeIndex >= 0 && (
          <div
            className="nav-indicator absolute top-1.5 bottom-1.5 rounded-2xl"
            style={{
              width: `calc(${itemWidthPct}% - 6px)`,
              transform: `translateX(calc(${activeIndex * 100}% + 3px))`,
              transition: `transform 0.22s ${SPRING}`,
              background: "linear-gradient(135deg, rgba(217,119,86,0.22), rgba(217,119,86,0.08))",
              border: "1px solid rgba(217,119,86,0.28)",
            }}
          />
        )}

        <div className="relative flex">
          {links.map(({ href, label, icon: Icon }, i) => {
            const active = i === activeIndex;
            return (
              <Link
                key={href}
                href={href}
                prefetch
                onClick={handleTap(i, href)}
                aria-current={active ? "page" : undefined}
                className="flex-1 relative flex flex-col items-center justify-center py-2.5 gap-1 min-h-[60px] active:scale-90 transition-transform duration-75"
              >
                <Icon
                  size={active ? 22 : 19}
                  strokeWidth={active ? 2.6 : 1.7}
                  className={`transition-all duration-150 ${active ? "text-[#FFB088]" : "text-stone-500"}`}
                  style={active ? { filter: "drop-shadow(0 0 10px rgba(217,119,86,0.7))" } : undefined}
                />
                <span
                  className={`text-[10px] leading-none font-medium transition-colors duration-150 ${
                    active ? "text-[#F4A982] font-bold tracking-wide" : "text-stone-600"
                  }`}
                >
                  {label}
                </span>
                <span
                  className="absolute bottom-0 left-1/2 h-[2px] rounded-full transition-all duration-200"
                  style={{
                    transform: `translateX(-50%)`,
                    width: active ? "18px" : "0px",
                    background: "linear-gradient(90deg, transparent, #F4A982, transparent)",
                    boxShadow: active ? "0 0 8px rgba(217,119,86,0.7)" : "none",
                  }}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

