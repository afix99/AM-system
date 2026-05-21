import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");
  const weekEnd = searchParams.get("weekEnd");

  if (!weekStart || !weekEnd) return NextResponse.json([]);

  const schedules = await prisma.schedule.findMany({
    where: { date: { gte: new Date(weekStart), lte: new Date(weekEnd) } },
    include: { staff: true, store: true },
    orderBy: [{ store: { name: "asc" } }, { date: "asc" }, { staff: { name: "asc" } }],
  });
  return NextResponse.json(schedules);
}
