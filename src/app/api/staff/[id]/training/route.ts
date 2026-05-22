import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: staffId } = await params;
  const records = await prisma.trainingRecord.findMany({
    where: { staffId },
    include: { libraryEntry: { select: { id: true, title: true, category: true } } },
    orderBy: { completedDate: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: staffId } = await params;
  const { libraryEntryId, completedDate, notes } = await req.json();
  if (!libraryEntryId) {
    return NextResponse.json({ error: "libraryEntryId required" }, { status: 400 });
  }
  const date = completedDate ? new Date(completedDate) : new Date();
  const record = await prisma.trainingRecord.upsert({
    where: { staffId_libraryEntryId: { staffId, libraryEntryId } },
    update: { completedDate: date, notes: notes ?? null },
    create: { staffId, libraryEntryId, completedDate: date, notes: notes ?? null },
  });
  return NextResponse.json(record);
}
