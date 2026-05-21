import { prisma } from "@/lib/prisma";
import { StaffDirectoryClient } from "@/components/staff/StaffDirectoryClient";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const stores = await prisma.store.findMany({
    where: { status: "active" },
    include: {
      staff: { where: { status: { not: "resigned" } }, orderBy: { name: "asc" } },
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
