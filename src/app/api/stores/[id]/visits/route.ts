import { prisma } from "@/lib/prisma";
import { uploadBlob } from "@/lib/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  const form = await req.formData();
  const notes = (form.get("notes") as string | null) ?? "";
  const visitDate = new Date((form.get("visitDate") as string | null) ?? new Date().toISOString());
  const actionItemsRaw = (form.get("actionItems") as string | null) ?? "[]";

  const photoUrls: string[] = [];
  const photos = form.getAll("photos") as File[];
  for (const photo of photos) {
    if (photo instanceof File && photo.size > 0) {
      const url = await uploadBlob(photo, `visits/${storeId}`);
      photoUrls.push(url);
    }
  }

  const visit = await prisma.visit.create({
    data: {
      storeId,
      visitDate,
      notes,
      photoUrls: JSON.stringify(photoUrls),
      actionItems: actionItemsRaw,
    },
  });
  return NextResponse.json(visit);
}
