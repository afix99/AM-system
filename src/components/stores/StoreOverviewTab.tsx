"use client";
import { useState } from "react";
import { MapPin, Phone, User, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { formatCurrency } from "@/lib/utils";

export function StoreOverviewTab({ store }: { store: any }) {
  const { toast } = useToast();
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const currentPerf = store.performances?.find((p: any) => p.month === month && p.year === year);
  const [totalSales, setTotalSales] = useState(currentPerf?.totalSales?.toString() || "");
  const [notes, setNotes] = useState(currentPerf?.areaManagerNotes || "");
  const [saving, setSaving] = useState(false);

  const achievement = currentPerf && store.targetMonthlySales > 0
    ? Math.round((currentPerf.totalSales / store.targetMonthlySales) * 100)
    : totalSales && store.targetMonthlySales > 0
    ? Math.round((parseFloat(totalSales) / store.targetMonthlySales) * 100)
    : null;

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/stores/${store.id}/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, totalSales: parseFloat(totalSales) || 0, targetSales: store.targetMonthlySales, areaManagerNotes: notes }),
      });
      toast("Performance saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Store Info</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Location</p>
              <p className="text-sm text-slate-700">{store.location}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Phone</p>
              <p className="text-sm text-slate-700">{store.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Manager</p>
              <p className="text-sm text-slate-700">{store.managerName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>This Month&apos;s Sales</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Actual Sales (RM)</label>
              <input
                type="number"
                value={totalSales}
                onChange={(e) => setTotalSales(e.target.value)}
                placeholder="0"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Target (RM)</label>
              <p className="mt-2 text-sm font-medium text-slate-700">{formatCurrency(store.targetMonthlySales)}</p>
            </div>
          </div>
          {achievement !== null && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${achievement >= 100 ? "bg-green-500" : achievement >= 80 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(achievement, 100)}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${achievement >= 100 ? "text-green-600" : achievement >= 80 ? "text-yellow-600" : "text-red-600"}`}>
                {achievement}%
              </span>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Area Manager Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this month's performance..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 resize-none"
            />
          </div>
          <Button onClick={save} disabled={saving} size="sm">
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
