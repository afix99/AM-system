"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Copy, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { getWeekDates, getWeekLabel, getShiftColor, getShiftLabel } from "@/lib/utils";

const SHIFTS = ["M", "N", "H", "HM", "HN", "Off"] as const;
const SHIFT_DESCRIPTIONS: Record<string, string> = {
  M:   "Morning  9:30AM – 6:30PM",
  N:   "Noon     1PM – 10PM",
  H:   "Half     5PM – 10PM",
  HM:  "Half Morning  9:30AM – 2:30PM",
  HN:  "Half Noon     5PM – 10PM",
  Off: "Off / Rest",
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function StoreScheduleTab({ store }: { store: any }) {
  const { toast } = useToast();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduleMap, setScheduleMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeStaff = store.staff.filter((s: any) => s.status === "active");

  const weekStart = getWeekDates(new Date(today.getTime() + weekOffset * 7 * 86400000))[0];
  const weekDates = getWeekDates(weekStart);
  const weekLabel = getWeekLabel(weekDates);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/stores/${store.id}/schedule?weekStart=${weekDates[0].toISOString()}&weekEnd=${weekDates[6].toISOString()}`
    );
    const data = await res.json();
    const map: Record<string, string> = {};
    for (const item of data) {
      const key = `${item.staffId}_${item.date.slice(0, 10)}`;
      map[key] = item.shiftType;
    }
    setScheduleMap(map);
    setLoading(false);
  }, [store.id, weekDates[0].toISOString()]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const setShift = (staffId: string, date: Date, shift: string) => {
    const key = `${staffId}_${date.toISOString().slice(0, 10)}`;
    setScheduleMap((prev) => ({ ...prev, [key]: shift }));
  };

  const getShift = (staffId: string, date: Date) => {
    const key = `${staffId}_${date.toISOString().slice(0, 10)}`;
    return scheduleMap[key] || "";
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const promises = [];
      for (const staff of activeStaff) {
        for (const date of weekDates) {
          const shift = getShift(staff.id, date);
          if (shift) {
            promises.push(
              fetch(`/api/stores/${store.id}/schedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ staffId: staff.id, date: date.toISOString(), shiftType: shift }),
              })
            );
          }
        }
      }
      await Promise.all(promises);
      toast("Schedule saved");
    } finally {
      setSaving(false);
    }
  };

  const copyLastWeek = async () => {
    const lastWeekStart = new Date(weekDates[0]); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekDates[6]); lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
    const res = await fetch(`/api/stores/${store.id}/schedule?weekStart=${lastWeekStart.toISOString()}&weekEnd=${lastWeekEnd.toISOString()}`);
    const data = await res.json();
    const newMap = { ...scheduleMap };
    for (const item of data) {
      const oldDate = new Date(item.date);
      const newDate = new Date(oldDate); newDate.setDate(oldDate.getDate() + 7);
      const key = `${item.staffId}_${newDate.toISOString().slice(0, 10)}`;
      newMap[key] = item.shiftType;
    }
    setScheduleMap(newMap);
    toast("Last week's schedule copied");
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Week nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((o) => o - 1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-slate-700 min-w-[200px] text-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset((o) => o + 1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyLastWeek}><Copy size={14} /> Copy Last Week</Button>
          <Button size="sm" onClick={saveSchedule} disabled={saving}><Save size={14} />{saving ? "Saving..." : "Save"}</Button>
        </div>
      </div>

      {/* Shift legend */}
      <div className="flex flex-wrap gap-2">
        {SHIFTS.filter(s => s !== 'Off').map((s) => (
          <span key={s} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getShiftColor(s)}`}>
            <span className="font-bold">{s}</span>
            <span className="font-normal opacity-75">
              {s === 'M' ? '9:30AM–6:30PM' : s === 'N' ? '1PM–10PM' : s === 'H' ? '5PM–10PM' : s === 'HM' ? '9:30AM–2:30PM' : '5PM–10PM'}
            </span>
          </span>
        ))}
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getShiftColor('Off')}`}>
          Off
        </span>
      </div>

      {/* Schedule grid */}
      {loading ? (
        <div className="py-10 text-center text-slate-400 text-sm">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-3 py-2 font-medium text-slate-600 border border-slate-200 w-32">Staff</th>
                {weekDates.map((date, i) => (
                  <th key={i} className={`px-2 py-2 font-medium text-center border border-slate-200 w-28 ${date.toDateString() === today.toDateString() ? "bg-slate-200" : ""}`}>
                    <div className="text-slate-600">{DAYS[i]}</div>
                    <div className="text-xs text-slate-400">{date.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeStaff.map((staff: any) => (
                <tr key={staff.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 border border-slate-200 font-medium text-slate-700 whitespace-nowrap">
                    <div>{staff.name}</div>
                    <div className="text-xs text-slate-400">{staff.role}</div>
                  </td>
                  {weekDates.map((date, i) => {
                    const shift = getShift(staff.id, date);
                    return (
                      <td key={i} className="px-1 py-1 border border-slate-200">
                        <select
                          value={shift}
                          onChange={(e) => setShift(staff.id, date, e.target.value)}
                          className={`w-full text-xs px-1 py-1.5 rounded border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 ${shift ? getShiftColor(shift) : "bg-white text-slate-400"}`}
                        >
                          <option value="">—</option>
                          {SHIFTS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Zero staff warning row */}
              {weekDates.map((date, i) => {
                const scheduled = activeStaff.filter((s: any) => {
                  const shift = getShift(s.id, date);
                  return shift && shift !== "Off";
                }).length;
                return scheduled === 0 ? (
                  <tr key={`warn-${i}`} className="bg-red-50">
                    <td colSpan={8} className="px-3 py-1.5 border border-red-100 text-xs text-red-600 text-center">
                      ⚠ No staff scheduled for {DAYS[i]}
                    </td>
                  </tr>
                ) : null;
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
