import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await prisma.staff.findMany({
    where: { storeId: id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(staff);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const staff = await prisma.staff.create({
    data: { ...body, storeId: id, hireDate: new Date(body.hireDate) },
  });
  return NextResponse.json(staff);
}
