import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.stockItem.findMany({
    include: { store: { select: { id: true, name: true } } },
    orderBy: [{ store: { name: "asc" } }, { category: "asc" }, { productName: "asc" }],
  });
  return NextResponse.json(items);
}
