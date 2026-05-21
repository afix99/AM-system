"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Plus, Check, ChevronRight, TrendingUp, Package, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { formatDate, formatCurrency, getPriorityColor, getPriorityLabel, getAchievementBg, getWeekLabel, getWeekDates } from "@/lib/utils";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";

type ChecklistItem = { id: string; text: string; type: string; visitNote?: string };

interface Props {
  stores: any[];
  tasks: any[];
  checklist: { id: string; items: string; completedItems: string } | null;
  weekStart: string;
  storesMissingSchedule: { id: string; name: string }[];
  today: string;
}

export function DashboardClient({ stores, tasks: initialTasks, checklist: initialChecklist, weekStart, storesMissingSchedule, today }: Props) {
  const { toast } = useToast();
  const weekDates = getWeekDates(new Date(weekStart));
  const weekLabel = getWeekLabel(weekDates);
  const todayDate = new Date(today);
  const dayOfWeek = todayDate.getDay(); // 0=Sun, 3=Wed
  const showScheduleWarning = dayOfWeek >= 3 && storesMissingSchedule.length > 0;

  const [tasks, setTasks] = useState(initialTasks);
  const [showAddTask, setShowAddTask] = useState(false);

  // Checklist state
  const defaultItems: ChecklistItem[] = [
    { id: "1", text: "Create schedules for all 5 stores", type: "standard" },
    { id: "2", text: "Check stock levels for all stores", type: "standard" },
    { id: "3", text: "Review last week's sales figures", type: "standard" },
    { id: "4", text: "Submit weekly performance notes", type: "standard" },
    { id: "5", text: "Follow up on pending tasks", type: "standard" },
    { id: "6", text: "Visit stores", type: "visit", visitNote: "" },
    { id: "7", text: "Team check-in call", type: "standard" },
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">{weekLabel}</p>
      </div>

      {/* Schedule warning banner */}
      {showScheduleWarning && (
        <Link href="/schedule" className="block">
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-yellow-800 text-sm">
            <AlertTriangle size={18} className="shrink-0 text-yellow-600" />
            <span className="flex-1">
              <strong>Schedule not set for next week:</strong>{" "}
              {storesMissingSchedule.map((s) => s.name).join(", ")}
            </span>
            <ArrowRight size={16} />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Checklist */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>This Week</CardTitle>
                <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                  {completed.length}/{items.length} done
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: items.length > 0 ? `${(completed.length / items.length) * 100}%` : "0%" }}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3 group">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        completed.includes(item.id)
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {completed.includes(item.id) && <Check size={12} strokeWidth={3} />}
                    </button>
                    <span className={`flex-1 text-sm ${completed.includes(item.id) ? "line-through text-slate-400" : "text-slate-700"}`}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 text-xs transition-opacity"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                  placeholder="Add item..."
                  className="flex-1 text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-slate-400"
                />
                <button onClick={addItem} className="text-slate-500 hover:text-slate-700 px-2">
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
                <div className="py-10 text-center text-slate-400 text-sm">
                  No pending tasks.
                  <button className="ml-1 text-slate-600 underline" onClick={() => setShowAddTask(true)}>Add one?</button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {sortedTasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < todayDate;
                    return (
                      <li key={task.id} className={`flex items-start gap-3 px-4 py-3 ${isOverdue ? "bg-red-50" : ""}`}>
                        <Badge className={`mt-0.5 shrink-0 ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isOverdue ? "text-red-700" : "text-slate-900"}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {task.store && (
                              <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {task.store.name}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-slate-400"}`}>
                                {isOverdue ? "Overdue · " : "Due "}
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => markTaskDone(task.id)}
                          className="shrink-0 text-xs text-green-600 hover:text-green-700 font-medium border border-green-200 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                        >
                          Done
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="px-4 py-3 border-t border-slate-100">
                <Link href="/tasks" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
                  View all tasks <ChevronRight size={14} />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Store Snapshot */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Store Snapshot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stores.map((store) => {
            const perf = store.performances?.[0];
            const achievement = perf && perf.targetSales > 0
              ? Math.round((perf.totalSales / perf.targetSales) * 100)
              : null;
            const lowStock = store.stockItems.filter((i: any) => i.quantity <= i.minStockLevel).length;
            const todayStaff = store.schedules.filter((s: any) => s.shiftType !== "Off").length;

            return (
              <Link key={store.id} href={`/stores/${store.id}`}>
                <Card className="hover:border-slate-300 hover:shadow transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{store.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{store.managerName}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 mt-0.5" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <Users size={12} />
                        </div>
                        <p className="text-sm font-bold text-slate-900">{todayStaff}</p>
                        <p className="text-xs text-slate-400">Today</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className={`text-sm font-bold ${achievement !== null ? (achievement >= 100 ? "text-green-600" : achievement >= 80 ? "text-yellow-600" : "text-red-600") : "text-slate-400"}`}>
                          {achievement !== null ? `${achievement}%` : "–"}
                        </p>
                        <p className="text-xs text-slate-400">Sales</p>
                      </div>
                      <div className={`rounded-lg p-2 ${lowStock > 0 ? "bg-red-50" : "bg-slate-50"}`}>
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <Package size={12} className={lowStock > 0 ? "text-red-400" : ""} />
                        </div>
                        <p className={`text-sm font-bold ${lowStock > 0 ? "text-red-600" : "text-slate-900"}`}>{lowStock}</p>
                        <p className={`text-xs ${lowStock > 0 ? "text-red-400" : "text-slate-400"}`}>Low stock</p>
                      </div>
                    </div>
                    {perf && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">This month</span>
                        <span className="text-xs font-medium text-slate-700">{formatCurrency(perf.totalSales)} / {formatCurrency(perf.targetSales)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
