import { prisma } from "@/lib/prisma";

// Permanently delete any staff that aren't active or on-leave.
// Runs as part of page loads so the DB self-heals — idempotent and safe to call repeatedly.
export async function purgeResignedStaff(): Promise<void> {
  try {
    const targets = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM Staff
      WHERE LOWER(TRIM(status)) <> 'active'
        AND LOWER(TRIM(status)) <> 'on leave'
        AND LOWER(TRIM(status)) <> 'on-leave'
    `;
    if (targets.length === 0) return;

    for (const { id } of targets) {
      try { await prisma.trainingRecord.deleteMany({ where: { staffId: id } }); } catch { /* ignore */ }
      try { await prisma.attendance.deleteMany({ where: { staffId: id } }); } catch { /* ignore */ }
    }

    await prisma.$executeRaw`
      DELETE FROM Staff
      WHERE LOWER(TRIM(status)) <> 'active'
        AND LOWER(TRIM(status)) <> 'on leave'
        AND LOWER(TRIM(status)) <> 'on-leave'
    `;
  } catch (err) {
    console.error("[purgeResignedStaff] failed:", err);
  }
}
