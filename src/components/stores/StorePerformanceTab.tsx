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
    const rMap: Record<string, number> = {};
    for (const sp of data.staffPerf || []) rMap[sp.staffId] = sp.rating;
    setRatings(rMap);
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
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const achievement = store.targetMonthlySales > 0 && totalSales
    ? Math.round((parseFloat(totalSales) / store.targetMonthlySales) * 100)
    : perf && store.targetMonthlySales > 0
    ? Math.round((perf.totalSales / store.targetMonthlySales) * 100)
    : null;

  const achieveBarColor = achievement === null ? "#D97756" : achievement >= 100 ? "#10b981" : achievement >= 80 ? "#f59e0b" : "#ef4444";
  const achieveTextColor = achievement === null ? "text-stone-400" : achievement >= 100 ? "text-emerald-400" : achievement >= 80 ? "text-amber-400" : "text-red-400";
  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40";

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-white/[0.10] p-2.5 text-xs" style={{ background: "#262220" }}>
        {payload.map((p: any) => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: RM {Number(p.value).toLocaleString()}</p>)}
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-stone-500 hover:text-stone-300 border border-white/[0.07] transition-colors"><ChevronLeft size={16} /></button>
        <span className="text-sm font-semibold text-stone-200 min-w-[120px] text-center">{MONTHS[month - 1]} {year}</span>
        <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-stone-500 hover:text-stone-300 border border-white/[0.07] transition-colors"><ChevronRight size={16} /></button>
      </div>

      <Card>
        <CardHeader><CardTitle>Sales Performance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Actual Sales (RM)</label>
              <input type="number" value={totalSales} onChange={(e) => setTotalSales(e.target.value)} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Target (RM)</label>
              <p className="text-sm font-semibold text-stone-300 mt-2">{formatCurrency(store.targetMonthlySales)}</p>
            </div>
          </div>
          {achievement !== null && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-stone-500">Achievement</span>
                <span className={`text-sm font-bold ${achieveTextColor}`}>{achievement}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(achievement, 100)}%`, background: achieveBarColor }} />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Area manager notes..." className={`${inputCls} resize-none`} />
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Last 3 Months</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="sales" name="Actual" radius={[4,4,0,0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.sales >= entry.target ? "#10b981" : "#ef4444"} />)}
                </Bar>
                <Bar dataKey="target" name="Target" radius={[4,4,0,0]} fill="rgba(255,255,255,0.06)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Staff Ratings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {store.staff.filter((s: any) => s.status === "active").length === 0 ? (
            <p className="text-sm text-stone-600">No active staff.</p>
          ) : store.staff.filter((s: any) => s.status === "active").map((staff: any) => (
            <div key={staff.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <div>
                <p className="text-sm font-medium text-stone-200">{staff.name}</p>
                <p className="text-xs text-stone-600">{staff.role}</p>
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((star) => (
                  <button key={star} onClick={() => setRatings((prev) => ({ ...prev, [staff.id]: star }))}
                    className={`text-xl leading-none transition-colors ${(ratings[staff.id] || 0) >= star ? "text-[#D97756]" : "text-white/[0.07] hover:text-[#D97756]/50"}`}>
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
