import { prisma } from "@/lib/prisma";
import { uploadBlob, deleteBlob } from "@/lib/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.libraryEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.libraryEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") ?? "";
  const data: { category?: string; title?: string; content?: string; isTraining?: boolean; attachmentUrls?: string } = {};

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const newCategory = form.get("category");
    const newTitle = form.get("title");
    const newContent = form.get("content");
    const newIsTraining = form.get("isTraining");
    if (typeof newCategory === "string") data.category = newCategory;
    if (typeof newTitle === "string") data.title = newTitle;
    if (typeof newContent === "string") data.content = newContent;
    if (typeof newIsTraining === "string") data.isTraining = newIsTraining === "true";

    const existingUrls: string[] = JSON.parse(existing.attachmentUrls || "[]");
    const newFiles = form.getAll("attachments") as File[];
    const addedUrls: string[] = [];
    for (const file of newFiles) {
      if (file instanceof File && file.size > 0) {
        addedUrls.push(await uploadBlob(file, "library"));
      }
    }
    if (addedUrls.length > 0) {
      data.attachmentUrls = JSON.stringify([...existingUrls, ...addedUrls]);
    }
  } else {
    const body = await req.json();
    if (typeof body.category === "string") data.category = body.category;
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.content === "string") data.content = body.content;
    if (typeof body.isTraining === "boolean") data.isTraining = body.isTraining;
    if (Array.isArray(body.attachmentUrls)) data.attachmentUrls = JSON.stringify(body.attachmentUrls);
  }

  const entry = await prisma.libraryEntry.update({ where: { id }, data });
  return NextResponse.json(entry);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.libraryEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const urls = JSON.parse(entry.attachmentUrls) as string[];
    for (const url of urls) await deleteBlob(url);
  } catch { /* ignore */ }
  await prisma.trainingRecord.deleteMany({ where: { libraryEntryId: id } });
  await prisma.libraryEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
