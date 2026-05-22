import { ClaudeSparkle } from "@/components/ui/ClaudeSparkle";

interface Props {
  label?: string;
  title: string;
  rows?: number;
  stats?: number;
}

export function PageSkeleton({ label = "Loading", title, rows = 4, stats = 0 }: Props) {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-5 anim-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClaudeSparkle size={44} />
          <div>
            <p className="text-xs font-medium text-[#D97756]/80 uppercase tracking-widest mb-0.5">{label}</p>
            <h1 className="text-2xl font-bold anim-shimmer">{title}</h1>
          </div>
        </div>
      </div>
      {stats > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stats}, minmax(0, 1fr))` }}>
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white/[0.04] animate-pulse h-20" />
          ))}
        </div>
      )}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/[0.04] animate-pulse h-16"
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>
    </div>
  );
}
