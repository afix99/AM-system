import { prisma } from "@/lib/prisma";
import { uploadBlob } from "@/lib/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const entries = await prisma.libraryEntry.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let category = "";
  let title = "";
  let content = "";
  let isTraining = false;
  const attachmentUrls: string[] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    category = (form.get("category") as string | null) ?? "";
    title = (form.get("title") as string | null) ?? "";
    content = (form.get("content") as string | null) ?? "";
    isTraining = (form.get("isTraining") as string | null) === "true";
    const files = form.getAll("attachments") as File[];
    for (const file of files) {
      if (file instanceof File && file.size > 0) {
        attachmentUrls.push(await uploadBlob(file, "library"));
      }
    }
  } else {
    const body = await req.json();
    category = body.category ?? "";
    title = body.title ?? "";
    content = body.content ?? "";
    isTraining = !!body.isTraining;
  }

  if (!title.trim() || !category.trim()) {
    return NextResponse.json({ error: "Category and title are required" }, { status: 400 });
  }

  const entry = await prisma.libraryEntry.create({
    data: {
      category: category.trim(),
      title: title.trim(),
      content,
      isTraining,
      attachmentUrls: JSON.stringify(attachmentUrls),
    },
  });
  return NextResponse.json(entry);
}
