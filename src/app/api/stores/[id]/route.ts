import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      staff: { where: { status: "active" }, orderBy: { name: "asc" } },
    },
  });
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(store);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, location, phone, managerName } = await req.json();
  const store = await prisma.store.update({
    where: { id },
    data: { name, location, phone, managerName, updatedAt: new Date() },
  });
  return NextResponse.json(store);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.trainingRecord.deleteMany({ where: { staff: { storeId: id } } });
  await prisma.attendance.deleteMany({ where: { storeId: id } });
  await prisma.scheduleImage.deleteMany({ where: { storeId: id } });
  await prisma.visit.deleteMany({ where: { storeId: id } });
  await prisma.checklistRun.deleteMany({ where: { storeId: id } });
  await prisma.checklistTemplate.deleteMany({ where: { storeId: id } });
  await prisma.task.updateMany({ where: { storeId: id }, data: { storeId: null } });
  await prisma.staff.deleteMany({ where: { storeId: id } });
  await prisma.store.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
