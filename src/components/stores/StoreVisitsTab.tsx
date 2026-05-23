"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Plus, X, Save, Trash2, Camera, Calendar, ClipboardList, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { compressImage } from "@/lib/image";
import { FilePickerButton } from "@/components/ui/FilePickerButton";

interface ActionItem { id: string; text: string; done: boolean }
interface VisitData {
  id: string;
  storeId: string;
  visitDate: string;
  notes: string;
  photoUrls: string;
  actionItems: string;
}

function formatVisitDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function NewVisitModal({ storeId, onClose, onSave }: { storeId: string; onClose: () => void; onSave: (v: VisitData) => void }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [newAction, setNewAction] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const addAction = () => {
    if (!newAction.trim()) return;
    setActionItems([...actionItems, { id: Date.now().toString(), text: newAction.trim(), done: false }]);
    setNewAction("");
  };

  const removeAction = (id: string) => setActionItems(actionItems.filter((a) => a.id !== id));

  const handleSave = async () => {
    if (!notes.trim()) {
      toast("Add some notes about the visit", "error");
      return;
    }
    setSaving(true);
    try {
      const photoUrls = await Promise.all(photos.map((p) => compressImage(p, 1200, 0.72)));
      const res = await fetch(`/api/stores/${storeId}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          visitDate: new Date(visitDate).toISOString(),
          actionItems: JSON.stringify(actionItems),
          photos: photoUrls,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Save failed (${res.status})`);
      }
      const v = await res.json();
      onSave(v);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save visit", "error");
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40";
  const labelCls = "block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/[0.08] my-0 sm:my-4 flex flex-col max-h-[100dvh] sm:max-h-[90dvh]" style={{ background: "#262220" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.07] shrink-0">
          <h2 className="text-lg font-bold text-stone-100">Log Visit</h2>
          <button onClick={onClose} className="w-8 h-8 bg-white/[0.06] hover:bg-white/[0.10] rounded-xl flex items-center justify-center transition-colors">
            <X size={15} className="text-stone-400" />
          </button>
        </div>
        <div className="px-6 pt-4 pb-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea autoFocus value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
              placeholder="What did you see? How's the team? Any issues?"
              className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Action Items</label>
            <div className="space-y-2">
              {actionItems.map((a) => (
                <div key={a.id} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
                  <ClipboardList size={13} className="text-[#D97756] shrink-0" />
                  <span className="flex-1 text-sm text-stone-300">{a.text}</span>
                  <button onClick={() => removeAction(a.id)} className="text-stone-600 hover:text-red-400">
                    <X size={13} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAction())}
                  placeholder="Add action item..."
                  className={inputCls}
                />
                <button onClick={addAction} className="px-3 rounded-xl border border-white/[0.10] text-stone-400 hover:bg-white/[0.06] transition-colors">
                  <Plus size={15} />
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Photos ({photos.length})</label>
            <FilePickerButton
              multiple
              accept="image/*"
              onPick={(f) => setPhotos((prev) => [...prev, f])}
              className="w-full py-2.5 rounded-xl border border-white/[0.10] border-dashed text-sm text-stone-500 hover:text-stone-300 hover:bg-white/[0.04] transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={14} /> Add Photos
            </FilePickerButton>
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {photos.map((p, i) => (
                  <div key={i} className="text-xs text-stone-500 bg-white/[0.04] px-2 py-1 rounded border border-white/[0.07] flex items-center gap-1.5">
                    {p.name.length > 20 ? `${p.name.slice(0, 17)}…` : p.name}
                    <button onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))} className="text-stone-600 hover:text-red-400">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div
          className="flex gap-2 px-6 pt-3 border-t border-white/[0.07] shrink-0"
          style={{ background: "#262220", paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.10] text-sm font-semibold text-stone-500 hover:bg-white/[0.04] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(180deg, #F4A982 0%, #D97756 55%, #A8552F 100%)", boxShadow: "0 4px 20px -2px rgba(217,119,86,0.45), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -6px 12px -6px rgba(0,0,0,0.35)" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving…" : "Save Visit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VisitCard({ visit, onChange, onDelete }: { visit: VisitData; onChange: (v: VisitData) => void; onDelete: () => void }) {
  const { toast } = useToast();
  const photos: string[] = (() => { try { return JSON.parse(visit.photoUrls); } catch { return []; } })();
  const actions: ActionItem[] = (() => { try { return JSON.parse(visit.actionItems); } catch { return []; } })();

  const toggleAction = async (actionId: string) => {
    const next = actions.map((a) => a.id === actionId ? { ...a, done: !a.done } : a);
    try {
      const res = await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionItems: JSON.stringify(next) }),
      });
      if (!res.ok) throw new Error();
      onChange({ ...visit, actionItems: JSON.stringify(next) });
    } catch {
      toast("Failed to update", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this visit log?")) return;
    try {
      const res = await fetch(`/api/visits/${visit.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete();
      toast("Visit deleted");
    } catch {
      toast("Delete failed", "error");
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D97756]">
            <Calendar size={12} />
            {formatVisitDate(visit.visitDate)}
          </div>
          <button onClick={handleDelete} className="text-stone-700 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
        <p className="text-sm text-stone-200 whitespace-pre-wrap mb-3">{visit.notes}</p>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-white/[0.08]">
                <Image src={url} alt={`Photo ${i + 1}`} width={200} height={200} className="w-full h-full object-cover" unoptimized />
              </a>
            ))}
          </div>
        )}

        {actions.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Action Items</p>
            {actions.map((a) => (
              <button
                key={a.id}
                onClick={() => toggleAction(a.id)}
                className="w-full flex items-start gap-2 text-left hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded transition-colors"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${a.done ? "bg-[#D97756] border-[#D97756]" : "border-white/20"}`}>
                  {a.done && <Check size={9} className="text-white" strokeWidth={3} />}
                </div>
                <span className={`text-sm ${a.done ? "line-through text-stone-600" : "text-stone-300"}`}>{a.text}</span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StoreVisitsTab({ storeId }: { storeId: string }) {
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/visits`);
      const data = await res.json();
      setVisits(data);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Visit Log</CardTitle>
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Log Visit
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-stone-600 text-sm flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : visits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-3">
              <ClipboardList size={28} className="text-stone-600" />
            </div>
            <p className="text-sm text-stone-500">No visits logged yet.</p>
            <button onClick={() => setShowModal(true)} className="text-[#D97756] hover:text-[#E8926A] text-sm font-semibold mt-2">
              Log your first visit
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <VisitCard
              key={v.id}
              visit={v}
              onChange={(updated) => setVisits((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
              onDelete={() => setVisits((prev) => prev.filter((x) => x.id !== v.id))}
            />
          ))}
        </div>
      )}

      {showModal && (
        <NewVisitModal
          storeId={storeId}
          onClose={() => setShowModal(false)}
          onSave={(v) => {
            setVisits((prev) => [v, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
