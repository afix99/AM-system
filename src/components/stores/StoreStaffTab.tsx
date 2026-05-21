"use client";
import { useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  resigned: "bg-red-100 text-red-800 border-red-200",
  "on-leave": "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const ROLE_COLORS: Record<string, string> = {
  Manager: "bg-purple-100 text-purple-800 border-purple-200",
  "Senior Staff": "bg-blue-100 text-blue-800 border-blue-200",
  Staff: "bg-slate-100 text-slate-800 border-slate-200",
};

function StaffForm({ storeId, initial, onSave, onCancel }: any) {
  const [name, setName] = useState(initial?.name || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [role, setRole] = useState(initial?.role || "Staff");
  const [hireDate, setHireDate] = useState(initial?.hireDate ? initial.hireDate.slice(0, 10) : "");
  const [status, setStatus] = useState(initial?.status || "active");
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
        body: JSON.stringify({ name, phone, role, hireDate, status }),
      });
      const staff = await res.json();
      onSave(staff);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Full Name *</label>
          <input value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white" placeholder="Name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white" placeholder="01x-xxx xxxx" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white">
            <option>Manager</option><option>Senior Staff</option><option>Staff</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Hire Date *</label>
          <input type="date" value={hireDate} onChange={(e) => { setHireDate(e.target.value); setError(""); }}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white">
            <option value="active">Active</option><option value="on-leave">On Leave</option><option value="resigned">Resigned</option>
          </select>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : initial ? "Save Changes" : "Add Staff"}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function StoreStaffTab({ store }: { store: any }) {
  const { toast } = useToast();
  const [staff, setStaff] = useState(store.staff || []);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const removeStaff = async (id: string) => {
    if (!confirm("Mark this staff as resigned?")) return;
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    setStaff((prev: any[]) => prev.map((s) => s.id === id ? { ...s, status: "resigned" } : s));
    toast("Staff status updated");
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{staff.filter((s: any) => s.status === "active").length} active staff</p>
        <Button size="sm" onClick={() => { setShowAdd(true); setEditId(null); }}>
          <Plus size={14} /> Add Staff
        </Button>
      </div>

      {showAdd && (
        <StaffForm
          storeId={store.id}
          onSave={(s: any) => { setStaff((prev: any[]) => [...prev, s]); setShowAdd(false); toast("Staff added"); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <Card>
        <CardContent className="p-0">
          {staff.length === 0 ? (
            <p className="py-8 text-center text-slate-400 text-sm">No staff added yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {staff.map((s: any) => (
                <li key={s.id}>
                  {editId === s.id ? (
                    <div className="p-4">
                      <StaffForm
                        storeId={store.id}
                        initial={s}
                        onSave={(updated: any) => {
                          setStaff((prev: any[]) => prev.map((x) => x.id === updated.id ? updated : x));
                          setEditId(null);
                          toast("Staff updated");
                        }}
                        onCancel={() => setEditId(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-900">{s.name}</span>
                          <Badge className={ROLE_COLORS[s.role] || "bg-slate-100 text-slate-700 border-slate-200"}>{s.role}</Badge>
                          <Badge className={STATUS_COLORS[s.status] || "bg-slate-100 text-slate-700 border-slate-200"}>{s.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{s.phone} · Hired {formatDate(s.hireDate)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditId(s.id)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => removeStaff(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50">
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
