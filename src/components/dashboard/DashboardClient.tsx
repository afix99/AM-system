"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Plus, Check, ChevronRight, TrendingUp, Package, Users, ArrowRight, X } from "lucide-react";
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
  storesMissingSchedule: { id: string; name: string }[];
  today: string;
}

export function DashboardClient({ stores, tasks: initialTasks, checklist: initialChecklist, weekStart, storesMissingSchedule, today }: Props) {
  const { toast } = useToast();
  const weekDates = getWeekDates(new Date(weekStart));
  const weekLabel = getWeekLabel(weekDates);
  const todayDate = new Date(today);
  const dayOfWeek = todayDate.getDay();
  const showScheduleWarning = dayOfWeek >= 3 && storesMissingSchedule.length > 0;

  const [tasks, setTasks] = useState(initialTasks);
  const [showAddTask, setShowAddTask] = useState(false);

  const defaultItems: ChecklistItem[] = [
    { id: "1", text: "Create schedules for all stores", type: "standard" },
    { id: "2", text: "Check stock levels for all stores", type: "standard" },
    { id: "3", text: "Review last week's sales figures", type: "standard" },
    { id: "4", text: "Submit weekly performance notes", type: "standard" },
    { id: "5", text: "Follow up on pending tasks", type: "standard" },
    { id: "6", text: "Visit stores", type: "visit" },
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
    toast("Task completed");
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const aOverdue = a.dueDate && new Date(a.dueDate) < todayDate;
    const bOverdue = b.dueDate && new Date(b.dueDate) < todayDate;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return a.priority - b.priority;
  });

  const completionPct = items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const todayLabel = `${dayNames[todayDate.getDay()]}, ${todayDate.getDate()} ${monthNames[todayDate.getMonth()]}`;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{weekLabel}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Dashboard</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Today</p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">{todayLabel}</p>
        </div>
      </div>

      {/* Schedule warning */}
      {showScheduleWarning && (
        <Link href="/schedule" className="block">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-800 text-sm">
            <AlertTriangle size={16} className="shrink-0 text-amber-500" />
            <span className="flex-1 font-medium">
              Next week schedule missing:{" "}
              <span className="font-normal">{storesMissingSchedule.map((s) => s.name).join(", ")}</span>
            </span>
            <ArrowRight size={15} className="text-amber-500" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Checklist */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>This Week</CardTitle>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  completionPct === 100 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {completed.length}/{items.length}
                </span>
              </div>
              <div className="mt-2.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${completionPct === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul>
                {items.map((item) => {
                  const done = completed.includes(item.id);
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 group">
                      <button
                        onClick={() => toggleItem(item.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          done ? "bg-indigo-600 border-indigo-600" : "border-slate-200 hover:border-indigo-400"
                        }`}
                      >
                        {done && <Check size={11} strokeWidth={3} className="text-white" />}
                      </button>
                      <span className={`flex-1 text-sm ${done ? "line-through text-slate-300" : "text-slate-700"}`}>
                        {item.text}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-opacity"
                      >
                        <X size={13} />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                  placeholder="Add item..."
                  className="flex-1 text-sm text-slate-700 placeholder:text-slate-300 border-0 outline-none bg-transparent"
                />
                <button
                  onClick={addItem}
                  className="w-7 h-7 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg flex items-center justify-center text-slate-400 transition-colors"
                >
                  <Plus size={14} />
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
                  <Plus size={13} /> Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {sortedTasks.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-400 text-sm">All clear — no pending tasks.</p>
                  <button onClick={() => setShowAddTask(true)} className="mt-2 text-xs text-indigo-600 hover:underline font-medium">
                    Add a task
                  </button>
                </div>
              ) : (
                <ul>
                  {sortedTasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < todayDate;
                    return (
                      <li
                        key={task.id}
                        className={`flex items-start gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 ${
                          isOverdue ? "bg-red-50/60" : ""
                        }`}
                      >
                        <Badge className={`mt-0.5 shrink-0 ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-snug ${isOverdue ? "text-red-700" : "text-slate-800"}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {task.store && (
                              <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                {task.store.name}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className={`text-xs ${isOverdue ? "text-red-500 font-semibold" : "text-slate-400"}`}>
                                {isOverdue ? "Overdue · " : "Due "}{formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => markTaskDone(task.id)}
                          className="shrink-0 text-xs text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Done
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="px-4 py-3 border-t border-slate-100">
                <Link href="/tasks" className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-medium transition-colors">
                  View all tasks <ChevronRight size={13} />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Store Snapshot */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Store Snapshot</h2>
          <Link href="/stores" className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-medium transition-colors">
            All stores <ChevronRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stores.map((store) => {
            const perf = store.performances?.[0];
            const achievement = perf && perf.targetSales > 0
              ? Math.round((perf.totalSales / perf.targetSales) * 100)
              : null;
            const lowStock = store.stockItems.filter((i: any) => i.quantity <= i.minStockLevel).length;
            const todayStaff = store.schedules.filter((s: any) => s.shiftType !== "Off").length;
            const achievementColor = achievement === null ? null : achievement >= 100 ? "emerald" : achievement >= 80 ? "amber" : "red";

            return (
              <Link key={store.id} href={`/stores/${store.id}`}>
                <Card className="hover:shadow-md hover:border-slate-300 transition-all cursor-pointer h-full">
                  <CardContent className="p-4">
                    {/* Store header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{store.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{store.managerName}</p>
                      </div>
                      {achievement !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                          achievementColor === "emerald" ? "bg-emerald-50 text-emerald-700" :
                          achievementColor === "amber" ? "bg-amber-50 text-amber-700" :
                          "bg-red-50 text-red-700"
                        }`}>
                          {achievement}%
                        </span>
                      )}
                    </div>

                    {/* Sales progress */}
                    {perf ? (
                      <div className="mb-3">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              achievementColor === "emerald" ? "bg-emerald-500" :
                              achievementColor === "amber" ? "bg-amber-400" : "bg-red-400"
                            }`}
                            style={{ width: `${Math.min(achievement ?? 0, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span className="font-medium text-slate-600">{formatCurrency(perf.totalSales)}</span>
                          <span>/ {formatCurrency(perf.targetSales)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <div className="h-1.5 bg-slate-100 rounded-full mb-1.5" />
                        <p className="text-xs text-slate-400">No sales recorded</p>
                      </div>
                    )}

                    {/* Footer stats */}
                    <div className="flex items-center gap-3 pt-2.5 border-t border-slate-50 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users size={11} className="text-slate-300" />
                        {todayStaff} on shift
                      </span>
                      {lowStock > 0 ? (
                        <span className="flex items-center gap-1 text-red-500 font-medium">
                          <Package size={11} />
                          {lowStock} low stock
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Package size={11} className="text-slate-300" />
                          Stock OK
                        </span>
                      )}
                    </div>
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
