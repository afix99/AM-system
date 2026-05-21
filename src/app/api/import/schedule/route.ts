import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function matchStaffName(importName: string, staff: { id: string; name: string }[]): string | null {
  const norm = (s: string) => s.toLowerCase().trim();
  const exact = staff.find((s) => norm(s.name) === norm(importName));
  if (exact) return exact.id;

  const importWords = norm(importName).split(/\s+/).filter((w) => w.length > 2);
  for (const s of staff) {
    const staffWords = norm(s.name).split(/\s+/).filter((w) => w.length > 2);
    if (importWords.some((iw) => staffWords.some((sw) => sw === iw || sw.startsWith(iw) || iw.startsWith(sw)))) {
      return s.id;
    }
  }
  return null;
}

export async function POST(req: Request) {
  const { storeId, shifts } = (await req.json()) as {
    storeId: string;
    shifts: { staffName: string; date: string; shiftType: string }[];
  };

  const storeStaff = await prisma.staff.findMany({
    where: { storeId, status: "active" },
    select: { id: true, name: true },
  });

  const staffIdMap = new Map<string, string>();
  const uniqueNames = [...new Set(shifts.map((s) => s.staffName))];

  for (const name of uniqueNames) {
    const existingId = matchStaffName(name, storeStaff);
    if (existingId) {
      staffIdMap.set(name, existingId);
    } else {
      const newStaff = await prisma.staff.create({
        data: {
          id: crypto.randomUUID(),
          name,
          phone: "",
          storeId,
          role: "Staff",
          hireDate: new Date(),
          status: "active",
          updatedAt: new Date(),
        },
      });
      staffIdMap.set(name, newStaff.id);
    }
  }

  let imported = 0;
  for (const shift of shifts) {
    const staffId = staffIdMap.get(shift.staffName);
    if (!staffId) continue;

    const date = new Date(shift.date + "T00:00:00");
    const existing = await prisma.schedule.findFirst({ where: { staffId, date } });

    if (existing) {
      await prisma.schedule.update({
        where: { id: existing.id },
        data: { shiftType: shift.shiftType, updatedAt: new Date() },
      });
    } else {
      await prisma.schedule.create({
        data: {
          id: crypto.randomUUID(),
          staffId,
          storeId,
          date,
          shiftType: shift.shiftType,
          updatedAt: new Date(),
        },
      });
    }
    imported++;
  }

  return NextResponse.json({ imported });
}
