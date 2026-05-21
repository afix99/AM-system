import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");
  const weekEnd = searchParams.get("weekEnd");

  const where: Record<string, unknown> = { storeId: id };
  if (weekStart && weekEnd) {
    where.date = { gte: new Date(weekStart), lte: new Date(weekEnd) };
  }

  const schedules = await prisma.schedule.findMany({
    where,
    include: { staff: true },
    orderBy: [{ date: "asc" }, { staff: { name: "asc" } }],
  });
  return NextResponse.json(schedules);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  // body: { staffId, date, shiftType, notes? }
  const existing = await prisma.schedule.findFirst({
    where: { staffId: body.staffId, storeId: id, date: new Date(body.date) },
  });
  if (existing) {
    const updated = await prisma.schedule.update({
      where: { id: existing.id },
      data: { shiftType: body.shiftType, notes: body.notes },
    });
    return NextResponse.json(updated);
  }
  const schedule = await prisma.schedule.create({
    data: { staffId: body.staffId, storeId: id, date: new Date(body.date), shiftType: body.shiftType, notes: body.notes },
  });
  return NextResponse.json(schedule);
}
