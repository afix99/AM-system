import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { ChevronRight, MapPin, Users } from "lucide-react";
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
      <div className="mb-5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overview</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Stores</h1>
      </div>

      <div className="space-y-3">
        {stores.map((store) => {
          const perf = store.performances[0];
          const achievement = perf && perf.targetSales > 0
            ? Math.round((perf.totalSales / perf.targetSales) * 100)
            : null;
          const lowStock = store.stockItems.filter((i) => i.quantity <= i.minStockLevel).length;
          const color =
            achievement === null ? null :
            achievement >= 100 ? "emerald" :
            achievement >= 80 ? "amber" : "red";

          return (
            <Link key={store.id} href={`/stores/${store.id}`}>
              <Card className="hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-slate-900 text-sm">{store.name}</p>
                        {lowStock > 0 && (
                          <span className="text-xs text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded-full">
                            {lowStock} low stock
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{store.location}</span>
                      </div>

                      {perf ? (
                        <div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                            <div
                              className={`h-full rounded-full ${
                                color === "emerald" ? "bg-emerald-500" :
                                color === "amber" ? "bg-amber-400" : "bg-red-400"
                              }`}
                              style={{ width: `${Math.min(achievement ?? 0, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-400">
                            <span className="font-medium text-slate-600">{formatCurrency(perf.totalSales)}</span>
                            <span>/ {formatCurrency(perf.targetSales)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-1.5 bg-slate-100 rounded-full" />
                      )}

                      <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Users size={11} /> {store.staff.length} staff</span>
                        <span className="text-slate-200">·</span>
                        <span>{store.managerName}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                      {achievement !== null ? (
                        <span className={`text-xl font-bold ${
                          color === "emerald" ? "text-emerald-600" :
                          color === "amber" ? "text-amber-500" : "text-red-500"
                        }`}>
                          {achievement}%
                        </span>
                      ) : (
                        <span className="text-base text-slate-300 font-medium">—</span>
                      )}
                      <span className="text-xs text-slate-400">this month</span>
                      <ChevronRight size={15} className="text-slate-300 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
