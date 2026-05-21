import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json(null);

  const date = new Date(weekStart);
  const nextDay = new Date(date); nextDay.setDate(nextDay.getDate() + 1);

  const checklist = await prisma.weeklyChecklist.findFirst({
    where: { weekStartDate: { gte: date, lt: nextDay } },
  });
  return NextResponse.json(checklist);
}

export async function POST(req: Request) {
  const body = await req.json();
  const date = new Date(body.weekStartDate);
  const nextDay = new Date(date); nextDay.setDate(nextDay.getDate() + 1);

  const existing = await prisma.weeklyChecklist.findFirst({
    where: { weekStartDate: { gte: date, lt: nextDay } },
  });

  if (existing) {
    const updated = await prisma.weeklyChecklist.update({
      where: { id: existing.id },
      data: { items: body.items, completedItems: body.completedItems },
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.weeklyChecklist.create({
    data: { weekStartDate: date, items: body.items || "[]", completedItems: body.completedItems || "[]" },
  });
  return NextResponse.json(created);
}
