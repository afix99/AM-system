import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await prisma.stockItem.findMany({
    where: { storeId: id },
    orderBy: [{ category: "asc" }, { productName: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const item = await prisma.stockItem.create({ data: { ...body, storeId: id } });
  return NextResponse.json(item);
}
