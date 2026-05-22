import { prisma } from "@/lib/prisma";
import { deleteBlob } from "@/lib/blob";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { notes, actionItems } = await req.json();
  const data: { notes?: string; actionItems?: string } = {};
  if (typeof notes === "string") data.notes = notes;
  if (typeof actionItems === "string") data.actionItems = actionItems;
  const visit = await prisma.visit.update({ where: { id }, data });
  return NextResponse.json(visit);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visit = await prisma.visit.findUnique({ where: { id } });
  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const urls = JSON.parse(visit.photoUrls) as string[];
    for (const url of urls) await deleteBlob(url);
  } catch { /* ignore */ }
  await prisma.visit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
