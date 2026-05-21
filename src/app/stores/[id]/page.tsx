import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StoreDetailClient } from "@/components/stores/StoreDetailClient";

export const dynamic = "force-dynamic";

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      staff: { orderBy: { name: "asc" } },
      stockItems: { orderBy: [{ category: "asc" }, { productName: "asc" }] },
      performances: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 6 },
    },
  });
  if (!store) notFound();

  return <StoreDetailClient store={JSON.parse(JSON.stringify(store))} />;
}
