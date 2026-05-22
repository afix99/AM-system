import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// One-shot cleanup: permanently wipe every staff record whose status is anything
// other than "active" or "on leave"/"on-leave". Run by navigating to /api/staff/purge.
export async function GET() {
  const targets = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM Staff WHERE LOWER(TRIM(status)) <> 'active' AND LOWER(TRIM(status)) <> 'on leave' AND LOWER(TRIM(status)) <> 'on-leave'
  `;
  const ids = targets.map((t) => t.id);

  let deletedRelated = 0;
  for (const id of ids) {
    try { deletedRelated += await prisma.trainingRecord.deleteMany({ where: { staffId: id } }).then((r) => r.count); } catch { /* ignore */ }
    try { deletedRelated += await prisma.attendance.deleteMany({ where: { staffId: id } }).then((r) => r.count); } catch { /* ignore */ }
  }

  const result = await prisma.$executeRaw`
    DELETE FROM Staff WHERE LOWER(TRIM(status)) <> 'active' AND LOWER(TRIM(status)) <> 'on leave' AND LOWER(TRIM(status)) <> 'on-leave'
  `;

  return NextResponse.json({
    purgedStaff: result,
    purgedRelated: deletedRelated,
    targets: ids,
  });
}

export const dynamic = "force-dynamic";
