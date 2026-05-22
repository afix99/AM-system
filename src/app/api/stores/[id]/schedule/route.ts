import { prisma } from "@/lib/prisma";
import { uploadBlob, deleteBlob } from "@/lib/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseWeek(weekParam: string | null): Date {
  const d = weekParam ? new Date(weekParam) : new Date();
  // Normalize to Monday of that week
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  const url = new URL(req.url);
  const weekStartDate = parseWeek(url.searchParams.get("week"));

  const schedule = await prisma.scheduleImage.findUnique({
    where: { storeId_weekStartDate: { storeId, weekStartDate } },
  });
  return NextResponse.json({ schedule, weekStartDate: weekStartDate.toISOString() });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const weekStartDate = parseWeek(form.get("week") as string | null);

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const existing = await prisma.scheduleImage.findUnique({
    where: { storeId_weekStartDate: { storeId, weekStartDate } },
  });
  if (existing) {
    await deleteBlob(existing.imageUrl);
  }

  const imageUrl = await uploadBlob(file, `schedules/${storeId}`);
  const schedule = await prisma.scheduleImage.upsert({
    where: { storeId_weekStartDate: { storeId, weekStartDate } },
    update: { imageUrl },
    create: { storeId, weekStartDate, imageUrl },
  });
  return NextResponse.json(schedule);
}
