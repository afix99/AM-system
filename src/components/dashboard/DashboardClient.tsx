"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Check, ChevronRight, Users, X, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ClaudeSparkle } from "@/components/ui/ClaudeSparkle";
import { useToast } from "@/components/ui/Toaster";
import { formatDate, getPriorityColor, getPriorityLabel, getWeekLabel, getWeekDates } from "@/lib/utils";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";

type ChecklistItem = { id: string; text: string; type: string; visitNote?: string };

interface StoreLite {
  id: string;
  name: string;
  location: string;
  managerName: string;
  staff: { id: string }[];
}

interface Task {
  id: string;
  title: string;
  priority: number;
  status: string;
  dueDate: string | null;
  store: { id: string; name: string } | null;
}

interface Props {
  stores: StoreLite[];
  tasks: Task[];
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
    { id: "1", text: "Visit stores", type: "visit", visitNote: "" },
    { id: "2", text: "Review pending tasks", type: "standard" },
    { id: "3", text: "Check shift schedules", type: "standard" },
    { id: "4", text: "Team check-in call", type: "standard" },
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
  const totalStaff = stores.reduce((sum, s) => sum + s.staff.length, 0);
  const pendingTaskCount = tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
      <div
        className="relative overflow-hidden rounded-3xl border border-[#D97756]/20 p-6 md:p-8"
        style={{ background: "radial-gradient(circle at 85% 50%, rgba(217,119,86,0.18) 0%, rgba(217,119,86,0.05) 40%, transparent 70%), linear-gradient(135deg, #2a1f17 0%, #1c1917 100%)" }}
      >
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#D97756] uppercase tracking-widest mb-1">Overview</p>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-100">Dashboard</h1>
            <p className="text-stone-400 text-sm mt-1">{weekLabel}</p>
          </div>
          <ClaudeSparkle size={120} className="shrink-0 claude-sparkle-float" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 border border-white/[0.07]" style={{ background: "linear-gradient(135deg, #2d1f14 0%, #262220 100%)" }}>
          <p className="text-xs text-stone-500 mb-1">Stores</p>
          <p className="text-2xl font-bold text-stone-100">{stores.length}</p>
          <p className="text-xs text-[#D97756] mt-1">Active</p>
        </div>
        <div className="rounded-2xl p-4 border border-white/[0.07]" style={{ background: "linear-gradient(135deg, #1c1917 0%, #262220 100%)" }}>
          <p className="text-xs text-stone-500 mb-1">Staff</p>
          <p className="text-2xl font-bold text-stone-100">{totalStaff}</p>
          <p className="text-xs text-stone-600 mt-1">active</p>
        </div>
        <div className="rounded-2xl p-4 border border-white/[0.07]" style={{ background: "linear-gradient(135deg, #1c1917 0%, #262220 100%)" }}>
          <p className="text-xs text-stone-500 mb-1">Tasks</p>
          <p className="text-2xl font-bold text-stone-100">{pendingTaskCount}</p>
          <p className="text-xs text-amber-500 mt-1">pending</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>This Week</CardTitle>
                <span className="text-xs text-stone-500 font-medium bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.07]">
                  {completed.length}/{items.length}
                </span>
              </div>
              <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: progress >= 100 ? "#10b981" : "linear-gradient(90deg, #D97756, #E8926A)",
                  }}
                />
              </div>
              <p className="text-xs text-stone-600 mt-1">{progress}% complete</p>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-white/[0.04]">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-white/[0.02]">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        completed.includes(item.id)
                          ? "bg-[#D97756] border-[#D97756] text-white"
                          : "border-white/20 hover:border-[#D97756]/60"
                      }`}
                    >
                      {completed.includes(item.id) && <Check size={10} strokeWidth={3} />}
                    </button>
                    <span className={`flex-1 text-sm transition-colors ${completed.includes(item.id) ? "line-through text-stone-600" : "text-stone-300"}`}>
                      {item.text}
                    </span>
                    <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-red-400 transition-all">
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
                  className="flex-1 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-stone-300 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40"
                />
                <button onClick={addItem} className="text-stone-500 hover:text-[#D97756] transition-colors px-2">
                  <Plus size={16} />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

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
                <div className="py-10 text-center text-stone-600 text-sm">
                  No pending tasks.{" "}
                  <button className="text-[#D97756] hover:text-[#E8926A] underline" onClick={() => setShowAddTask(true)}>
                    Add one?
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {sortedTasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < todayDate;
                    return (
                      <li key={task.id} className={`flex items-start gap-3 px-4 py-3 ${isOverdue ? "bg-red-950/20" : "hover:bg-white/[0.02]"}`}>
                        <Badge className={`mt-0.5 shrink-0 ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isOverdue ? "text-red-400" : "text-stone-200"}`}>{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {task.store && (
                              <span className="text-xs text-stone-500 bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.07]">
                                {task.store.name}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className={`text-xs ${isOverdue ? "text-red-500 font-semibold" : "text-stone-600"}`}>
                                {isOverdue ? "Overdue · " : "Due "}{formatDate(task.dueDate)}
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
                <Link href="/tasks" className="text-sm text-stone-600 hover:text-stone-300 flex items-center gap-1 transition-colors">
                  View all tasks <ChevronRight size={14} />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Store size={14} className="text-[#D97756]" />
          Stores
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {stores.map((store) => (
            <Link key={store.id} href={`/stores/${store.id}`}>
              <div className="rounded-2xl border border-white/[0.07] bg-[#262220] hover:border-[#D97756]/30 hover:bg-[#2E2420] transition-all cursor-pointer group p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-[#D97756]/20 flex items-center justify-center shrink-0 group-hover:border-[#D97756]/40 transition-colors" style={{ background: "rgba(217,119,86,0.08)" }}>
                  <Store size={18} className="text-[#D97756]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-200 text-sm group-hover:text-white transition-colors truncate">{store.name}</p>
                  <p className="text-xs text-stone-600 truncate">{store.managerName || "—"}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-stone-600">
                    <Users size={11} /> {store.staff.length} staff
                  </div>
                </div>
                <ChevronRight size={15} className="text-stone-700 group-hover:text-[#D97756] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showAddTask && (
        <AddTaskModal
          stores={stores.map((s) => ({ id: s.id, name: s.name }))}
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
