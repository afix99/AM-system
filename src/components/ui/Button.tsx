import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#070B19]";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-lg shadow-indigo-900/40",
    secondary: "bg-white/[0.06] text-slate-200 hover:bg-white/[0.10] border border-white/[0.08]",
    ghost: "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200",
    danger: "bg-red-600/90 text-white hover:bg-red-500 active:bg-red-700 shadow-lg shadow-red-900/30",
    outline: "border border-white/[0.10] text-slate-300 hover:bg-white/[0.06] hover:border-white/20",
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
