import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = { storeId: id };
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);

  const storePerf = await prisma.storePerformance.findMany({ where, orderBy: [{ year: "desc" }, { month: "desc" }] });
  const staffPerf = await prisma.staffPerformance.findMany({
    where: { storeId: id, ...(month ? { month: parseInt(month) } : {}), ...(year ? { year: parseInt(year) } : {}) },
    include: { staff: true },
  });
  return NextResponse.json({ storePerf, staffPerf });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { month, year, totalSales, targetSales, areaManagerNotes, staffRatings } = body;

  const existing = await prisma.storePerformance.findFirst({ where: { storeId: id, month, year } });
  const perf = existing
    ? await prisma.storePerformance.update({ where: { id: existing.id }, data: { totalSales, targetSales, areaManagerNotes } })
    : await prisma.storePerformance.create({ data: { storeId: id, month, year, totalSales, targetSales, areaManagerNotes } });

  if (staffRatings) {
    for (const [staffId, rating] of Object.entries(staffRatings as Record<string, number>)) {
      const ex = await prisma.staffPerformance.findFirst({ where: { staffId, storeId: id, month, year } });
      if (ex) await prisma.staffPerformance.update({ where: { id: ex.id }, data: { rating } });
      else await prisma.staffPerformance.create({ data: { staffId, storeId: id, month, year, rating } });
    }
  }

  return NextResponse.json(perf);
}
