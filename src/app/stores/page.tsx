import { prisma } from "@/lib/prisma";
import { StoresClient } from "@/components/stores/StoresClient";

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

  return <StoresClient initialStores={stores} month={month} year={year} />;
}
