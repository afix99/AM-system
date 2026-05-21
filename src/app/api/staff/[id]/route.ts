import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (body.hireDate) body.hireDate = new Date(body.hireDate);
  const staff = await prisma.staff.update({ where: { id }, data: body });
  return NextResponse.json(staff);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Delete related records first to avoid FK constraint violations
  await prisma.schedule.deleteMany({ where: { staffId: id } });
  await prisma.attendance.deleteMany({ where: { staffId: id } });
  await prisma.staffPerformance.deleteMany({ where: { staffId: id } });
  await prisma.staff.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
