import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseDate(s: string | null): Date {
  const d = s ? new Date(s) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const dateParam = url.searchParams.get("date");

  if (dateParam) {
    const date = parseDate(dateParam);
    const where = type ? { storeId, type, date } : { storeId, date };
    const runs = await prisma.checklistRun.findMany({ where });
    return NextResponse.json(runs);
  }

  // Return last 30 days of runs
  const since = new Date();
  since.setDate(since.getDate() - 30);
  since.setHours(0, 0, 0, 0);
  const where: { storeId: string; date: { gte: Date }; type?: string } = { storeId, date: { gte: since } };
  if (type) where.type = type;
  const runs = await prisma.checklistRun.findMany({
    where,
    orderBy: { date: "desc" },
  });
  return NextResponse.json(runs);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  const { type, date, completedItems, notes } = await req.json();
  if (type !== "opening" && type !== "closing") {
    return NextResponse.json({ error: "type must be opening or closing" }, { status: 400 });
  }
  const runDate = parseDate(date);
  const run = await prisma.checklistRun.upsert({
    where: { storeId_type_date: { storeId, type, date: runDate } },
    update: {
      completedItems: JSON.stringify(completedItems ?? []),
      notes: notes ?? null,
    },
    create: {
      storeId,
      type,
      date: runDate,
      completedItems: JSON.stringify(completedItems ?? []),
      notes: notes ?? null,
    },
  });
  return NextResponse.json(run);
}
