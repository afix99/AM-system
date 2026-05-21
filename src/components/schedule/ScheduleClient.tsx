"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download, ChevronDown, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getWeekDates, getWeekLabel, getShiftColor } from "@/lib/utils";
import { ImportModal } from "./ImportModal";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ScheduleClient({ stores }: { stores: any[] }) {
  const router = useRouter();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduleMap, setScheduleMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showImport, setShowImport] = useState(false);

  const weekStart = getWeekDates(new Date(today.getTime() + weekOffset * 7 * 86400000))[0];
  const weekDates = getWeekDates(weekStart);
  const weekLabel = getWeekLabel(weekDates);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/schedule?weekStart=${weekDates[0].toISOString()}&weekEnd=${weekDates[6].toISOString()}`);
    const data = await res.json();
    const map: Record<string, string> = {};
    for (const item of data) {
      const key = `${item.staffId}_${item.date.slice(0, 10)}`;
      map[key] = item.shiftType;
    }
    setScheduleMap(map);
    setLoading(false);
  }, [weekDates[0].toISOString()]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getShift = (staffId: string, date: Date) => {
    return scheduleMap[`${staffId}_${date.toISOString().slice(0, 10)}`] || "";
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows: any[] = [];
    rows.push(["Store", "Staff", "Role", ...weekDates.map((d, i) => `${DAYS[i]} ${d.getDate()}`)]);
    for (const store of stores) {
      for (const staff of store.staff) {
        rows.push([store.name, staff.name, staff.role, ...weekDates.map((d) => getShift(staff.id, d) || "-")]);
      }
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, `schedule-${weekDates[0].toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Team</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Weekly Schedule</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
            <Upload size={14} /> Import Excel
          </Button>
          <Button size="sm" variant="outline" onClick={exportExcel}>
            <Download size={14} /> Export
          </Button>
        </div>
      </div>

      {/* Week nav */}
      <div className="flex items-center gap-2">
        <button onClick={() => setWeekOffset((o) => o - 1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><ChevronLeft size={18} /></button>
        <span className="text-sm font-medium text-slate-700 min-w-[220px] text-center">{weekLabel}</span>
        <button onClick={() => setWeekOffset((o) => o + 1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><ChevronRight size={18} /></button>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} className="text-xs text-slate-500 hover:text-slate-700 underline ml-1">This week</button>
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-400">Loading...</div>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => {
            const isCollapsed = collapsed[store.id];
            // Check for days with zero coverage
            const zeroDays = weekDates.map((date, i) => {
              const staffed = store.staff.filter((s: any) => {
                const shift = getShift(s.id, date);
                return shift && shift !== "Off";
              }).length;
              return staffed === 0 ? DAYS[i] : null;
            }).filter(Boolean);

            return (
              <div key={store.id} className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => setCollapsed((prev) => ({ ...prev, [store.id]: !prev[store.id] }))}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{store.name}</span>
                    <span className="text-xs text-slate-500 ml-2">{store.staff.length} staff</span>
                    {zeroDays.length > 0 && (
                      <span className="ml-2 text-xs text-red-600 font-medium">⚠ No coverage: {zeroDays.join(", ")}</span>
                    )}
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isCollapsed ? "" : "rotate-180"}`} />
                </button>

                {!isCollapsed && (
                  <div className="overflow-x-auto border-t border-slate-100">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left px-3 py-2 font-medium text-slate-500 text-xs border-b border-slate-100 w-36">Staff</th>
                          {weekDates.map((date, i) => {
                            const staffed = store.staff.filter((s: any) => {
                              const sh = getShift(s.id, date);
                              return sh && sh !== "Off";
                            }).length;
                            const isToday = date.toDateString() === today.toDateString();
                            return (
                              <th key={i} className={`px-2 py-2 font-medium text-center text-xs border-b border-slate-100 min-w-[80px] ${isToday ? "bg-slate-100" : ""} ${staffed === 0 ? "bg-red-50" : ""}`}>
                                <div className={`font-medium ${staffed === 0 ? "text-red-600" : "text-slate-600"}`}>{DAYS[i]}</div>
                                <div className="text-slate-400 font-normal">{date.getDate()}</div>
                                <div className={`text-xs ${staffed === 0 ? "text-red-500 font-semibold" : "text-slate-400"}`}>{staffed === 0 ? "⚠ 0" : `${staffed}`}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {store.staff.map((staff: any) => (
                          <tr key={staff.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 border-b border-slate-50 whitespace-nowrap">
                              <p className="font-medium text-slate-700 text-xs">{staff.name}</p>
                              <p className="text-slate-400 text-xs">{staff.role}</p>
                            </td>
                            {weekDates.map((date, i) => {
                              const shift = getShift(staff.id, date);
                              return (
                                <td key={i} className="px-1.5 py-2 border-b border-slate-50 text-center">
                                  {shift ? (
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getShiftColor(shift)}`}>
                                      {shift === "Morning" ? "AM" : shift === "Afternoon" ? "PM" : shift === "Closing" ? "CL" : "OFF"}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 text-xs">–</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showImport && (
        <ImportModal
          stores={stores.map((s) => ({ id: s.id, name: s.name, staff: s.staff }))}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            router.refresh();
            fetchAll();
          }}
        />
      )}
    </div>
  );
}
