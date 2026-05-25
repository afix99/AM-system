import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";
import { ClaudeSparkle } from "@/components/ui/ClaudeSparkle";

export default async function LoginPage() {
  const session = await readSession();
  if (session) redirect("/");

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-5" style={{ background: "#1C1917" }}>
      <div
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] p-7"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
          boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-3 mb-7">
          <ClaudeSparkle size={42} />
          <div>
            <p className="text-stone-100 font-semibold text-base leading-none">Area Manager</p>
            <p className="text-stone-500 text-xs mt-1">Sign in to continue</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
