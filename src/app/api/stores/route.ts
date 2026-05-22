import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const stores = await prisma.store.findMany({
    where: { status: "active" },
    include: {
      staff: { where: { status: "active" } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(stores);
}

export async function POST(req: Request) {
  const { name, location, phone, managerName } = await req.json();
  if (!name?.trim() || !location?.trim()) {
    return NextResponse.json({ error: "Name and location are required" }, { status: 400 });
  }
  const store = await prisma.store.create({
    data: {
      name: name.trim(),
      location: location.trim(),
      phone: phone?.trim() || "",
      managerName: managerName?.trim() || "",
      status: "active",
    },
  });
  return NextResponse.json(store);
}
