import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "opening";
  if (type !== "opening" && type !== "closing") {
    return NextResponse.json({ error: "type must be opening or closing" }, { status: 400 });
  }
  const tmpl = await prisma.checklistTemplate.findUnique({
    where: { storeId_type: { storeId, type } },
  });
  return NextResponse.json(tmpl);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  const { type, items } = await req.json();
  if (type !== "opening" && type !== "closing") {
    return NextResponse.json({ error: "type must be opening or closing" }, { status: 400 });
  }
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items must be an array" }, { status: 400 });
  }
  const tmpl = await prisma.checklistTemplate.upsert({
    where: { storeId_type: { storeId, type } },
    update: { items: JSON.stringify(items) },
    create: { storeId, type, items: JSON.stringify(items) },
  });
  return NextResponse.json(tmpl);
}
