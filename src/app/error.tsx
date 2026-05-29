"use client";
import Link from "next/link";
import { useEffect } from "react";
import { ClaudeSparkle } from "@/components/ui/ClaudeSparkle";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <ClaudeSparkle size={72} />
      <h1 className="mt-6 text-2xl font-semibold text-stone-100">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-stone-400">
        We hit an unexpected error loading this page. The team has been notified.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-stone-500">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[#D97756] px-4 py-2 text-sm font-medium text-stone-100 transition hover:bg-[#B85535]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-stone-700 px-4 py-2 text-sm font-medium text-stone-200 transition hover:border-stone-500 hover:bg-stone-800"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
