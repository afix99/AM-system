import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";
import { ClaudeSparkle } from "@/components/ui/ClaudeSparkle";

export default async function LoginPage() {
  const session = await readSession();
  if (session) redirect("/");

  return (
    <div
      className="relative min-h-[100dvh] flex items-center justify-center px-5 overflow-hidden"
      style={{ background: "radial-gradient(ellipse at top, #2A1D17 0%, #1C1917 55%, #0F0D0B 100%)" }}
    >
      {/* Ambient orange glow blobs */}
      <div
        aria-hidden
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(217,119,86,0.28) 0%, rgba(217,119,86,0) 70%)",
          animation: "claudeFloat 9s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] rounded-full blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(244,169,130,0.22) 0%, rgba(244,169,130,0) 70%)",
          animation: "claudeFloat 11s ease-in-out infinite reverse",
        }}
      />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full blur-3xl pointer-events-none opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(217,119,86,0.10) 0%, rgba(217,119,86,0) 60%)",
        }}
      />

      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-3xl border border-white/[0.10] p-8 anim-fade-in-up"
        style={{
          background:
            "linear-gradient(180deg, rgba(38,34,32,0.85) 0%, rgba(20,18,16,0.92) 100%)",
          boxShadow:
            "0 30px 90px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(217,119,86,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Top hairline gradient */}
        <div
          aria-hidden
          className="absolute top-0 left-8 right-8 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(217,119,86,0.55), transparent)",
          }}
        />

        {/* Hero sparkle */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 -m-6 rounded-full blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(217,119,86,0.45) 0%, rgba(217,119,86,0) 70%)",
                animation: "claudeGlow 2.4s ease-in-out infinite",
              }}
            />
            <ClaudeSparkle size={68} />
          </div>
          <p className="mt-5 text-[10px] font-bold tracking-[0.22em] uppercase text-[#D97756]/85">
            Area Manager
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-stone-50 anim-shimmer">
            Welcome back
          </h1>
          <p className="mt-2 text-xs text-stone-500">
            Sign in to manage your stores
          </p>
        </div>

        <LoginForm />

        {/* Footer mark */}
        <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-2">
          <span
            className="inline-block w-1 h-1 rounded-full"
            style={{ background: "#D97756", boxShadow: "0 0 6px rgba(217,119,86,0.8)" }}
          />
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-stone-600">
            Japanese Streetwear · Jersey Retail Co.
          </p>
          <span
            className="inline-block w-1 h-1 rounded-full"
            style={{ background: "#D97756", boxShadow: "0 0 6px rgba(217,119,86,0.8)" }}
          />
        </div>
      </div>
    </div>
  );
}
