"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function StorePerformanceTab({ store }: { store: any }) {
  const { toast } = useToast();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [perf, setPerf] = useState<any>(null);
  const [staffPerf, setStaffPerf] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState("");
  const [notes, setNotes] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const fetchPerf = useCallback(async () => {
    const res = await fetch(`/api/stores/${store.id}/performance?month=${month}&year=${year}`);
    const data = await res.json();
    const current = data.storePerf?.[0];
    setPerf(current || null);
    setTotalSales(current?.totalSales?.toString() || "");
    setNotes(current?.areaManagerNotes || "");
    setStaffPerf(data.staffPerf || []);
    const rMap: Record<string, number> = {};
    for (const sp of data.staffPerf || []) rMap[sp.staffId] = sp.rating;
    setRatings(rMap);

    // Build chart: last 3 months from performances
    const last3 = store.performances?.slice(0, 3).map((p: any) => ({
      name: `${MONTHS[p.month - 1]} ${p.year}`,
      sales: p.totalSales,
      target: p.targetSales,
    })).reverse() || [];
    setChartData(last3);
  }, [store.id, month, year]);

  useEffect(() => { fetchPerf(); }, [fetchPerf]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/stores/${store.id}/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, totalSales: parseFloat(totalSales) || 0, targetSales: store.targetMonthlySales, areaManagerNotes: notes, staffRatings: ratings }),
      });
      toast("Performance saved");
    } finally { setSaving(false); }
  };

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const achievement = store.targetMonthlySales > 0 && totalSales
    ? Math.round((parseFloat(totalSales) / store.targetMonthlySales) * 100)
    : perf && store.targetMonthlySales > 0
    ? Math.round((perf.totalSales / store.targetMonthlySales) * 100)
    : null;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Month picker */}
      <div className="flex items-center gap-2">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><ChevronLeft size={18} /></button>
        <span className="text-sm font-medium text-slate-700 min-w-[120px] text-center">{MONTHS[month - 1]} {year}</span>
        <button onClick={() => changeMonth(1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><ChevronRight size={18} /></button>
      </div>

      {/* Sales entry */}
      <Card>
        <CardHeader><CardTitle>Sales Performance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Actual Sales (RM)</label>
              <input type="number" value={totalSales} onChange={(e) => setTotalSales(e.target.value)} placeholder="0"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Target (RM)</label>
              <p className="text-sm font-medium text-slate-700 mt-2">{formatCurrency(store.targetMonthlySales)}</p>
            </div>
          </div>
          {achievement !== null && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${achievement >= 100 ? "bg-green-500" : achievement >= 80 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(achievement, 100)}%` }} />
              </div>
              <span className={`text-sm font-bold ${achievement >= 100 ? "text-green-600" : achievement >= 80 ? "text-yellow-600" : "text-red-600"}`}>
                {achievement}%
              </span>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Area manager notes..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Sales chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Last 3 Months</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `RM ${Number(v).toLocaleString()}`} />
                <Bar dataKey="sales" radius={[4,4,0,0]} fill="#334155">
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.sales >= entry.target ? "#16a34a" : "#e11d48"} />
                  ))}
                </Bar>
                <Bar dataKey="target" radius={[4,4,0,0]} fill="#e2e8f0" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 justify-center text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-600 inline-block" />Actual (met)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-600 inline-block" />Actual (missed)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-200 inline-block" />Target</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff ratings */}
      <Card>
        <CardHeader><CardTitle>Staff Ratings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {store.staff.filter((s: any) => s.status === "active").map((staff: any) => (
            <div key={staff.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{staff.name}</p>
                <p className="text-xs text-slate-400">{staff.role}</p>
              </div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map((star) => (
                  <button key={star} onClick={() => setRatings((prev) => ({ ...prev, [staff.id]: star }))}
                    className={`text-xl transition-colors ${(ratings[staff.id] || 0) >= star ? "text-yellow-400" : "text-slate-200 hover:text-yellow-300"}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}><Save size={14} />{saving ? "Saving..." : "Save All"}</Button>
    </div>
  );
}
