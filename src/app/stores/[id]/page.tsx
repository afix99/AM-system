import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StoreDetailClient } from "@/components/stores/StoreDetailClient";
import { purgeResignedStaff } from "@/lib/staffCleanup";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await purgeResignedStaff();

  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      staff: {
        where: { status: { in: ["active", "on leave", "on-leave"] } },
        orderBy: { name: "asc" },
      },
      stockItems: { orderBy: [{ category: "asc" }, { productName: "asc" }] },
      performances: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 6 },
    },
  });
  if (!store) notFound();

  return <StoreDetailClient store={JSON.parse(JSON.stringify(store))} />;
}
