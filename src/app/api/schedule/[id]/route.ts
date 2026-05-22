import { prisma } from "@/lib/prisma";
import { deleteBlob } from "@/lib/blob";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const schedule = await prisma.scheduleImage.findUnique({ where: { id } });
  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteBlob(schedule.imageUrl);
  await prisma.scheduleImage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
