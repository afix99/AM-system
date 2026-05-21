import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { ChevronRight, MapPin, Phone, Users } from "lucide-react";
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
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-slate-900">Stores</h1>
      <div className="space-y-3">
        {stores.map((store) => {
          const perf = store.performances[0];
          const achievement = perf && perf.targetSales > 0 ? Math.round((perf.totalSales / perf.targetSales) * 100) : null;
          const lowStock = store.stockItems.filter((i) => i.quantity <= i.minStockLevel).length;
          return (
            <Link key={store.id} href={`/stores/${store.id}`}>
              <Card className="hover:border-slate-300 hover:shadow transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{store.name}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin size={11} />
                        <span className="truncate">{store.location}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone size={11} />{store.phone}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Users size={11} />{store.staff.length} staff
                        </span>
                        {lowStock > 0 && (
                          <span className="text-xs text-red-600 font-medium">{lowStock} low stock</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      {achievement !== null ? (
                        <span className={`text-lg font-bold ${achievement >= 100 ? "text-green-600" : achievement >= 80 ? "text-yellow-600" : "text-red-600"}`}>
                          {achievement}%
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">No data</span>
                      )}
                      {perf && (
                        <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(perf.totalSales)}</p>
                      )}
                      <ChevronRight size={16} className="text-slate-300 ml-auto mt-1" />
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
