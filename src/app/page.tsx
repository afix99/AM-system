import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getWeekDates } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDates = getWeekDates(today);
  const weekStart = weekDates[0];

  const [stores, tasks, checklist] = await Promise.all([
    prisma.store.findMany({
      where: { status: "active" },
      include: {
        staff: { where: { status: "active" } },
        stockItems: true,
        performances: {
          where: { month: today.getMonth() + 1, year: today.getFullYear() },
          take: 1,
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
  ]);

  return (
    <DashboardClient
      stores={JSON.parse(JSON.stringify(stores))}
      tasks={JSON.parse(JSON.stringify(tasks))}
      checklist={checklist ? JSON.parse(JSON.stringify(checklist)) : null}
      weekStart={weekStart.toISOString()}
      today={today.toISOString()}
    />
  );
}
