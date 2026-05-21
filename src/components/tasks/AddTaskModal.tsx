"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  stores: { id: string; name: string }[];
  onClose: () => void;
  onSave: (task: any) => void;
  initialTask?: any;
}

export function AddTaskModal({ stores, onClose, onSave, initialTask }: Props) {
  const [title, setTitle] = useState(initialTask?.title || "");
  const [storeId, setStoreId] = useState(initialTask?.storeId || "");
  const [priority, setPriority] = useState(initialTask?.priority || 3);
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ? initialTask.dueDate.slice(0, 10) : "");
  const [notes, setNotes] = useState(initialTask?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    try {
      const url = initialTask ? `/api/tasks/${initialTask.id}` : "/api/tasks";
      const method = initialTask ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), storeId: storeId || null, priority: Number(priority), dueDate: dueDate || null, notes: notes || null }),
      });
      const task = await res.json();
      onSave(task);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{initialTask ? "Edit Task" : "Add Task"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
              placeholder="What needs to be done?"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400">
                <option value={1}>🔴 Urgent</option>
                <option value={2}>🟠 High</option>
                <option value={3}>🔵 Medium</option>
                <option value={4}>⚪ Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Store</label>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400">
              <option value="">All Stores</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 resize-none"
              placeholder="Optional notes..." />
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : initialTask ? "Save Changes" : "Add Task"}
          </Button>
        </div>
      </div>
    </div>
  );
}
