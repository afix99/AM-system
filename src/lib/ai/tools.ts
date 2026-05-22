import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { prisma } from "@/lib/prisma";

export const aiTools = [
  betaZodTool({
    name: "get_dashboard_summary",
    description:
      "Get a high-level snapshot of the whole business right now: number of active stores, total staff, this month's total sales vs target, count of low-stock items, count of pending tasks. Use this when the user asks 'how are we doing', 'give me an overview', 'morning briefing', or similar broad questions.",
    inputSchema: z.object({}),
    run: async () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [stores, staff, performance, stock, tasks] = await Promise.all([
        prisma.store.count({ where: { status: "active" } }),
        prisma.staff.count({ where: { status: "active" } }),
        prisma.storePerformance.aggregate({
          where: { month, year },
          _sum: { totalSales: true, targetSales: true },
        }),
        prisma.stockItem.findMany({ select: { quantity: true, minStockLevel: true } }),
        prisma.task.count({ where: { status: { not: "completed" } } }),
      ]);

      const lowStock = stock.filter((s) => s.quantity <= s.minStockLevel).length;
      const totalSales = performance._sum.totalSales ?? 0;
      const targetSales = performance._sum.targetSales ?? 0;
      const achievementPct = targetSales > 0 ? Math.round((totalSales / targetSales) * 100) : 0;

      return JSON.stringify({
        activeStores: stores,
        activeStaff: staff,
        currentMonth: `${month}/${year}`,
        salesThisMonth: totalSales,
        targetThisMonth: targetSales,
        achievementPercent: achievementPct,
        lowStockItemsCount: lowStock,
        pendingTasksCount: tasks,
      });
    },
  }),

  betaZodTool({
    name: "list_stores",
    description:
      "List all active stores with basic info (name, location, manager, monthly target). Use this when the user asks about stores in general, wants to see all stores, or needs store IDs to investigate further.",
    inputSchema: z.object({}),
    run: async () => {
      const stores = await prisma.store.findMany({
        where: { status: "active" },
        orderBy: { name: "asc" },
        include: {
          staff: { where: { status: "active" }, select: { id: true } },
        },
      });
      return JSON.stringify(
        stores.map((s) => ({
          id: s.id,
          name: s.name,
          location: s.location,
          manager: s.managerName,
          phone: s.phone,
          monthlyTarget: s.targetMonthlySales,
          activeStaffCount: s.staff.length,
        })),
      );
    },
  }),

  betaZodTool({
    name: "get_store_details",
    description:
      "Get detailed info about a specific store: staff list, stock summary, this month's performance, and recent attendance. Use when the user asks about a specific store by name.",
    inputSchema: z.object({
      storeName: z.string().describe("Store name (or partial name match)"),
    }),
    run: async ({ storeName }) => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const store = await prisma.store.findFirst({
        where: { name: { contains: storeName }, status: "active" },
        include: {
          staff: { where: { status: "active" }, orderBy: { name: "asc" } },
          stockItems: true,
          performances: { where: { month, year } },
        },
      });
      if (!store) return JSON.stringify({ error: `No store found matching "${storeName}"` });

      const perf = store.performances[0];
      const lowStock = store.stockItems.filter((s) => s.quantity <= s.minStockLevel);
      const totalStockValue = store.stockItems.reduce(
        (sum, s) => sum + s.quantity * s.sellingPrice,
        0,
      );

      return JSON.stringify({
        id: store.id,
        name: store.name,
        location: store.location,
        manager: store.managerName,
        phone: store.phone,
        monthlyTarget: store.targetMonthlySales,
        staff: store.staff.map((s) => ({ id: s.id, name: s.name, role: s.role })),
        thisMonthSales: perf?.totalSales ?? 0,
        thisMonthTarget: perf?.targetSales ?? 0,
        thisMonthAchievementPct:
          perf && perf.targetSales > 0
            ? Math.round((perf.totalSales / perf.targetSales) * 100)
            : null,
        totalStockUnits: store.stockItems.reduce((s, i) => s + i.quantity, 0),
        stockTypesCount: store.stockItems.length,
        lowStockItemsCount: lowStock.length,
        stockValueRM: Math.round(totalStockValue),
      });
    },
  }),

  betaZodTool({
    name: "get_performance_ranking",
    description:
      "Get sales performance ranking of all stores for a specific month — sorted by achievement percentage. Use for 'who's performing best/worst', 'top performers', 'underperformers', 'sales ranking'.",
    inputSchema: z.object({
      month: z.number().min(1).max(12).describe("Month number 1-12").optional(),
      year: z.number().describe("Four-digit year").optional(),
    }),
    run: async ({ month, year }) => {
      const now = new Date();
      const m = month ?? now.getMonth() + 1;
      const y = year ?? now.getFullYear();
      const perfs = await prisma.storePerformance.findMany({
        where: { month: m, year: y },
        include: { store: true },
      });
      const ranked = perfs
        .map((p) => ({
          store: p.store.name,
          sales: p.totalSales,
          target: p.targetSales,
          achievement: p.targetSales > 0 ? Math.round((p.totalSales / p.targetSales) * 100) : 0,
        }))
        .sort((a, b) => b.achievement - a.achievement)
        .map((p, i) => ({ rank: i + 1, ...p }));
      return JSON.stringify({ month: m, year: y, ranking: ranked });
    },
  }),

  betaZodTool({
    name: "get_low_stock_items",
    description:
      "List stock items at or below minimum stock level. Includes which store they're in, category, current quantity, and minimum threshold. Critical for restock decisions.",
    inputSchema: z.object({
      storeName: z.string().describe("Optional store name to filter").optional(),
    }),
    run: async ({ storeName }) => {
      const where: { store?: { name: { contains: string } } } = {};
      if (storeName) where.store = { name: { contains: storeName } };
      const items = await prisma.stockItem.findMany({
        where,
        include: { store: { select: { name: true } } },
        orderBy: [{ quantity: "asc" }],
      });
      const low = items.filter((i) => i.quantity <= i.minStockLevel);
      return JSON.stringify(
        low.map((i) => ({
          store: i.store.name,
          product: i.productName,
          category: i.category,
          size: i.size,
          color: i.color,
          currentQuantity: i.quantity,
          minStockLevel: i.minStockLevel,
          deficit: i.minStockLevel - i.quantity,
        })),
      );
    },
  }),

  betaZodTool({
    name: "get_tasks",
    description:
      "List tasks, optionally filtered by status and store. Returns title, priority (1=urgent, 2=high, 3=medium, 4=low), due date, and which store it's linked to.",
    inputSchema: z.object({
      status: z
        .enum(["pending", "in_progress", "completed"])
        .describe("Task status filter")
        .optional(),
      storeName: z.string().describe("Optional store name to filter").optional(),
    }),
    run: async ({ status, storeName }) => {
      const where: { status?: string; store?: { name: { contains: string } } } = {};
      if (status) where.status = status;
      if (storeName) where.store = { name: { contains: storeName } };
      const tasks = await prisma.task.findMany({
        where,
        include: { store: { select: { name: true } } },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
        take: 50,
      });
      return JSON.stringify(
        tasks.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate?.toISOString().split("T")[0] ?? null,
          store: t.store?.name ?? null,
          notes: t.notes,
        })),
      );
    },
  }),

  betaZodTool({
    name: "create_task",
    description:
      "Create a new task. Use when the user explicitly asks to add/create a task or assigns work that should be tracked. Confirm details with the user first if anything is unclear.",
    inputSchema: z.object({
      title: z.string().describe("Short task title"),
      priority: z
        .number()
        .min(1)
        .max(4)
        .describe("1=urgent, 2=high, 3=medium, 4=low"),
      dueDate: z
        .string()
        .describe("Due date in YYYY-MM-DD format")
        .optional(),
      storeName: z.string().describe("Linked store name (optional)").optional(),
      notes: z.string().describe("Additional notes").optional(),
    }),
    run: async ({ title, priority, dueDate, storeName, notes }) => {
      let storeId: string | null = null;
      if (storeName) {
        const store = await prisma.store.findFirst({
          where: { name: { contains: storeName }, status: "active" },
        });
        storeId = store?.id ?? null;
      }
      const task = await prisma.task.create({
        data: {
          title,
          priority,
          status: "pending",
          dueDate: dueDate ? new Date(dueDate) : null,
          storeId,
          notes: notes ?? null,
        },
      });
      return JSON.stringify({ created: true, taskId: task.id, title: task.title });
    },
  }),

  betaZodTool({
    name: "mark_task_done",
    description:
      "Mark a task as completed. Search by exact task title or partial match.",
    inputSchema: z.object({
      taskTitle: z.string().describe("Task title (or partial match)"),
    }),
    run: async ({ taskTitle }) => {
      const task = await prisma.task.findFirst({
        where: { title: { contains: taskTitle }, status: { not: "completed" } },
      });
      if (!task) return JSON.stringify({ error: `No pending task found matching "${taskTitle}"` });
      await prisma.task.update({
        where: { id: task.id },
        data: { status: "completed" },
      });
      return JSON.stringify({ completed: true, title: task.title });
    },
  }),

  betaZodTool({
    name: "get_attendance",
    description:
      "Get attendance records for a store on a specific date. Shows who was present, absent, or on leave.",
    inputSchema: z.object({
      storeName: z.string().describe("Store name"),
      date: z
        .string()
        .describe("Date in YYYY-MM-DD format (defaults to today)")
        .optional(),
    }),
    run: async ({ storeName, date }) => {
      const store = await prisma.store.findFirst({
        where: { name: { contains: storeName }, status: "active" },
      });
      if (!store) return JSON.stringify({ error: `No store matching "${storeName}"` });
      const d = date ? new Date(date) : new Date();
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const records = await prisma.attendance.findMany({
        where: { storeId: store.id, date: { gte: d, lt: next } },
        include: { staff: { select: { name: true, role: true } } },
      });
      return JSON.stringify({
        store: store.name,
        date: d.toISOString().split("T")[0],
        records: records.map((r) => ({
          staff: r.staff.name,
          role: r.staff.role,
          status: r.status,
          notes: r.notes,
        })),
      });
    },
  }),

  betaZodTool({
    name: "get_staff_ratings",
    description:
      "Get staff performance ratings (1-5 stars) for a given month, optionally filtered by store. Use for 'best staff', 'who needs training', 'staff reviews'.",
    inputSchema: z.object({
      month: z.number().min(1).max(12).optional(),
      year: z.number().optional(),
      storeName: z.string().optional(),
    }),
    run: async ({ month, year, storeName }) => {
      const now = new Date();
      const m = month ?? now.getMonth() + 1;
      const y = year ?? now.getFullYear();
      const where: { month: number; year: number; store?: { name: { contains: string } } } = {
        month: m,
        year: y,
      };
      if (storeName) where.store = { name: { contains: storeName } };
      const ratings = await prisma.staffPerformance.findMany({
        where,
        include: {
          staff: { select: { name: true, role: true } },
          store: { select: { name: true } },
        },
        orderBy: { rating: "desc" },
      });
      return JSON.stringify(
        ratings.map((r) => ({
          staff: r.staff.name,
          role: r.staff.role,
          store: r.store.name,
          rating: r.rating,
          notes: r.notes,
        })),
      );
    },
  }),
];
