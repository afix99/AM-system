"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Phone, Users, Award, Star, UserCheck, UserX, Clock, Plus, X, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";

type StaffMember = {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: string;
  hireDate: string;
  storeId: string;
  storeName: string;
};

const ROLES = ["All", "Manager", "Senior Staff", "Staff"] as const;
const ROLE_OPTIONS = ["Manager", "Senior Staff", "Staff"] as const;
const STATUSES = ["All", "active", "on leave", "resigned"] as const;
const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  "on leave": "On Leave",
  resigned: "Resigned",
};

function getRoleColor(role: string) {
  switch (role) {
    case "Manager": return "bg-indigo-100 text-indigo-700";
    case "Senior Staff": return "bg-sky-100 text-sky-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "active": return "bg-emerald-50 text-emerald-700";
    case "on leave": return "bg-amber-50 text-amber-700";
    case "resigned": return "bg-red-50 text-red-600";
    default: return "bg-slate-100 text-slate-500";
  }
}

function getTenure(hireDateStr: string): string {
  const hire = new Date(hireDateStr);
  const now = new Date();
  const months = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
  if (months < 1) return "< 1 mo";
  if (months < 12) return `${months}m`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}m` : `${years}y`;
}

function getRoleIcon(role: string) {
  switch (role) {
    case "Manager": return <Award size={13} className="text-indigo-500" />;
    case "Senior Staff": return <Star size={13} className="text-sky-500" />;
    default: return <Users size={13} className="text-slate-400" />;
  }
}

interface Props {
  staff: StaffMember[];
  stores: { id: string; name: string }[];
}

export function StaffDirectoryClient({ staff: initialStaff, stores }: Props) {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<StaffMember | null>(null);
  const [removing, setRemoving] = useState(false);

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
          !s.storeName.toLowerCase().includes(search.toLowerCase())) return false;
      if (storeFilter !== "all" && s.storeId !== storeFilter) return false;
      if (roleFilter !== "All" && s.role !== roleFilter) return false;
      if (statusFilter !== "All" && s.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      return true;
    });
  }, [staff, search, storeFilter, roleFilter, statusFilter]);

  const active = staff.filter((s) => s.status.toLowerCase() === "active");
  const managers = active.filter((s) => s.role === "Manager").length;
  const seniors = active.filter((s) => s.role === "Senior Staff").length;
  const regulars = active.filter((s) => s.role === "Staff").length;

  const showFlat = storeFilter !== "all" || !!search || roleFilter !== "All" || statusFilter !== "All";

  const groupedByStore = useMemo(() => {
    const groups: Record<string, { storeName: string; storeId: string; members: StaffMember[] }> = {};
    for (const s of filtered) {
      if (!groups[s.storeId]) groups[s.storeId] = { storeName: s.storeName, storeId: s.storeId, members: [] };
      groups[s.storeId].members.push(s);
    }
    return Object.values(groups);
  }, [filtered]);

  const handleAdd = (newMember: StaffMember) => {
    setStaff((prev) => [...prev, newMember]);
    setShowAdd(false);
    toast(`${newMember.name} added`);
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    setRemoving(true);
    try {
      await fetch(`/api/staff/${confirmRemove.id}`, { method: "DELETE" });
      setStaff((prev) => prev.map((s) => s.id === confirmRemove.id ? { ...s, status: "resigned" } : s));
      toast(`${confirmRemove.name} removed`);
    } finally {
      setRemoving(false);
      setConfirmRemove(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Directory</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Staff</h1>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active", value: active.length, icon: <UserCheck size={15} />, color: "text-emerald-600" },
          { label: "Managers", value: managers, icon: <Award size={15} />, color: "text-indigo-600" },
          { label: "Senior", value: seniors, icon: <Star size={15} />, color: "text-sky-600" },
          { label: "Staff", value: regulars, icon: <Users size={15} />, color: "text-slate-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 text-center">
              <div className={`flex items-center justify-center mb-1 ${stat.color}`}>{stat.icon}</div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or store…"
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
          />
        </div>
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400 text-slate-600">
          <option value="all">All Stores</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400 text-slate-600">
          {ROLES.map((r) => <option key={r} value={r}>{r === "All" ? "All Roles" : r}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400 text-slate-600">
          {STATUSES.map((s) => <option key={s} value={s}>{s === "All" ? "All Status" : STATUS_LABEL[s] ?? s}</option>)}
        </select>
      </div>

      {showFlat && (
        <p className="text-xs text-slate-400">{filtered.length} {filtered.length === 1 ? "person" : "people"} found</p>
      )}

      {/* Staff list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <Users size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm">No staff match your filters.</p>
          <button onClick={() => setShowAdd(true)} className="mt-2 text-xs text-indigo-600 hover:underline font-medium">Add someone?</button>
        </div>
      ) : showFlat ? (
        <div className="space-y-2">
          {filtered.map((s) => (
            <StaffCard key={s.id} staff={s} showStore onRemove={() => setConfirmRemove(s)} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByStore.map((group) => (
            <div key={group.storeId}>
              <div className="flex items-center justify-between mb-2.5">
                <Link href={`/stores/${group.storeId}`} className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors">
                  {group.storeName}
                </Link>
                <span className="text-xs text-slate-400">
                  {group.members.filter((m) => m.status.toLowerCase() === "active").length} active
                </span>
              </div>
              <div className="space-y-2">
                {group.members.map((s) => (
                  <StaffCard key={s.id} staff={s} showStore={false} onRemove={() => setConfirmRemove(s)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAdd && (
        <AddStaffModal
          stores={stores}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}

      {/* Remove Confirmation */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">Remove Staff?</h3>
            <p className="text-sm text-slate-500 text-center mt-1">
              <span className="font-semibold text-slate-700">{confirmRemove.name}</span> will be marked as resigned.
            </p>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" onClick={() => setConfirmRemove(null)} className="flex-1" disabled={removing}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRemove} className="flex-1" disabled={removing}>
                {removing ? "Removing…" : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Staff Card ────────────────────────────────────────────────────────────────

function StaffCard({ staff: s, showStore, onRemove }: {
  staff: StaffMember;
  showStore: boolean;
  onRemove: () => void;
}) {
  const isInactive = s.status.toLowerCase() !== "active";
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm px-4 py-3.5 flex items-center gap-3 ${isInactive ? "opacity-60" : ""}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
        s.role === "Manager" ? "bg-indigo-100 text-indigo-700" :
        s.role === "Senior Staff" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"
      }`}>
        {s.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full ${getRoleColor(s.role)}`}>
            {getRoleIcon(s.role)} {s.role}
          </span>
          {isInactive && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${getStatusColor(s.status)}`}>
              {STATUS_LABEL[s.status.toLowerCase()] ?? s.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
          {showStore && (
            <Link href={`/stores/${s.storeId}`} className="hover:text-indigo-600 transition-colors font-medium">
              {s.storeName}
            </Link>
          )}
          <span className="flex items-center gap-1"><Phone size={11} />{s.phone || "—"}</span>
          <span className="flex items-center gap-1"><Clock size={11} />{getTenure(s.hireDate)}</span>
        </div>
      </div>
      {s.status.toLowerCase() !== "resigned" && (
        <button
          onClick={onRemove}
          className="shrink-0 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          title="Remove staff"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ── Add Staff Modal ───────────────────────────────────────────────────────────

function AddStaffModal({ stores, onClose, onSave }: {
  stores: { id: string; name: string }[];
  onClose: () => void;
  onSave: (s: StaffMember) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [role, setRole] = useState<string>("Staff");
  const [hireDate, setHireDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    if (!storeId) { setError("Please select a store."); return; }
    if (!hireDate) { setError("Hire date is required."); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: name.trim(),
          phone: phone.trim(),
          role,
          hireDate,
          status: "active",
          updatedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const created = await res.json();
      const storeName = stores.find((s) => s.id === storeId)?.name ?? "";
      onSave({ ...created, storeName, hireDate: created.hireDate });
    } catch {
      setError("Failed to add staff. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Add Staff</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
            <X size={17} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name <span className="text-red-400">*</span></label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmad Faris"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 012-345 6789"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Store <span className="text-red-400">*</span></label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400"
              >
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Role <span className="text-red-400">*</span></label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400"
              >
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Hire Date <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              {saving ? "Adding…" : "Add Staff"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
