"use client";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

type Variant = "sidebar" | "floating";

export function LogoutButton({ variant = "sidebar" }: { variant?: Variant }) {
  const [pending, start] = useTransition();
  const handle = () => start(() => logout());

  if (variant === "floating") {
    return (
      <button
        onClick={handle}
        disabled={pending}
        aria-label="Sign out"
        className="md:hidden fixed top-3 right-3 z-30 w-9 h-9 rounded-full flex items-center justify-center border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-stone-400 active:scale-95 transition-all disabled:opacity-50"
        style={{ top: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <LogOut size={15} strokeWidth={2.1} />
      </button>
    );
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-300 hover:bg-white/[0.04] transition-colors disabled:opacity-50"
    >
      <LogOut size={14} />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
