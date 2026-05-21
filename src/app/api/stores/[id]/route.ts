import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      staff: { where: { status: "active" }, orderBy: { name: "asc" } },
      stockItems: { orderBy: [{ category: "asc" }, { productName: "asc" }] },
    },
  });
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(store);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, location, phone, managerName, targetMonthlySales } = await req.json();
  const store = await prisma.store.update({
    where: { id },
    data: { name, location, phone, managerName, targetMonthlySales, updatedAt: new Date() },
  });
  return NextResponse.json(store);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Cascade delete all related data
  await prisma.staffPerformance.deleteMany({ where: { storeId: id } });
  await prisma.attendance.deleteMany({ where: { storeId: id } });
  await prisma.stockItem.deleteMany({ where: { storeId: id } });
  await prisma.storePerformance.deleteMany({ where: { storeId: id } });
  // Nullify tasks linked to this store
  await prisma.task.updateMany({ where: { storeId: id }, data: { storeId: null } });
  // Delete all staff
  await prisma.staff.deleteMany({ where: { storeId: id } });
  // Finally delete the store
  await prisma.store.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
