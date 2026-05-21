"use client";
import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { formatDate, getPriorityColor, getPriorityLabel } from "@/lib/utils";
import { AddTaskModal } from "./AddTaskModal";

const FILTERS = ["All", "Urgent", "High", "Medium", "Low"] as const;

export function TasksClient({ initialTasks, stores }: { initialTasks: any[]; stores: { id: string; name: string }[] }) {
  const { toast } = useToast();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<string>("All");
  const [storeFilter, setStoreFilter] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);

  const pending = tasks.filter((t) => t.status === "pending");
  const done = tasks.filter((t) => t.status === "done");

  const filtered = pending.filter((t) => {
    if (filter === "Urgent" && t.priority !== 1) return false;
    if (filter === "High" && t.priority !== 2) return false;
    if (filter === "Medium" && t.priority !== 3) return false;
    if (filter === "Low" && t.priority !== 4) return false;
    if (storeFilter && t.storeId !== storeFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aOv = a.dueDate && new Date(a.dueDate) < today;
    const bOv = b.dueDate && new Date(b.dueDate) < today;
    if (aOv && !bOv) return -1;
    if (!aOv && bOv) return 1;
    return a.priority - b.priority;
  });

  const markDone = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "done" }) });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "done" } : t));
    toast("Task completed");
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast("Task deleted");
  };

  const TaskRow = ({ task, showDoneBtn = true }: { task: any; showDoneBtn?: boolean }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < today && task.status === "pending";
    return (
      <div className={`flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 last:border-0 ${isOverdue ? "bg-red-50" : ""}`}>
        <Badge className={`mt-0.5 shrink-0 ${getPriorityColor(task.priority)}`}>{getPriorityLabel(task.priority)}</Badge>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isOverdue ? "text-red-700" : task.status === "done" ? "text-slate-400 line-through" : "text-slate-900"}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.store && <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{task.store.name}</span>}
            {task.dueDate && (
              <span className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-slate-400"}`}>
                {isOverdue ? "Overdue · " : "Due "}{formatDate(task.dueDate)}
              </span>
            )}
            {task.notes && <span className="text-xs text-slate-400 truncate max-w-[200px]">{task.notes}</span>}
          </div>
        </div>
        {showDoneBtn && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => { setEditTask(task); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100">
              <Pencil size={14} />
            </button>
            <button onClick={() => markDone(task.id)} className="text-xs text-green-600 hover:text-green-700 font-medium border border-green-200 hover:bg-green-50 px-2 py-1 rounded transition-colors">
              Done
            </button>
            <button onClick={() => deleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Manage</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Tasks</h1>
        </div>
        <Button size="sm" onClick={() => { setEditTask(null); setShowModal(true); }}>
          <Plus size={14} /> Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}>
            {f}
          </button>
        ))}
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}
          className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-600 focus:outline-none">
          <option value="">All Stores</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No tasks{filter !== "All" ? ` matching "${filter}"` : ""}.
              <button onClick={() => { setEditTask(null); setShowModal(true); }} className="ml-1 text-slate-600 underline">Add one?</button>
            </div>
          ) : (
            sorted.map((task) => <TaskRow key={task.id} task={task} />)
          )}
        </CardContent>
      </Card>

      {/* Done section */}
      {done.length > 0 && (
        <div>
          <button onClick={() => setShowDone(!showDone)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 mb-2">
            {showDone ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Completed ({done.length})
          </button>
          {showDone && (
            <Card>
              <CardContent className="p-0">
                {done.map((task) => <TaskRow key={task.id} task={task} showDoneBtn={false} />)}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {showModal && (
        <AddTaskModal
          stores={stores}
          initialTask={editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={(saved) => {
            setTasks((prev) => {
              const exists = prev.find((t) => t.id === saved.id);
              return exists ? prev.map((t) => t.id === saved.id ? saved : t) : [saved, ...prev];
            });
            setShowModal(false);
            setEditTask(null);
            toast(editTask ? "Task updated" : "Task added");
          }}
        />
      )}
    </div>
  );
}
