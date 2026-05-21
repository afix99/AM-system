import { prisma } from "@/lib/prisma";
import { PerformanceClient } from "@/components/performance/PerformanceClient";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const stores = await prisma.store.findMany({
    where: { status: "active" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return <PerformanceClient stores={stores} />;
}
