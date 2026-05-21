"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toaster";
import { formatDate } from "@/lib/utils";

const STATUSES = ["Present", "Late", "Absent", "Leave"] as const;
type AttStatus = (typeof STATUSES)[number];

const STATUS_COLORS: Record<AttStatus, string> = {
  Present: "bg-emerald-950/60 text-emerald-400 border-emerald-500/30",
  Late:    "bg-amber-950/60 text-amber-400 border-amber-500/30",
  Absent:  "bg-red-950/60 text-red-400 border-red-500/30",
  Leave:   "bg-blue-950/60 text-blue-400 border-blue-500/30",
};

const STATUS_ACTIVE: Record<AttStatus, string> = {
  Present: "bg-emerald-950/60 text-emerald-400 border-emerald-500/30",
  Late:    "bg-amber-950/60 text-amber-400 border-amber-500/30",
  Absent:  "bg-red-950/60 text-red-400 border-red-500/30",
  Leave:   "bg-blue-950/60 text-blue-400 border-blue-500/30",
};

export function StoreAttendanceTab({ store }: { store: any }) {
  const { toast } = useToast();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState(today);
  const [attendance, setAttendance] = useState<Record<string, AttStatus>>({});
  const [monthStats, setMonthStats] = useState<Record<string, { present: number; total: number }>>({});
  const [loading, setLoading] = useState(true);

  const activeStaff = store.staff.filter((s: any) => s.status === "active");
  const dateStr = selectedDate.toISOString().slice(0, 10);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    const [dayRes, monthRes] = await Promise.all([
      fetch(`/api/stores/${store.id}/attendance?date=${dateStr}`),
      fetch(`/api/stores/${store.id}/attendance?month=${selectedDate.getMonth() + 1}&year=${selectedDate.getFullYear()}`),
    ]);
    const dayData = await dayRes.json();
    const monthData = await monthRes.json();

    const attMap: Record<string, AttStatus> = {};
    for (const a of dayData) attMap[a.staffId] = a.status as AttStatus;
    setAttendance(attMap);

    const stats: Record<string, { present: number; total: number }> = {};
    const uniqueDates = new Set(monthData.map((a: any) => a.date.slice(0, 10)));
    for (const staff of activeStaff) {
      const staffRecs = monthData.filter((a: any) => a.staffId === staff.id);
      const present = staffRecs.filter((a: any) => a.status === "Present" || a.status === "Late").length;
      stats[staff.id] = { present, total: uniqueDates.size };
    }
    setMonthStats(stats);
    setLoading(false);
  }, [store.id, dateStr, selectedDate.getMonth(), selectedDate.getFullYear()]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const markAttendance = async (staffId: string, status: AttStatus) => {
    setAttendance((prev) => ({ ...prev, [staffId]: status }));
    await fetch(`/api/stores/${store.id}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, date: selectedDate.toISOString(), status }),
    });
    toast(`Marked ${status}`);
  };

  const changeDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2">
        <button
          onClick={() => changeDate(-1)}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 border border-white/[0.07] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => setSelectedDate(new Date(e.target.value + "T00:00:00"))}
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
          style={{ colorScheme: "dark" }}
        />
        <button
          onClick={() => changeDate(1)}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 border border-white/[0.07] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
        <span className="text-sm text-slate-500 ml-1">{formatDate(selectedDate)}</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center text-slate-600 text-sm">Loading...</div>
          ) : activeStaff.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-sm">No active staff.</div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {activeStaff.map((staff: any) => {
                const current = attendance[staff.id];
                const stats = monthStats[staff.id];
                const rate = stats && stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : null;
                return (
                  <li key={staff.id} className="px-4 py-3 hover:bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{staff.name}</p>
                        <p className="text-xs text-slate-600">
                          {staff.role}
                          {rate !== null && <span className={`ml-1 ${rate >= 80 ? "text-emerald-500" : rate >= 60 ? "text-amber-500" : "text-red-500"}`}>· {rate}% this month</span>}
                        </p>
                      </div>
                      {current && <Badge className={STATUS_COLORS[current]}>{current}</Badge>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => markAttendance(staff.id, s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all min-h-[32px] ${
                            current === s
                              ? STATUS_ACTIVE[s]
                              : "border-white/[0.08] bg-white/[0.03] text-slate-500 hover:border-white/20 hover:text-slate-300"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
