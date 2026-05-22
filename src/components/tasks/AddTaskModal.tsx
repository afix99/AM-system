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
    } finally { setSaving(false); }
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40";
  const labelCls = "block text-sm font-medium text-stone-500 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.6)", paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}>
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: "#262220" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h2 className="font-semibold text-stone-200">{initialTask ? "Edit Task" : "Add Task"}</h2>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-400 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input autoFocus type="text" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }}
              className={inputCls} placeholder="What needs to be done?" />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(Number(e.target.value))} className={inputCls} style={{ colorScheme: "dark" }}>
                <option value={1} style={{ background: "#262220" }}>🔴 Urgent</option>
                <option value={2} style={{ background: "#262220" }}>🟠 High</option>
                <option value={3} style={{ background: "#262220" }}>🔵 Medium</option>
                <option value={4} style={{ background: "#262220" }}>⚪ Low</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} style={{ colorScheme: "dark" }} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Store</label>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className={inputCls} style={{ colorScheme: "dark" }}>
              <option value="" style={{ background: "#262220" }}>All Stores</option>
              {stores.map((s) => <option key={s.id} value={s.id} style={{ background: "#262220" }}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className={`${inputCls} resize-none`} placeholder="Optional notes..." />
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
