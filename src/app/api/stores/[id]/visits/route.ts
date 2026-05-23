import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  const visits = await prisma.visit.findMany({
    where: { storeId },
    orderBy: { visitDate: "desc" },
  });
  return NextResponse.json(visits);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  let body: { notes?: string; visitDate?: string; actionItems?: string; photos?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const photoUrls = (body.photos ?? []).filter((p) => typeof p === "string" && p.startsWith("data:image/"));
  // Cap total payload — visit row shouldn't get out of hand
  const totalSize = photoUrls.reduce((sum, p) => sum + p.length, 0);
  if (totalSize > 4_500_000) {
    return NextResponse.json({ error: "Photos are too large in total. Try fewer or smaller photos." }, { status: 413 });
  }

  const visit = await prisma.visit.create({
    data: {
      storeId,
      visitDate: new Date(body.visitDate ?? new Date().toISOString()),
      notes: body.notes ?? "",
      photoUrls: JSON.stringify(photoUrls),
      actionItems: body.actionItems ?? "[]",
    },
  });
  return NextResponse.json(visit);
}
