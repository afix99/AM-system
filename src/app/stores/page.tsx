import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight, MapPin, Users, Store } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const stores = await prisma.store.findMany({
    where: { status: "active" },
    include: {
      staff: { where: { status: "active" } },
      performances: { where: { month, year }, take: 1 },
      stockItems: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <p className="text-xs font-medium text-[#D97756]/80 uppercase tracking-widest mb-1">Overview</p>
        <h1 className="text-2xl font-bold text-stone-100">Stores</h1>
        <p className="text-sm text-stone-600 mt-0.5">{stores.length} active locations</p>
      </div>

      <div className="space-y-3">
        {stores.map((store) => {
          const perf = store.performances[0];
          const achievement = perf && perf.targetSales > 0
            ? Math.round((perf.totalSales / perf.targetSales) * 100)
            : null;
          const lowStock = store.stockItems.filter((i) => i.quantity <= i.minStockLevel).length;
          const achieveColor = achievement === null ? null :
            achievement >= 100 ? "text-emerald-400" :
            achievement >= 80 ? "text-amber-400" : "text-red-400";
          const barColor = achievement === null ? null :
            achievement >= 100 ? "#10b981" :
            achievement >= 80 ? "#f59e0b" : "#ef4444";

          return (
            <Link key={store.id} href={`/stores/${store.id}`}>
              <div className="rounded-2xl border border-white/[0.07] bg-[#262220] hover:border-[#D97756]/30 hover:bg-[#2E2420] transition-all cursor-pointer group p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl border border-[#D97756]/20 flex items-center justify-center shrink-0 group-hover:border-[#D97756]/40 transition-colors" style={{ background: "rgba(217,119,86,0.10)" }}>
                    <Store size={18} className="text-[#D97756]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-stone-200 text-sm group-hover:text-white transition-colors">{store.name}</p>
                      {lowStock > 0 && (
                        <span className="text-xs text-red-400 font-medium bg-red-950/50 px-1.5 py-0.5 rounded-full border border-red-500/20">
                          {lowStock} low stock
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-600 mb-3">
                      <MapPin size={11} className="shrink-0" />
                      <span className="truncate">{store.location}</span>
                    </div>

                    {perf ? (
                      <div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-1.5">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(achievement ?? 0, 100)}%`, background: barColor ?? "#D97756" }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-stone-600">
                          <span className="text-stone-400 font-medium">{formatCurrency(perf.totalSales)}</span>
                          <span>/ {formatCurrency(perf.targetSales)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-1.5 bg-white/[0.06] rounded-full" />
                    )}

                    <div className="flex items-center gap-3 mt-2.5 text-xs text-stone-600">
                      <span className="flex items-center gap-1"><Users size={11} /> {store.staff.length} staff</span>
                      <span className="text-white/10">·</span>
                      <span>{store.managerName}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                    {achievement !== null ? (
                      <span className={`text-xl font-bold ${achieveColor}`}>{achievement}%</span>
                    ) : (
                      <span className="text-base text-stone-700 font-medium">—</span>
                    )}
                    <span className="text-xs text-stone-600">this month</span>
                    <ChevronRight size={14} className="text-stone-700 group-hover:text-[#D97756] transition-colors mt-1" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
