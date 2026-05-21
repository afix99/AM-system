"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function PerformanceClient({ stores }: { stores: { id: string; name: string }[] }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/performance?month=${month}&year=${year}`);
    const result = await res.json();
    setData(result);
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const changeMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const chartData = data.map((d) => ({
    name: d.store.name.split(" ")[0],
    fullName: d.store.name,
    sales: d.totalSales,
    target: d.targetSales,
    achievement: d.achievement,
  }));

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = [["Rank","Store","Sales","Target","Achievement %","vs Last Month"]];
    for (const d of data) {
      rows.push([d.rank, d.store.name, d.totalSales, d.targetSales, `${d.achievement}%`, d.trend === "up" ? "↑" : d.trend === "down" ? "↓" : "→"]);
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Performance");
    XLSX.writeFile(wb, `performance-${MONTHS[month-1]}-${year}.xlsx`);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-white/[0.10] p-3 text-xs" style={{ background: "#262220" }}>
        <p className="font-semibold text-stone-200 mb-1">{payload[0]?.payload?.fullName || label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: RM {Number(p.value).toLocaleString()}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-medium text-[#D97756]/80 uppercase tracking-widest mb-0.5">Analytics</p>
          <h1 className="text-2xl font-bold text-stone-100">Performance</h1>
        </div>
        <Button size="sm" variant="outline" onClick={exportExcel}><Download size={14} /> Export Excel</Button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-stone-500 hover:text-stone-300 transition-colors border border-white/[0.07]">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-stone-200 min-w-[120px] text-center">{MONTHS[month - 1]} {year}</span>
        <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-stone-500 hover:text-stone-300 transition-colors border border-white/[0.07]">
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-stone-600 text-sm">Loading...</div>
      ) : data.length === 0 ? (
        <div className="py-16 text-center text-stone-600 text-sm">No performance data for this month.</div>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle>Store Rankings — {MONTHS[month - 1]} {year}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <tr>
                    {["#","Store","Sales","Target","Achievement","Trend"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium text-stone-500 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {data.map((d) => (
                    <tr key={d.store.id}
                      onClick={() => setSelectedStore(selectedStore === d.store.id ? null : d.store.id)}
                      className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${selectedStore === d.store.id ? "bg-[#D97756]/10" : ""}`}>
                      <td className="px-4 py-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          d.rank === 1 ? "bg-yellow-950/60 text-yellow-400 border border-yellow-500/30" :
                          d.rank === 2 ? "bg-white/[0.06] text-stone-300 border border-white/[0.10]" :
                          d.rank === 3 ? "bg-orange-950/60 text-orange-400 border border-orange-500/30" :
                          "bg-white/[0.03] text-stone-600 border border-white/[0.06]"
                        }`}>{d.rank}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-200">{d.store.name}</td>
                      <td className="px-4 py-3 text-stone-400">{formatCurrency(d.totalSales)}</td>
                      <td className="px-4 py-3 text-stone-600">{formatCurrency(d.targetSales)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${d.achievement >= 100 ? "text-emerald-400" : d.achievement >= 80 ? "text-amber-400" : "text-red-400"}`}>
                          {d.achievement}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {d.trend === "up" ? <TrendingUp size={15} className="text-emerald-400" /> :
                         d.trend === "down" ? <TrendingDown size={15} className="text-red-400" /> :
                         <Minus size={15} className="text-stone-600" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sales vs Target</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={2} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#78716c" }} />
                  <Bar dataKey="sales" name="Actual Sales" radius={[4,4,0,0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.achievement >= 100 ? "#10b981" : entry.achievement >= 80 ? "#f59e0b" : "#ef4444"} />
                    ))}
                  </Bar>
                  <Bar dataKey="target" name="Target" radius={[4,4,0,0]} fill="rgba(255,255,255,0.06)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {selectedStore && (() => {
            const store = data.find((d) => d.store.id === selectedStore);
            return store ? (
              <Card>
                <CardHeader><CardTitle>Staff Ratings — {store.store.name}</CardTitle></CardHeader>
                <CardContent>
                  <StaffRatings storeId={selectedStore} month={month} year={year} />
                </CardContent>
              </Card>
            ) : null;
          })()}
        </>
      )}
    </div>
  );
}

function StaffRatings({ storeId, month, year }: { storeId: string; month: number; year: number }) {
  const [staffPerf, setStaffPerf] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/stores/${storeId}/performance?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((d) => setStaffPerf(d.staffPerf || []));
  }, [storeId, month, year]);

  if (staffPerf.length === 0) return <p className="text-sm text-stone-600">No ratings recorded for this month.</p>;
  return (
    <div className="space-y-3">
      {staffPerf.map((sp) => (
        <div key={sp.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
          <div>
            <p className="text-sm font-medium text-stone-200">{sp.staff.name}</p>
            <p className="text-xs text-stone-600">{sp.staff.role}</p>
          </div>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((star) => (
              <span key={star} className={`text-lg leading-none ${sp.rating >= star ? "text-[#D97756]" : "text-white/[0.07]"}`}>★</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
