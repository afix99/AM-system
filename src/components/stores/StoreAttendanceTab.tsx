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
  Present: "bg-green-100 text-green-800 border-green-200",
  Late: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Absent: "bg-red-100 text-red-800 border-red-200",
  Leave: "bg-blue-100 text-blue-800 border-blue-200",
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

    // Calculate monthly stats per staff
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
      {/* Date picker */}
      <div className="flex items-center gap-2">
        <button onClick={() => changeDate(-1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><ChevronLeft size={18} /></button>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => setSelectedDate(new Date(e.target.value + "T00:00:00"))}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-slate-400"
        />
        <button onClick={() => changeDate(1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><ChevronRight size={18} /></button>
        <span className="text-sm text-slate-500 ml-1">{formatDate(selectedDate)}</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : activeStaff.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No active staff.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activeStaff.map((staff: any) => {
                const current = attendance[staff.id];
                const stats = monthStats[staff.id];
                const rate = stats && stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : null;
                return (
                  <li key={staff.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{staff.name}</p>
                        <p className="text-xs text-slate-400">{staff.role}{rate !== null ? ` · ${rate}% this month` : ""}</p>
                      </div>
                      {current && <Badge className={STATUS_COLORS[current]}>{current}</Badge>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => markAttendance(staff.id, s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[32px] ${
                            current === s ? STATUS_COLORS[s] : "border-slate-200 text-slate-500 hover:bg-slate-50"
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
