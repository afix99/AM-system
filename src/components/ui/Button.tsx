import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const base = "btn-pop btn-sweep group relative inline-flex items-center justify-center gap-2 font-semibold rounded-full overflow-hidden isolation-auto disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4A982]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1917] [&_svg]:relative [&_svg]:z-10 [&>*]:relative [&>*]:z-10";

  const variants = {
    primary: "text-white border border-[#D97756]/50 shadow-[0_4px_20px_-2px_rgba(217,119,86,0.45),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-8px_16px_-8px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_28px_-2px_rgba(217,119,86,0.7),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-8px_16px_-8px_rgba(0,0,0,0.4)] bg-[linear-gradient(180deg,#F4A982_0%,#D97756_55%,#A8552F_100%)]",
    secondary: "text-stone-100 border border-white/[0.14] backdrop-blur-sm bg-white/[0.06] hover:bg-white/[0.10] hover:border-white/[0.22] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(0,0,0,0.2)]",
    ghost: "text-stone-300 hover:bg-white/[0.06] hover:text-stone-50",
    danger: "text-white border border-red-500/50 shadow-[0_4px_20px_-2px_rgba(220,38,38,0.45),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-8px_16px_-8px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_28px_-2px_rgba(220,38,38,0.65),inset_0_1px_0_rgba(255,255,255,0.25)] bg-[linear-gradient(180deg,#f87171_0%,#dc2626_55%,#7f1d1d_100%)]",
    outline: "text-stone-200 border border-white/[0.18] backdrop-blur-sm bg-white/[0.02] hover:border-[#D97756]/60 hover:bg-[#D97756]/[0.08] hover:text-[#F4A982] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  };
  const sizes = {
    sm: "px-3.5 py-1.5 text-xs min-h-[34px]",
    md: "px-5 py-2 text-sm min-h-[42px]",
    lg: "px-6 py-2.5 text-sm min-h-[50px]",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
