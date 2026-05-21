"use client";
import { useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { formatDate } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  Manager:      "bg-[#D97756]/10 text-[#E8926A] border-[#D97756]/25",
  "Senior Staff": "bg-amber-950/50 text-amber-400 border-amber-500/25",
  Staff:        "bg-white/[0.05] text-stone-400 border-white/[0.10]",
};

const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40";
const labelCls = "block text-xs font-semibold text-stone-500 mb-1";

function StaffForm({ storeId, initial, onSave, onCancel }: any) {
  const [name, setName] = useState(initial?.name || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [role, setRole] = useState(initial?.role || "Staff");
  const [hireDate, setHireDate] = useState(initial?.hireDate ? initial.hireDate.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    if (!hireDate) { setError("Hire date is required"); return; }
    setSaving(true);
    try {
      const url = initial ? `/api/staff/${initial.id}` : `/api/stores/${storeId}/staff`;
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, role, hireDate, status: "active" }),
      });
      const staff = await res.json();
      onSave(staff);
    } finally { setSaving(false); }
  };

  return (
    <div className="border border-white/[0.08] rounded-xl p-4 space-y-3 bg-white/[0.02]">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Full Name *</label>
          <input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} className={inputCls} placeholder="Name" />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="01x-xxx xxxx" />
        </div>
        <div>
          <label className={labelCls}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputCls} appearance-none`} style={{ colorScheme: "dark" }}>
            <option style={{ background: "#262220" }}>Manager</option>
            <option style={{ background: "#262220" }}>Senior Staff</option>
            <option style={{ background: "#262220" }}>Staff</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Hire Date *</label>
          <input type="date" value={hireDate} onChange={(e) => { setHireDate(e.target.value); setError(""); }} className={inputCls} style={{ colorScheme: "dark" }} />
        </div>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : initial ? "Save Changes" : "Add Staff"}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function StoreStaffTab({ store }: { store: any }) {
  const { toast } = useToast();
  const [staff, setStaff] = useState<any[]>((store.staff || []).filter((s: any) => s.status !== "resigned"));
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const removeStaff = async (id: string, name: string) => {
    setRemovingId(id);
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStaff(prev => prev.filter(s => s.id !== id));
      toast(`${name} removed`);
    } catch {
      setRemovingId(null);
      toast("Failed to remove. Try again.", "error");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{staff.length} staff members</p>
        <Button size="sm" onClick={() => { setShowAdd(true); setEditId(null); }}>
          <Plus size={14} /> Add Staff
        </Button>
      </div>

      {showAdd && (
        <StaffForm
          storeId={store.id}
          onSave={(s: any) => { setStaff(prev => [...prev, s]); setShowAdd(false); toast("Staff added"); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <Card>
        <CardContent className="p-0">
          {staff.length === 0 ? (
            <p className="py-8 text-center text-stone-600 text-sm">No staff yet.</p>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {staff.map((s: any) => (
                <li key={s.id} className={`transition-all duration-200 ${removingId === s.id ? "opacity-0 -translate-x-2" : "opacity-100"}`}>
                  {editId === s.id ? (
                    <div className="p-4">
                      <StaffForm
                        storeId={store.id}
                        initial={s}
                        onSave={(updated: any) => { setStaff(prev => prev.map(x => x.id === updated.id ? updated : x)); setEditId(null); toast("Staff updated"); }}
                        onCancel={() => setEditId(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="w-9 h-9 rounded-xl border border-[#D97756]/20 flex items-center justify-center shrink-0" style={{ background: "rgba(217,119,86,0.08)" }}>
                        <span className="text-xs font-bold text-[#D97756]">
                          {s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-stone-200">{s.name}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_COLORS[s.role] ?? "bg-white/[0.05] text-stone-400 border-white/[0.10]"}`}>{s.role}</span>
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5">{s.phone || "—"} · Hired {formatDate(s.hireDate)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditId(s.id)} className="p-1.5 text-stone-600 hover:text-stone-300 rounded-lg hover:bg-white/[0.06] transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => removeStaff(s.id, s.name)} disabled={removingId === s.id} className="p-1.5 text-stone-600 hover:text-red-400 rounded-lg hover:bg-red-950/40 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
