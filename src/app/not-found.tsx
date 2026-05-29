import Link from "next/link";
import { ClaudeSparkle } from "@/components/ui/ClaudeSparkle";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <ClaudeSparkle size={72} />
      <h1 className="mt-6 text-2xl font-semibold text-stone-100">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-stone-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-[#D97756] px-4 py-2 text-sm font-medium text-stone-100 transition hover:bg-[#B85535]"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
