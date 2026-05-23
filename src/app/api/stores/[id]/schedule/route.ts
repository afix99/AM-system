import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function parseWeek(weekParam: string | null): Date {
  const d = weekParam ? new Date(weekParam) : new Date();
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
  let body: { imageData?: string; week?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }
  const { imageData, week } = body;
  const weekStartDate = parseWeek(week ?? null);

  if (!imageData || !imageData.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }
  if (imageData.length > 1_600_000) {
    return NextResponse.json({ error: "Image is too large, even after compression" }, { status: 413 });
  }

  try {
    const schedule = await prisma.scheduleImage.upsert({
      where: { storeId_weekStartDate: { storeId, weekStartDate } },
      update: { imageUrl: imageData },
      create: { storeId, weekStartDate, imageUrl: imageData },
    });
    return NextResponse.json(schedule);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
