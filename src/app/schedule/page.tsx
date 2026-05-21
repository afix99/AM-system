import { prisma } from "@/lib/prisma";
import { ScheduleClient } from "@/components/schedule/ScheduleClient";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const stores = await prisma.store.findMany({
    where: { status: "active" },
    include: { staff: { where: { status: "active" }, orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
  return <ScheduleClient stores={JSON.parse(JSON.stringify(stores))} />;
}
