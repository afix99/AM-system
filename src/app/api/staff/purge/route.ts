import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// One-shot cleanup: permanently wipe every staff record whose status is anything
// other than "active" (resigned, on-leave, blank, mixed-case variants, etc).
// Run by navigating to /api/staff/purge in the browser.
export async function GET() {
  // Find every staff that isn't strictly "active"
  const targets = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM Staff WHERE LOWER(TRIM(status)) <> 'active' AND LOWER(TRIM(status)) <> 'on leave' AND LOWER(TRIM(status)) <> 'on-leave'
  `;
  const ids = targets.map((t) => t.id);

  let deletedRelated = 0;
  for (const id of ids) {
    try { await prisma.$executeRaw`DELETE FROM Schedule WHERE staffId = ${id}` } catch {}
    try { deletedRelated += await prisma.attendance.deleteMany({ where: { staffId: id } }).then(r => r.count) } catch {}
    try { deletedRelated += await prisma.staffPerformance.deleteMany({ where: { staffId: id } }).then(r => r.count) } catch {}
  }

  // Hard delete the staff rows themselves using raw SQL (bypasses Prisma's relation checks)
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
