"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, Phone, Users, Award, Star, UserCheck, Clock, Plus, X, ChevronRight, GraduationCap, Check, Loader2 } from "lucide-react";
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

const ROLE_STYLE: Record<string, { pill: string; avatar: string; border: string }> = {
  Manager:      { pill: "bg-[#D97756]/10 text-[#E8926A] border-[#D97756]/25",    avatar: "bg-[#D97756]",  border: "border-l-[#D97756]"  },
  "Senior Staff": { pill: "bg-amber-950/50 text-amber-400 border-amber-500/25", avatar: "bg-amber-600",   border: "border-l-amber-500"   },
  Staff:        { pill: "bg-white/[0.05] text-stone-400 border-white/[0.10]",   avatar: "bg-stone-600",   border: "border-l-stone-500"   },
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
  const [trainingFor, setTrainingFor] = useState<StaffMember | null>(null);

  const visible = useMemo(() => staff.filter(s => s.status.toLowerCase() !== "resigned"), [staff]);

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
    await new Promise(r => setTimeout(r, 250));
    try {
      const res = await fetch(`/api/staff/${member.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStaff(prev => prev.filter(s => s.id !== member.id));
      toast(`${member.name} removed`);
    } catch {
      setRemovingId(null);
      toast("Failed to remove. Try again.", "error");
    } finally {
      setRemovingId(null);
    }
  };

  const handleAdd = (newMember: StaffMember) => {
    setStaff(prev => [newMember, ...prev]);
    setShowAdd(false);
    toast(`${newMember.name} added!`);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[#D97756]/80 uppercase tracking-widest mb-0.5">Team</p>
          <h1 className="text-2xl font-bold text-stone-100">Staff Directory</h1>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus size={15} /> Add Staff</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",    value: stats.total,   grad: "linear-gradient(135deg,#C86645,#D97756)", icon: <UserCheck size={16} /> },
          { label: "Managers", value: stats.manager, grad: "linear-gradient(135deg,#92400e,#d97706)", icon: <Award size={16} />     },
          { label: "Senior",   value: stats.senior,  grad: "linear-gradient(135deg,#78350f,#b45309)", icon: <Star size={16} />      },
          { label: "Staff",    value: stats.staff,   grad: "linear-gradient(135deg,#44403c,#78716c)", icon: <Users size={16} />     },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-3.5 text-white" style={{ background: stat.grad }}>
            <div className="opacity-80 mb-1.5">{stat.icon}</div>
            <p className="text-2xl font-black leading-none">{stat.value}</p>
            <p className="text-xs font-medium opacity-80 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-600" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, store or phone…"
            className="w-full pl-10 pr-10 py-2.5 border border-white/[0.08] rounded-2xl text-sm bg-white/[0.04] text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-400">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)}
            className="shrink-0 border border-white/[0.08] rounded-full px-3 py-1.5 text-xs font-medium bg-white/[0.04] text-stone-500 focus:outline-none"
            style={{ colorScheme: "dark" }}>
            <option value="all" style={{ background: "#262220" }}>All Stores</option>
            {stores.map(s => <option key={s.id} value={s.id} style={{ background: "#262220" }}>{s.name}</option>)}
          </select>
          {ROLE_FILTER.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                roleFilter === r
                  ? "bg-[#D97756] text-white shadow-lg shadow-[#D97756]/20"
                  : "bg-white/[0.04] border border-white/[0.08] text-stone-500 hover:border-white/20 hover:text-stone-300"
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {isFiltering && (
        <p className="text-xs text-stone-600 -mt-2">
          {filtered.length} {filtered.length === 1 ? "person" : "people"} found
        </p>
      )}

      {/* Staff list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-white/[0.04] border border-white/[0.07] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-stone-600" />
          </div>
          <p className="text-stone-500 font-medium">No staff found</p>
          <p className="text-stone-600 text-sm mt-1">Try a different filter or add someone</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-sm text-[#D97756] font-semibold hover:text-[#E8926A]">
            + Add Staff
          </button>
        </div>
      ) : isFiltering ? (
        <div className="space-y-2">
          {filtered.map(s => <StaffCard key={s.id} staff={s} showStore removing={removingId === s.id} onRemove={() => handleRemove(s)} onTraining={() => setTrainingFor(s)} />)}
        </div>
      ) : (
        <div className="space-y-7">
          {grouped.map(group => (
            <div key={group.storeId}>
              <div className="flex items-center justify-between mb-3">
                <Link href={`/stores/${group.storeId}`} className="flex items-center gap-1.5 group">
                  <span className="text-sm font-bold text-stone-300 group-hover:text-[#D97756] transition-colors">{group.storeName}</span>
                  <ChevronRight size={13} className="text-stone-600 group-hover:text-[#D97756] transition-colors" />
                </Link>
                <span className="text-xs font-medium text-stone-600 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                  {group.members.length} {group.members.length === 1 ? "person" : "people"}
                </span>
              </div>
              <div className="space-y-2">
                {group.members.map(s => <StaffCard key={s.id} staff={s} showStore={false} removing={removingId === s.id} onRemove={() => handleRemove(s)} onTraining={() => setTrainingFor(s)} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddStaffModal stores={stores} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {trainingFor && <TrainingModal staff={trainingFor} onClose={() => setTrainingFor(null)} />}
    </div>
  );
}

function StaffCard({ staff: s, showStore, removing, onRemove, onTraining }: {
  staff: StaffMember; showStore: boolean; removing: boolean; onRemove: () => void; onTraining: () => void;
}) {
  const style = ROLE_STYLE[s.role] ?? ROLE_STYLE.Staff;
  const tenure = getTenure(s.hireDate);
  const isOnLeave = s.status.toLowerCase() === "on leave";

  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-[#262220] border-l-4 ${style.border}
      flex items-center gap-3.5 px-4 py-3.5 transition-all duration-200
      ${removing ? "opacity-0 scale-95 -translate-x-4" : "opacity-100 scale-100 translate-x-0"}`}>
      <div className={`w-10 h-10 ${style.avatar} rounded-xl flex items-center justify-center shrink-0`}>
        <span className="text-white text-sm font-black">{initials(s.name)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-stone-200 truncate">{s.name}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${style.pill}`}>{s.role}</span>
          {isOnLeave && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-500/30">On Leave</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-600 flex-wrap">
          {showStore && (
            <Link href={`/stores/${s.storeId}`} className="font-semibold text-stone-500 hover:text-[#D97756] transition-colors">{s.storeName}</Link>
          )}
          {s.phone && (
            <a href={`tel:${s.phone}`} className="flex items-center gap-1 hover:text-[#D97756] transition-colors">
              <Phone size={11} />{s.phone}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Clock size={11} />
            <span className={tenure === "New" ? "text-emerald-400 font-semibold" : ""}>{tenure}</span>
          </span>
        </div>
      </div>
      <button onClick={onTraining}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-stone-600 hover:text-[#D97756] hover:bg-[#D97756]/10 transition-all"
        title="Training">
        <GraduationCap size={15} />
      </button>
      <button onClick={onRemove} disabled={removing}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-stone-600 hover:text-red-400 hover:bg-red-950/40 transition-all"
        title="Remove">
        <X size={15} />
      </button>
    </div>
  );
}

interface LibraryEntry { id: string; title: string; category: string; isTraining: boolean }
interface TrainingRecord { id: string; libraryEntryId: string; completedDate: string }

function TrainingModal({ staff, onClose }: { staff: StaffMember; onClose: () => void }) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [libRes, recRes] = await Promise.all([
          fetch("/api/library"),
          fetch(`/api/staff/${staff.id}/training`),
        ]);
        const lib: LibraryEntry[] = await libRes.json();
        const rec: TrainingRecord[] = await recRes.json();
        setEntries(lib.filter(e => e.isTraining));
        setRecords(rec);
      } finally {
        setLoading(false);
      }
    })();
  }, [staff.id]);

  const recordFor = (entryId: string) => records.find(r => r.libraryEntryId === entryId);

  const markTrained = async (entryId: string) => {
    setSaving(entryId);
    try {
      const res = await fetch(`/api/staff/${staff.id}/training`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ libraryEntryId: entryId, completedDate: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setRecords(prev => {
        const existing = prev.find(r => r.libraryEntryId === entryId);
        if (existing) return prev.map(r => r.libraryEntryId === entryId ? created : r);
        return [...prev, created];
      });
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(null);
    }
  };

  const unmark = async (recordId: string) => {
    setSaving(recordId);
    try {
      const res = await fetch(`/api/training/${recordId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRecords(prev => prev.filter(r => r.id !== recordId));
    } catch {
      toast("Failed to remove", "error");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/[0.08]" style={{ background: "#262220" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.07]">
          <div>
            <h2 className="text-lg font-bold text-stone-100">Training</h2>
            <p className="text-xs text-stone-600 mt-0.5">{staff.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/[0.06] hover:bg-white/[0.10] rounded-xl flex items-center justify-center transition-colors">
            <X size={15} className="text-stone-400" />
          </button>
        </div>
        <div className="px-6 pb-6 pt-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-stone-600 text-sm flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center">
              <GraduationCap size={32} className="text-stone-600 mx-auto mb-2" />
              <p className="text-sm text-stone-500">No training topics yet.</p>
              <p className="text-xs text-stone-600 mt-1">
                Add a Library entry and mark it as <span className="text-[#D97756]">Training</span> first.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(e => {
                const record = recordFor(e.id);
                const isSaving = saving === e.id || (record && saving === record.id);
                return (
                  <button
                    key={e.id}
                    onClick={() => record ? unmark(record.id) : markTrained(e.id)}
                    disabled={!!isSaving}
                    className={`w-full flex items-start gap-3 text-left rounded-xl px-3 py-2.5 border transition-colors ${
                      record
                        ? "bg-emerald-950/30 border-emerald-500/30 hover:bg-emerald-950/40"
                        : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      record ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                    }`}>
                      {record && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-200">{e.title}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{e.category}</p>
                      {record && (
                        <p className="text-xs text-emerald-400 mt-1">
                          ✓ Trained {new Date(record.completedDate).toLocaleDateString("en-MY")}
                        </p>
                      )}
                    </div>
                    {isSaving && <Loader2 size={13} className="animate-spin text-[#D97756] shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

  const inputCls = "w-full border border-white/[0.08] bg-white/[0.04] rounded-xl px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40";

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: crypto.randomUUID(), name: name.trim(), phone: phone.trim(), role, hireDate, status: "active", updatedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      onSave({ ...created, storeName: stores.find(s => s.id === storeId)?.name ?? "", hireDate: created.hireDate });
    } catch {
      setError("Failed to add. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/[0.08]" style={{ background: "#262220" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.07]">
          <div>
            <h2 className="text-lg font-bold text-stone-100">New Staff Member</h2>
            <p className="text-xs text-stone-600 mt-0.5">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/[0.06] hover:bg-white/[0.10] rounded-xl flex items-center justify-center transition-colors">
            <X size={15} className="text-stone-400" />
          </button>
        </div>
        <div className="px-6 pb-6 pt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Full Name *</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="e.g. Ahmad Faris" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 012-345 6789" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Store *</label>
              <select value={storeId} onChange={e => setStoreId(e.target.value)} className={`${inputCls} appearance-none`} style={{ colorScheme: "dark" }}>
                {stores.map(s => <option key={s.id} value={s.id} style={{ background: "#262220" }}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Role *</label>
              <select value={role} onChange={e => setRole(e.target.value)} className={`${inputCls} appearance-none`} style={{ colorScheme: "dark" }}>
                {ROLE_OPTIONS.map(r => <option key={r} value={r} style={{ background: "#262220" }}>{r}</option>)}
              </select>
            </div>
          </div>
          {name && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03]">
              <div className={`w-8 h-8 ${ROLE_STYLE[role]?.avatar ?? "bg-stone-600"} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-xs font-black">{initials(name)}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-stone-200">{name}</p>
                <p className="text-xs text-stone-500">{role}</p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Hire Date *</label>
            <input type="date" value={hireDate} onChange={e => setHireDate(e.target.value)} className={inputCls} style={{ colorScheme: "dark" }} />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.10] text-sm font-semibold text-stone-500 hover:bg-white/[0.04] transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !name.trim()}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-all shadow-lg"
              style={{ background: "linear-gradient(135deg, #D97756, #C86645)", boxShadow: "0 4px 16px rgba(217,119,86,0.25)" }}>
              {saving ? "Adding…" : "Add Staff"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
