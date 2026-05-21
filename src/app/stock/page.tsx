import { prisma } from "@/lib/prisma";
import { StockClient } from "@/components/StockClient";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const [items, stores] = await Promise.all([
    prisma.stockItem.findMany({
      include: { store: { select: { id: true, name: true } } },
      orderBy: [{ store: { name: "asc" } }, { category: "asc" }, { productName: "asc" }],
    }),
    prisma.store.findMany({ where: { status: "active" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return <StockClient initialItems={JSON.parse(JSON.stringify(items))} stores={stores} />;
}
