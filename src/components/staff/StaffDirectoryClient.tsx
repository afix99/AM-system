"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Phone, Users, Award, Star, UserCheck, UserX, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

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
  if (months < 1) return "< 1 month";
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

export function StaffDirectoryClient({ staff, stores }: Props) {
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

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

  // Stats
  const active = staff.filter((s) => s.status.toLowerCase() === "active");
  const managers = active.filter((s) => s.role === "Manager").length;
  const seniors = active.filter((s) => s.role === "Senior Staff").length;
  const regulars = active.filter((s) => s.role === "Staff").length;

  // Group by store for display
  const groupedByStore = useMemo(() => {
    if (storeFilter !== "all") return null; // flat list when filtered
    const groups: Record<string, { storeName: string; storeId: string; members: StaffMember[] }> = {};
    for (const s of filtered) {
      if (!groups[s.storeId]) {
        groups[s.storeId] = { storeName: s.storeName, storeId: s.storeId, members: [] };
      }
      groups[s.storeId].members.push(s);
    }
    return Object.values(groups);
  }, [filtered, storeFilter]);

  const showFlat = storeFilter !== "all" || search || roleFilter !== "All" || statusFilter !== "All";

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Directory</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Staff</h1>
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
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400 text-slate-600"
        >
          <option value="all">All Stores</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400 text-slate-600"
        >
          {ROLES.map((r) => <option key={r} value={r}>{r === "All" ? "All Roles" : r}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400 text-slate-600"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s === "All" ? "All Status" : STATUS_LABEL[s] ?? s}</option>)}
        </select>
      </div>

      {/* Results count when filtering */}
      {showFlat && (
        <p className="text-xs text-slate-400">
          {filtered.length} {filtered.length === 1 ? "person" : "people"} found
        </p>
      )}

      {/* Staff list — grouped by store OR flat */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <Users size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm">No staff match your filters.</p>
        </div>
      ) : showFlat ? (
        <div className="space-y-2">
          {filtered.map((s) => <StaffCard key={s.id} staff={s} showStore />)}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByStore?.map((group) => (
            <div key={group.storeId}>
              <div className="flex items-center justify-between mb-2.5">
                <Link href={`/stores/${group.storeId}`} className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors">
                  {group.storeName}
                </Link>
                <span className="text-xs text-slate-400">{group.members.filter(m => m.status.toLowerCase() === 'active').length} active</span>
              </div>
              <div className="space-y-2">
                {group.members.map((s) => <StaffCard key={s.id} staff={s} showStore={false} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffCard({ staff: s, showStore }: { staff: StaffMember; showStore: boolean }) {
  const isInactive = s.status.toLowerCase() !== "active";
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm px-4 py-3.5 flex items-center gap-3 ${isInactive ? "opacity-60" : ""}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
        s.role === "Manager" ? "bg-indigo-100 text-indigo-700" :
        s.role === "Senior Staff" ? "bg-sky-100 text-sky-700" :
        "bg-slate-100 text-slate-600"
      }`}>
        {s.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
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

      {/* Resigned indicator */}
      {s.status.toLowerCase() === "resigned" && (
        <UserX size={16} className="text-red-300 shrink-0" />
      )}
    </div>
  );
}
