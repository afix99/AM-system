"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Check, ChevronRight, Package, Users, X, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { formatDate, formatCurrency, getPriorityColor, getPriorityLabel, getWeekLabel, getWeekDates } from "@/lib/utils";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";

type ChecklistItem = { id: string; text: string; type: string; visitNote?: string };

interface Props {
  stores: any[];
  tasks: any[];
  checklist: { id: string; items: string; completedItems: string } | null;
  weekStart: string;
  today: string;
}

export function DashboardClient({ stores, tasks: initialTasks, checklist: initialChecklist, weekStart, today }: Props) {
  const { toast } = useToast();
  const weekDates = getWeekDates(new Date(weekStart));
  const weekLabel = getWeekLabel(weekDates);
  const todayDate = new Date(today);

  const [tasks, setTasks] = useState(initialTasks);
  const [showAddTask, setShowAddTask] = useState(false);

  const defaultItems: ChecklistItem[] = [
    { id: "1", text: "Check stock levels for all stores", type: "standard" },
    { id: "2", text: "Review last week's sales figures", type: "standard" },
    { id: "3", text: "Submit weekly performance notes", type: "standard" },
    { id: "4", text: "Follow up on pending tasks", type: "standard" },
    { id: "5", text: "Visit stores", type: "visit", visitNote: "" },
    { id: "6", text: "Team check-in call", type: "standard" },
  ];

  const parsedItems: ChecklistItem[] = initialChecklist ? JSON.parse(initialChecklist.items) : defaultItems;
  const parsedCompleted: string[] = initialChecklist ? JSON.parse(initialChecklist.completedItems) : [];

  const [items, setItems] = useState<ChecklistItem[]>(parsedItems);
  const [completed, setCompleted] = useState<string[]>(parsedCompleted);
  const [newItemText, setNewItemText] = useState("");

  const saveChecklist = async (newItems: ChecklistItem[], newCompleted: string[]) => {
    await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStartDate: weekStart, items: JSON.stringify(newItems), completedItems: JSON.stringify(newCompleted) }),
    });
  };

  const toggleItem = async (id: string) => {
    const newCompleted = completed.includes(id) ? completed.filter((c) => c !== id) : [...completed, id];
    setCompleted(newCompleted);
    await saveChecklist(items, newCompleted);
  };

  const addItem = async () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = { id: Date.now().toString(), text: newItemText.trim(), type: "standard" };
    const newItems = [...items, newItem];
    setItems(newItems);
    setNewItemText("");
    await saveChecklist(newItems, completed);
  };

  const removeItem = async (id: string) => {
    const newItems = items.filter((i) => i.id !== id);
    const newCompleted = completed.filter((c) => c !== id);
    setItems(newItems);
    setCompleted(newCompleted);
    await saveChecklist(newItems, newCompleted);
  };

  const markTaskDone = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast("Task marked as done");
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const aOverdue = a.dueDate && new Date(a.dueDate) < todayDate;
    const bOverdue = b.dueDate && new Date(b.dueDate) < todayDate;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return a.priority - b.priority;
  });

  const progress = items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0;

  const totalSales = stores.reduce((sum, s) => sum + (s.performances?.[0]?.totalSales || 0), 0);
  const totalTarget = stores.reduce((sum, s) => sum + (s.performances?.[0]?.targetSales || 0), 0);
  const overallAchievement = totalTarget > 0 ? Math.round((totalSales / totalTarget) * 100) : null;
  const lowStockCount = stores.reduce((sum, s) => sum + s.stockItems.filter((i: any) => i.quantity <= i.minStockLevel).length, 0);
  const pendingTaskCount = tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-indigo-400/80 uppercase tracking-widest mb-1">Overview</p>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">{weekLabel}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 border border-white/[0.07]" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #0C1228 100%)" }}>
          <p className="text-xs text-slate-500 mb-1">Stores</p>
          <p className="text-2xl font-bold text-slate-100">{stores.length}</p>
          <p className="text-xs text-indigo-400 mt-1">Active</p>
        </div>
        <div className="rounded-2xl p-4 border border-white/[0.07]" style={{ background: "linear-gradient(135deg, #052e16 0%, #0C1228 100%)" }}>
          <p className="text-xs text-slate-500 mb-1">Sales</p>
          <p className="text-2xl font-bold text-slate-100">{overallAchievement !== null ? `${overallAchievement}%` : "—"}</p>
          <p className="text-xs text-emerald-400 mt-1">vs target</p>
        </div>
        <div className={`rounded-2xl p-4 border border-white/[0.07]`} style={{ background: lowStockCount > 0 ? "linear-gradient(135deg, #3b0764 0%, #0C1228 100%)" : "linear-gradient(135deg, #0c1a2e 0%, #0C1228 100%)" }}>
          <p className="text-xs text-slate-500 mb-1">Low Stock</p>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-red-400" : "text-slate-100"}`}>{lowStockCount}</p>
          <p className={`text-xs mt-1 ${lowStockCount > 0 ? "text-red-500" : "text-slate-600"}`}>items</p>
        </div>
        <div className="rounded-2xl p-4 border border-white/[0.07]" style={{ background: "linear-gradient(135deg, #1c1917 0%, #0C1228 100%)" }}>
          <p className="text-xs text-slate-500 mb-1">Tasks</p>
          <p className="text-2xl font-bold text-slate-100">{pendingTaskCount}</p>
          <p className="text-xs text-amber-500 mt-1">pending</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Checklist */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>This Week</CardTitle>
                <span className="text-xs text-slate-500 font-medium bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.07]">
                  {completed.length}/{items.length}
                </span>
              </div>
              <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: progress >= 100 ? "#10b981" : "linear-gradient(90deg, #6366f1, #818cf8)",
                  }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-1">{progress}% complete</p>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-white/[0.04]">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-white/[0.02]">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        completed.includes(item.id)
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-white/20 hover:border-indigo-400"
                      }`}
                    >
                      {completed.includes(item.id) && <Check size={10} strokeWidth={3} />}
                    </button>
                    <span className={`flex-1 text-sm transition-colors ${completed.includes(item.id) ? "line-through text-slate-600" : "text-slate-300"}`}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 border-t border-white/[0.04] flex gap-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                  placeholder="Add item..."
                  className="flex-1 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                />
                <button onClick={addItem} className="text-slate-500 hover:text-indigo-400 transition-colors px-2">
                  <Plus size={16} />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Board */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Tasks</CardTitle>
                <Button size="sm" onClick={() => setShowAddTask(true)}>
                  <Plus size={14} /> Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {sortedTasks.length === 0 ? (
                <div className="py-10 text-center text-slate-600 text-sm">
                  No pending tasks.{" "}
                  <button className="text-indigo-400 hover:text-indigo-300 underline" onClick={() => setShowAddTask(true)}>
                    Add one?
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {sortedTasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < todayDate;
                    return (
                      <li
                        key={task.id}
                        className={`flex items-start gap-3 px-4 py-3 ${isOverdue ? "bg-red-950/30" : "hover:bg-white/[0.02]"}`}
                      >
                        <Badge className={`mt-0.5 shrink-0 ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isOverdue ? "text-red-400" : "text-slate-200"}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {task.store && (
                              <span className="text-xs text-slate-500 bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.07]">
                                {task.store.name}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className={`text-xs ${isOverdue ? "text-red-500 font-semibold" : "text-slate-600"}`}>
                                {isOverdue ? "Overdue · " : "Due "}
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => markTaskDone(task.id)}
                          className="shrink-0 text-xs text-emerald-400 hover:text-emerald-300 font-medium border border-emerald-500/30 hover:bg-emerald-950/40 px-2 py-1 rounded transition-colors"
                        >
                          Done
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="px-4 py-3 border-t border-white/[0.04]">
                <Link href="/tasks" className="text-sm text-slate-600 hover:text-slate-300 flex items-center gap-1 transition-colors">
                  View all tasks <ChevronRight size={14} />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Store Snapshot */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp size={14} className="text-indigo-400" />
          Store Snapshot
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stores.map((store) => {
            const perf = store.performances?.[0];
            const achievement = perf && perf.targetSales > 0
              ? Math.round((perf.totalSales / perf.targetSales) * 100)
              : null;
            const lowStock = store.stockItems.filter((i: any) => i.quantity <= i.minStockLevel).length;
            const activeStaff = store.staff.length;
            const achieveColor = achievement === null ? "text-slate-500" : achievement >= 100 ? "text-emerald-400" : achievement >= 80 ? "text-amber-400" : "text-red-400";

            return (
              <Link key={store.id} href={`/stores/${store.id}`}>
                <div className="rounded-2xl border border-white/[0.07] bg-[#0C1228] hover:border-indigo-500/30 hover:bg-[#0e1530] transition-all cursor-pointer group p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-200 text-sm group-hover:text-white transition-colors">{store.name}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{store.managerName}</p>
                    </div>
                    <ChevronRight size={15} className="text-slate-700 group-hover:text-indigo-400 transition-colors mt-0.5" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-white/[0.03] rounded-xl p-2 border border-white/[0.05]">
                      <Users size={12} className="mx-auto text-slate-600 mb-0.5" />
                      <p className="text-sm font-bold text-slate-200">{activeStaff}</p>
                      <p className="text-xs text-slate-600">Staff</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-2 border border-white/[0.05]">
                      <p className={`text-sm font-bold ${achieveColor}`}>{achievement !== null ? `${achievement}%` : "—"}</p>
                      <p className="text-xs text-slate-600">Sales</p>
                    </div>
                    <div className={`rounded-xl p-2 border ${lowStock > 0 ? "bg-red-950/30 border-red-500/20" : "bg-white/[0.03] border-white/[0.05]"}`}>
                      <Package size={12} className={`mx-auto mb-0.5 ${lowStock > 0 ? "text-red-500" : "text-slate-600"}`} />
                      <p className={`text-sm font-bold ${lowStock > 0 ? "text-red-400" : "text-slate-200"}`}>{lowStock}</p>
                      <p className={`text-xs ${lowStock > 0 ? "text-red-600" : "text-slate-600"}`}>Low</p>
                    </div>
                  </div>

                  {perf && (
                    <>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(achievement ?? 0, 100)}%`,
                            background: (achievement ?? 0) >= 100 ? "#10b981" : (achievement ?? 0) >= 80 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span className="text-slate-500">{formatCurrency(perf.totalSales)}</span>
                        <span>/ {formatCurrency(perf.targetSales)}</span>
                      </div>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {showAddTask && (
        <AddTaskModal
          stores={stores.map((s: any) => ({ id: s.id, name: s.name }))}
          onClose={() => setShowAddTask(false)}
          onSave={(task) => {
            setTasks((prev) => [...prev, task]);
            setShowAddTask(false);
            toast("Task added");
          }}
        />
      )}
    </div>
  );
}
