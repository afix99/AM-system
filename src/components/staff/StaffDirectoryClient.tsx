"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Phone, Users, Award, Star, UserCheck,
  Clock, Plus, X, ChevronRight,
} from "lucide-react";
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

const ROLE_OPTIONS = ["Manager", "Senior Staff", "Staff"] as const;
const ROLE_FILTER = ["All", "Manager", "Senior Staff", "Staff"] as const;

const ROLE_STYLE: Record<string, { bg: string; text: string; avatar: string; border: string }> = {
  Manager:      { bg: "bg-indigo-100", text: "text-indigo-700", avatar: "bg-indigo-600", border: "border-l-indigo-500" },
  "Senior Staff": { bg: "bg-sky-100",  text: "text-sky-700",    avatar: "bg-sky-500",    border: "border-l-sky-400"    },
  Staff:        { bg: "bg-violet-100", text: "text-violet-700", avatar: "bg-violet-500", border: "border-l-violet-400" },
};

function getTenure(hireDateStr: string): string {
  const hire = new Date(hireDateStr);
  const now = new Date();
  const months = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
  if (months < 1) return "New";
  if (months < 12) return `${months}m`;
  const y = Math.floor(months / 12), m = months % 12;
  return m > 0 ? `${y}y ${m}m` : `${y}y`;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

interface Props {
  staff: StaffMember[];
  stores: { id: string; name: string }[];
}

export function StaffDirectoryClient({ staff: initialStaff, stores }: Props) {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>(
    initialStaff.filter(s => s.status.toLowerCase() !== "resigned")
  );
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);

  // Only active / on-leave staff
  const visible = useMemo(
    () => staff.filter(s => s.status.toLowerCase() !== "resigned"),
    [staff]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return visible.filter(s => {
      if (q && !s.name.toLowerCase().includes(q) && !s.storeName.toLowerCase().includes(q) && !s.phone.includes(q)) return false;
      if (storeFilter !== "all" && s.storeId !== storeFilter) return false;
      if (roleFilter !== "All" && s.role !== roleFilter) return false;
      return true;
    });
  }, [visible, search, storeFilter, roleFilter]);

  const stats = useMemo(() => ({
    total:   visible.filter(s => s.status === "active").length,
    manager: visible.filter(s => s.role === "Manager" && s.status === "active").length,
    senior:  visible.filter(s => s.role === "Senior Staff" && s.status === "active").length,
    staff:   visible.filter(s => s.role === "Staff" && s.status === "active").length,
  }), [visible]);

  const grouped = useMemo(() => {
    const map: Record<string, { storeName: string; storeId: string; members: StaffMember[] }> = {};
    for (const s of filtered) {
      if (!map[s.storeId]) map[s.storeId] = { storeName: s.storeName, storeId: s.storeId, members: [] };
      map[s.storeId].members.push(s);
    }
    return Object.values(map);
  }, [filtered]);

  const isFiltering = storeFilter !== "all" || !!search || roleFilter !== "All";

  const handleRemove = async (member: StaffMember) => {
    setRemovingId(member.id);
    // animate out first
    await new Promise(r => setTimeout(r, 250));
    try {
      await fetch(`/api/staff/${member.id}`, { method: "DELETE" });
      setStaff(prev => prev.filter(s => s.id !== member.id));
      toast(`${member.name} removed`);
    } catch {
      toast("Failed to remove. Try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleAdd = (newMember: StaffMember) => {
    setStaff(prev => [newMember, ...prev]);
    setShowAdd(false);
    toast(`${newMember.name} added! 🎉`);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Team</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Staff Directory</h1>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add Staff
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",    value: stats.total,   color: "from-emerald-500 to-teal-500",   icon: <UserCheck size={18} /> },
          { label: "Managers", value: stats.manager, color: "from-indigo-500 to-violet-500", icon: <Award size={18} />     },
          { label: "Senior",   value: stats.senior,  color: "from-sky-500 to-cyan-500",       icon: <Star size={18} />      },
          { label: "Staff",    value: stats.staff,   color: "from-violet-500 to-fuchsia-500", icon: <Users size={18} />     },
        ].map(stat => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-3.5 text-white shadow-sm`}>
            <div className="opacity-80 mb-1.5">{stat.icon}</div>
            <p className="text-2xl font-black leading-none">{stat.value}</p>
            <p className="text-xs font-medium opacity-80 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Search & Filters ── */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, store or phone…"
            className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 bg-white shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {/* Store filter */}
          <select
            value={storeFilter}
            onChange={e => setStoreFilter(e.target.value)}
            className="shrink-0 border border-slate-200 rounded-full px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:border-indigo-400 text-slate-600"
          >
            <option value="all">All Stores</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Role pills */}
          {ROLE_FILTER.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                roleFilter === r
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Result count ── */}
      {isFiltering && (
        <p className="text-xs text-slate-400 -mt-2">
          {filtered.length} {filtered.length === 1 ? "person" : "people"} found
        </p>
      )}

      {/* ── Staff list ── */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No staff found</p>
          <p className="text-slate-400 text-sm mt-1">Try a different filter or add someone</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-sm text-indigo-600 font-semibold hover:underline">
            + Add Staff
          </button>
        </div>
      ) : isFiltering ? (
        /* Flat list */
        <div className="space-y-2">
          {filtered.map(s => (
            <StaffCard
              key={s.id}
              staff={s}
              showStore
              removing={removingId === s.id}
              onRemove={() => handleRemove(s)}
            />
          ))}
        </div>
      ) : (
        /* Grouped by store */
        <div className="space-y-7">
          {grouped.map(group => (
            <div key={group.storeId}>
              <div className="flex items-center justify-between mb-3">
                <Link href={`/stores/${group.storeId}`} className="flex items-center gap-1.5 group">
                  <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {group.storeName}
                  </span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </Link>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {group.members.length} {group.members.length === 1 ? "person" : "people"}
                </span>
              </div>
              <div className="space-y-2">
                {group.members.map(s => (
                  <StaffCard
                    key={s.id}
                    staff={s}
                    showStore={false}
                    removing={removingId === s.id}
                    onRemove={() => handleRemove(s)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Modal ── */}
      {showAdd && (
        <AddStaffModal
          stores={stores}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Staff Card
// ─────────────────────────────────────────────
function StaffCard({ staff: s, showStore, removing, onRemove }: {
  staff: StaffMember;
  showStore: boolean;
  removing: boolean;
  onRemove: () => void;
}) {
  const style = ROLE_STYLE[s.role] ?? ROLE_STYLE.Staff;
  const tenure = getTenure(s.hireDate);
  const isOnLeave = s.status.toLowerCase() === "on leave";

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm border-l-4 ${style.border}
        flex items-center gap-3.5 px-4 py-3.5 transition-all duration-200
        ${removing ? "opacity-0 scale-95 -translate-x-4" : "opacity-100 scale-100 translate-x-0"}`}
    >
      {/* Avatar */}
      <div className={`w-10 h-10 ${style.avatar} rounded-xl flex items-center justify-center shrink-0`}>
        <span className="text-white text-sm font-black">{initials(s.name)}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-slate-900 truncate">{s.name}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
            {s.role}
          </span>
          {isOnLeave && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
              On Leave
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
          {showStore && (
            <Link href={`/stores/${s.storeId}`} className="font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
              {s.storeName}
            </Link>
          )}
          {s.phone && (
            <a href={`tel:${s.phone}`} className="flex items-center gap-1 hover:text-indigo-500 transition-colors">
              <Phone size={11} />{s.phone}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Clock size={11} />
            <span className={tenure === "New" ? "text-emerald-500 font-semibold" : ""}>{tenure}</span>
          </span>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        disabled={removing}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Add Staff Modal
// ─────────────────────────────────────────────
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
      if (!res.ok) throw new Error();
      const created = await res.json();
      onSave({
        ...created,
        storeName: stores.find(s => s.id === storeId)?.name ?? "",
        hireDate: created.hireDate,
      });
    } catch {
      setError("Failed to add. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">New Staff Member</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="e.g. Ahmad Faris"
              className="w-full border-2 border-slate-100 focus:border-indigo-400 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 012-345 6789"
              className="w-full border-2 border-slate-100 focus:border-indigo-400 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Store + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Store *</label>
              <select
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                className="w-full border-2 border-slate-100 focus:border-indigo-400 rounded-2xl px-3 py-3 text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none transition-all"
              >
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role *</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full border-2 border-slate-100 focus:border-indigo-400 rounded-2xl px-3 py-3 text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none transition-all"
              >
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Role preview */}
          {role && (
            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl ${ROLE_STYLE[role]?.bg ?? "bg-slate-100"}`}>
              <div className={`w-7 h-7 ${ROLE_STYLE[role]?.avatar} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-xs font-black">{initials(name || "?")}</span>
              </div>
              <div>
                <p className={`text-sm font-bold ${ROLE_STYLE[role]?.text}`}>{name || "Staff Name"}</p>
                <p className={`text-xs ${ROLE_STYLE[role]?.text} opacity-70`}>{role}</p>
              </div>
            </div>
          )}

          {/* Hire Date */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hire Date *</label>
            <input
              type="date"
              value={hireDate}
              onChange={e => setHireDate(e.target.value)}
              className="w-full border-2 border-slate-100 focus:border-indigo-400 rounded-2xl px-4 py-3 text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-2xl">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-all shadow-sm shadow-indigo-600/30"
            >
              {saving ? "Adding…" : "Add Staff"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
