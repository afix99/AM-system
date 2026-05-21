import { prisma } from "@/lib/prisma";
import { StaffDirectoryClient } from "@/components/staff/StaffDirectoryClient";
import { purgeResignedStaff } from "@/lib/staffCleanup";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StaffPage() {
  await purgeResignedStaff();

  const stores = await prisma.store.findMany({
    where: { status: "active" },
    include: {
      staff: {
        where: { status: { in: ["active", "on leave", "on-leave"] } },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const allStaff = stores.flatMap((store) =>
    store.staff.map((s) => ({
      ...s,
      storeName: store.name,
      storeId: store.id,
      hireDate: s.hireDate.toISOString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }))
  );

  const storeList = stores.map((s) => ({ id: s.id, name: s.name }));

  return (
    <StaffDirectoryClient
      staff={allStaff}
      stores={storeList}
    />
  );
}
