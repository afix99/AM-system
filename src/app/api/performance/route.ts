import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || "");
  const year = parseInt(searchParams.get("year") || "");

  if (!month || !year) return NextResponse.json([]);

  const performances = await prisma.storePerformance.findMany({
    where: { month, year },
    include: { store: true },
    orderBy: { totalSales: "desc" },
  });

  // Get previous month for trend
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevPerfs = await prisma.storePerformance.findMany({
    where: { month: prevMonth, year: prevYear },
  });

  const result = performances.map((p, i) => {
    const prev = prevPerfs.find((pp) => pp.storeId === p.storeId);
    return {
      ...p,
      rank: i + 1,
      achievement: p.targetSales > 0 ? Math.round((p.totalSales / p.targetSales) * 100) : 0,
      trend: prev ? (p.totalSales > prev.totalSales ? "up" : p.totalSales < prev.totalSales ? "down" : "flat") : "flat",
      prevSales: prev?.totalSales ?? 0,
    };
  });

  return NextResponse.json(result);
}
