import { prisma } from "@/lib/prisma";
import { StoresClient } from "@/components/stores/StoresClient";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const stores = await prisma.store.findMany({
    where: { status: "active" },
    include: {
      staff: { where: { status: "active" } },
    },
    orderBy: { name: "asc" },
  });

  return <StoresClient initialStores={JSON.parse(JSON.stringify(stores))} />;
}
