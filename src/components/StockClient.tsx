"use client";
import { useState } from "react";
import { AlertTriangle, Download, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

export function StockClient({ initialItems, stores }: { initialItems: any[]; stores: { id: string; name: string }[] }) {
  const [items] = useState(initialItems);
  const [storeFilter, setStoreFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [search, setSearch] = useState("");

  const categories = [...new Set(items.map((i) => i.category))].sort();
  const lowStockItems = items.filter((i) => i.quantity <= i.minStockLevel);

  const filtered = items.filter((i) => {
    if (storeFilter && i.storeId !== storeFilter) return false;
    if (categoryFilter && i.category !== categoryFilter) return false;
    if (lowOnly && i.quantity > i.minStockLevel) return false;
    if (search && !i.productName.toLowerCase().includes(search.toLowerCase()) && !i.store?.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = [["Store", "Product", "Category", "Size", "Color", "Price", "Qty", "Min Level", "Status"]];
    for (const item of filtered) {
      rows.push([item.store?.name, item.productName, item.category, item.size, item.color, item.sellingPrice, item.quantity, item.minStockLevel, item.quantity <= item.minStockLevel ? "LOW" : "OK"]);
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    XLSX.writeFile(wb, `stock-overview.xlsx`);
  };

  const lowByStore = lowStockItems.reduce((acc: Record<string, any[]>, item) => {
    const sname = item.store?.name || "Unknown";
    if (!acc[sname]) acc[sname] = [];
    acc[sname].push(item);
    return acc;
  }, {});

  const selectCls = "px-3 py-1.5 border border-white/[0.08] rounded-full text-xs bg-white/[0.04] text-slate-500 focus:outline-none";

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-medium text-indigo-400/80 uppercase tracking-widest mb-0.5">Inventory</p>
          <h1 className="text-2xl font-bold text-slate-100">Stock Overview</h1>
        </div>
        <Button size="sm" variant="outline" onClick={exportExcel}><Download size={14} /> Export Excel</Button>
      </div>

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-red-400" />
            <p className="text-sm font-semibold text-red-400">{lowStockItems.length} items below minimum stock level</p>
          </div>
          <div className="space-y-2">
            {Object.entries(lowByStore).map(([storeName, storeItems]) => (
              <div key={storeName}>
                <p className="text-xs font-medium text-red-500/70 mb-1">{storeName}</p>
                <div className="flex flex-wrap gap-1.5">
                  {storeItems.map((item) => (
                    <span key={item.id} className="text-xs bg-red-950/50 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                      {item.productName} {item.size} — {item.quantity} left
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-3 py-1.5 border border-white/[0.08] rounded-full text-xs bg-white/[0.04] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 w-44"
          />
        </div>
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className={selectCls} style={{ colorScheme: "dark" }}>
          <option value="" style={{ background: "#0C1228" }}>All Stores</option>
          {stores.map((s) => <option key={s.id} value={s.id} style={{ background: "#0C1228" }}>{s.name}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectCls} style={{ colorScheme: "dark" }}>
          <option value="" style={{ background: "#0C1228" }}>All Categories</option>
          {categories.map((c) => <option key={c} style={{ background: "#0C1228" }}>{c}</option>)}
        </select>
        <button
          onClick={() => setLowOnly(!lowOnly)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            lowOnly
              ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-900/30"
              : "border-white/[0.08] bg-white/[0.04] text-slate-500 hover:border-red-500/40 hover:text-red-400"
          }`}
        >
          Low Stock Only
        </button>
        <span className="text-xs text-slate-600 ml-auto">{filtered.length} items</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                <tr>
                  {["Store", "Product", "Category", "Size", "Color", "Price", "Qty", "Min"].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 font-medium text-slate-500 text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-10 text-center text-slate-600 text-sm">No items found.</td></tr>
                ) : filtered.map((item) => {
                  const isLow = item.quantity <= item.minStockLevel;
                  return (
                    <tr key={item.id} className={`transition-colors ${isLow ? "bg-red-950/20" : "hover:bg-white/[0.02]"}`}>
                      <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">{item.store?.name}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-300">{item.productName}</td>
                      <td className="px-3 py-2.5 text-slate-500">{item.category}</td>
                      <td className="px-3 py-2.5 text-slate-500">{item.size}</td>
                      <td className="px-3 py-2.5 text-slate-500">{item.color}</td>
                      <td className="px-3 py-2.5 text-slate-400">{formatCurrency(item.sellingPrice)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`font-bold ${isLow ? "text-red-400" : "text-slate-200"}`}>{item.quantity}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{item.minStockLevel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
