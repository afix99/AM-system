import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const stores = await prisma.store.findMany({
    where: { status: "active" },
    include: {
      staff: { where: { status: "active" } },
      stockItems: true,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(stores);
}
