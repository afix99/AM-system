import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  if (date) {
    const d = new Date(date);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const attendance = await prisma.attendance.findMany({
      where: { storeId: id, date: { gte: d, lt: next } },
      include: { staff: true },
    });
    return NextResponse.json(attendance);
  }

  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 1);
    const attendance = await prisma.attendance.findMany({
      where: { storeId: id, date: { gte: start, lt: end } },
      include: { staff: true },
    });
    return NextResponse.json(attendance);
  }

  return NextResponse.json([]);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const date = new Date(body.date);
  const next = new Date(date); next.setDate(next.getDate() + 1);

  const existing = await prisma.attendance.findFirst({
    where: { staffId: body.staffId, storeId: id, date: { gte: date, lt: next } },
  });
  if (existing) {
    const updated = await prisma.attendance.update({ where: { id: existing.id }, data: { status: body.status, notes: body.notes } });
    return NextResponse.json(updated);
  }
  const attendance = await prisma.attendance.create({
    data: { staffId: body.staffId, storeId: id, date, status: body.status, notes: body.notes },
  });
  return NextResponse.json(attendance);
}
