import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getWeekDates } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDates = getWeekDates(today);
  const weekStart = weekDates[0];
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeekStart = new Date(weekStart); nextWeekStart.setDate(weekStart.getDate() + 7);
  const nextWeekEnd = new Date(nextWeekStart); nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

  const [stores, tasks, checklist, nextWeekSchedules] = await Promise.all([
    prisma.store.findMany({
      where: { status: "active" },
      include: {
        staff: { where: { status: "active" } },
        stockItems: true,
        performances: {
          where: { month: today.getMonth() + 1, year: today.getFullYear() },
          take: 1,
        },
        schedules: {
          where: { date: { gte: today, lt: tomorrow } },
          include: { staff: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.task.findMany({
      where: { status: "pending" },
      include: { store: { select: { id: true, name: true } } },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
    }),
    prisma.weeklyChecklist.findFirst({
      where: { weekStartDate: { gte: weekStart, lt: new Date(weekStart.getTime() + 86400000) } },
    }),
    prisma.schedule.findMany({
      where: { date: { gte: nextWeekStart, lte: nextWeekEnd } },
    }),
  ]);

  const storesWithNextWeek = new Set(nextWeekSchedules.map((s) => s.storeId));
  const storesMissingSchedule = stores
    .filter((s) => !storesWithNextWeek.has(s.id))
    .map((s) => ({ id: s.id, name: s.name }));

  return (
    <DashboardClient
      stores={JSON.parse(JSON.stringify(stores))}
      tasks={JSON.parse(JSON.stringify(tasks))}
      checklist={checklist ? JSON.parse(JSON.stringify(checklist)) : null}
      weekStart={weekStart.toISOString()}
      storesMissingSchedule={storesMissingSchedule}
      today={today.toISOString()}
    />
  );
}
