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
    let m = month + delta; let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const chartData = data.map((d) => ({
    name: d.store.name.replace(" ", "\n").split(" ")[0],
    fullName: d.store.name,
    sales: d.totalSales,
    target: d.targetSales,
    achievement: d.achievement,
  }));

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = [["Rank", "Store", "Sales", "Target", "Achievement %", "vs Last Month"]];
    for (const d of data) {
      rows.push([d.rank, d.store.name, d.totalSales, d.targetSales, `${d.achievement}%`, d.trend === "up" ? "↑" : d.trend === "down" ? "↓" : "→"]);
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Performance");
    XLSX.writeFile(wb, `performance-${MONTHS[month-1]}-${year}.xlsx`);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Performance</h1>
        <Button size="sm" variant="outline" onClick={exportExcel}><Download size={14} /> Export Excel</Button>
      </div>

      {/* Month picker */}
      <div className="flex items-center gap-2">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><ChevronLeft size={18} /></button>
        <span className="text-sm font-medium text-slate-700 min-w-[120px] text-center">{MONTHS[month - 1]} {year}</span>
        <button onClick={() => changeMonth(1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><ChevronRight size={18} /></button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-400">Loading...</div>
      ) : data.length === 0 ? (
        <div className="py-10 text-center text-slate-400">No performance data for this month.</div>
      ) : (
        <>
          {/* Rankings table */}
          <Card>
            <CardHeader><CardTitle>Store Rankings — {MONTHS[month - 1]} {year}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["#", "Store", "Sales", "Target", "Achievement", "Trend"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium text-slate-500 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((d) => (
                    <tr key={d.store.id}
                      onClick={() => setSelectedStore(selectedStore === d.store.id ? null : d.store.id)}
                      className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${d.rank === 1 ? "bg-yellow-100 text-yellow-700" : d.rank === 2 ? "bg-slate-100 text-slate-700" : d.rank === 3 ? "bg-orange-100 text-orange-700" : "bg-slate-50 text-slate-400"}`}>
                          {d.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{d.store.name}</td>
                      <td className="px-4 py-3 text-slate-700">{formatCurrency(d.totalSales)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatCurrency(d.targetSales)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${d.achievement >= 100 ? "text-green-600" : d.achievement >= 80 ? "text-yellow-600" : "text-red-600"}`}>
                          {d.achievement}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {d.trend === "up" ? <TrendingUp size={16} className="text-green-600" /> :
                         d.trend === "down" ? <TrendingDown size={16} className="text-red-600" /> :
                         <Minus size={16} className="text-slate-400" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card>
            <CardHeader><CardTitle>Sales vs Target</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={2} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => `RM ${Number(v).toLocaleString()}`} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""} />
                  <Legend />
                  <Bar dataKey="sales" name="Actual Sales" radius={[4,4,0,0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.achievement >= 100 ? "#16a34a" : entry.achievement >= 80 ? "#ca8a04" : "#dc2626"} />
                    ))}
                  </Bar>
                  <Bar dataKey="target" name="Target" radius={[4,4,0,0]} fill="#e2e8f0" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Staff ratings for selected store */}
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

  if (staffPerf.length === 0) return <p className="text-sm text-slate-400">No ratings recorded for this month.</p>;
  return (
    <div className="space-y-3">
      {staffPerf.map((sp) => (
        <div key={sp.id} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">{sp.staff.name}</p>
            <p className="text-xs text-slate-400">{sp.staff.role}</p>
          </div>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((star) => (
              <span key={star} className={`text-lg ${sp.rating >= star ? "text-yellow-400" : "text-slate-200"}`}>★</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
