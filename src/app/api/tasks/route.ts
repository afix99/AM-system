import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const tasks = await prisma.task.findMany({
    include: { store: { select: { id: true, name: true } } },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      title: body.title,
      storeId: body.storeId || null,
      priority: body.priority,
      status: "pending",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes || null,
    },
    include: { store: { select: { id: true, name: true } } },
  });
  return NextResponse.json(task);
}
