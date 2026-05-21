import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97756]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#1C1917]";
  const variants = {
    primary: "bg-[#D97756] text-white hover:bg-[#C86645] active:bg-[#B85535] shadow-lg shadow-[#D97756]/20",
    secondary: "bg-white/[0.06] text-stone-200 hover:bg-white/[0.10] border border-white/[0.08]",
    ghost: "text-stone-400 hover:bg-white/[0.06] hover:text-stone-200",
    danger: "bg-red-700/90 text-white hover:bg-red-600 active:bg-red-800 shadow-lg shadow-red-900/30",
    outline: "border border-white/[0.12] text-stone-300 hover:bg-white/[0.06] hover:border-white/20",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs min-h-[32px]",
    md: "px-4 py-2 text-sm min-h-[40px]",
    lg: "px-5 py-2.5 text-sm min-h-[48px]",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
