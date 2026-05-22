"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, X, Check, Save, Pencil, Sun, Moon, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";

interface ChecklistItem { id: string; text: string }
interface Template { id: string; storeId: string; type: string; items: string }
interface Run { id: string; storeId: string; type: string; date: string; completedItems: string; notes: string | null }

type Mode = "opening" | "closing";

function parseItems(s: string): ChecklistItem[] {
  try { return JSON.parse(s); } catch { return []; }
}
function parseCompleted(s: string): string[] {
  try { return JSON.parse(s); } catch { return []; }
}

function todayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function StoreChecklistTab({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("opening");
  const [template, setTemplate] = useState<Template | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [run, setRun] = useState<Run | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dateIso = new Date(date).toISOString();
      const [templateRes, runsRes] = await Promise.all([
        fetch(`/api/stores/${storeId}/checklist-template?type=${mode}`),
        fetch(`/api/stores/${storeId}/checklist-runs?type=${mode}&date=${dateIso}`),
      ]);
      const tmpl = templateRes.ok ? await templateRes.json() : null;
      const runs = runsRes.ok ? await runsRes.json() : [];
      setTemplate(tmpl);
      setItems(tmpl ? parseItems(tmpl.items) : []);
      const todayRun = Array.isArray(runs) && runs[0] ? runs[0] : null;
      setRun(todayRun);
      setCompleted(todayRun ? parseCompleted(todayRun.completedItems) : []);
      setNotes(todayRun?.notes ?? "");
    } finally {
      setLoading(false);
    }
  }, [storeId, mode, date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addItem = () => {
    if (!newItemText.trim()) return;
    setItems([...items, { id: Date.now().toString(), text: newItemText.trim() }]);
    setNewItemText("");
  };
  const removeItem = (id: string) => setItems(items.filter((i) => i.id !== id));

  const saveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/checklist-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mode, items }),
      });
      if (!res.ok) throw new Error();
      const tmpl = await res.json();
      setTemplate(tmpl);
      setEditingTemplate(false);
      toast("Template saved");
    } catch {
      toast("Failed to save template", "error");
    } finally {
      setSavingTemplate(false);
    }
  };

  const toggleItem = async (itemId: string) => {
    const next = completed.includes(itemId) ? completed.filter((c) => c !== itemId) : [...completed, itemId];
    setCompleted(next);
    await saveRun(next, notes);
  };

  const saveRun = async (completedItems: string[], notesValue: string) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/checklist-runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mode, date: new Date(date).toISOString(), completedItems, notes: notesValue }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRun(updated);
    } catch {
      toast("Failed to save", "error");
    }
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40";
  const isToday = new Date(date).toDateString() === new Date().toDateString();
  const progress = items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl">
        {(["opening", "closing"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              mode === m ? "bg-[#D97756] text-white" : "text-stone-500 hover:text-stone-300"
            }`}
          >
            {m === "opening" ? <Sun size={14} /> : <Moon size={14} />}
            {m === "opening" ? "Opening" : "Closing"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-600 text-sm flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : editingTemplate || (!template && !loading) ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit {mode} template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm text-stone-300">{item.text}</span>
                  <button onClick={() => removeItem(item.id)} className="text-stone-600 hover:text-red-400">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
                placeholder={mode === "opening" ? "e.g. Turn on lights and AC" : "e.g. Count cash, lock doors"}
                className={inputCls}
              />
              <button onClick={addItem} className="px-3 rounded-lg border border-white/[0.10] text-stone-400 hover:bg-white/[0.06] transition-colors">
                <Plus size={15} />
              </button>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveTemplate} disabled={savingTemplate} size="sm">
                {savingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {savingTemplate ? "Saving…" : "Save Template"}
              </Button>
              {template && (
                <Button onClick={() => { setEditingTemplate(false); setItems(parseItems(template.items)); }} variant="ghost" size="sm">
                  <X size={14} /> Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>{mode === "opening" ? "Opening" : "Closing"} checklist</CardTitle>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-stone-300 focus:outline-none focus:border-[#D97756]/40"
                  />
                </div>
                <button
                  onClick={() => setEditingTemplate(true)}
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors border border-white/[0.07] rounded-lg px-2 py-1"
                >
                  <Pencil size={12} /> Edit Template
                </button>
              </div>
              {items.length > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        background: progress >= 100 ? "#10b981" : "linear-gradient(90deg, #D97756, #E8926A)",
                      }}
                    />
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    {completed.length}/{items.length} complete · {isToday ? "Today" : new Date(date).toLocaleDateString("en-MY")}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-white/[0.04]">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        completed.includes(item.id) ? "bg-[#D97756] border-[#D97756] text-white" : "border-white/20 hover:border-[#D97756]/60"
                      }`}
                    >
                      {completed.includes(item.id) && <Check size={10} strokeWidth={3} />}
                    </button>
                    <span className={`flex-1 text-sm transition-colors ${completed.includes(item.id) ? "line-through text-stone-600" : "text-stone-300"}`}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 border-t border-white/[0.04]">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => saveRun(completed, notes)}
                  rows={2}
                  placeholder="Notes for this run…"
                  className={`${inputCls} resize-none text-xs`}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
