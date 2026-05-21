import { prisma } from "@/lib/prisma";
import { TasksClient } from "@/components/tasks/TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, stores] = await Promise.all([
    prisma.task.findMany({
      include: { store: { select: { id: true, name: true } } },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
    }),
    prisma.store.findMany({ where: { status: "active" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <TasksClient
      initialTasks={JSON.parse(JSON.stringify(tasks))}
      stores={stores}
    />
  );
}
