"use client";
import { useState } from "react";
import { MapPin, Phone, User, Save, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { formatCurrency } from "@/lib/utils";

export function StoreOverviewTab({ store }: { store: any }) {
  const { toast } = useToast();
  const router = useRouter();
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const currentPerf = store.performances?.find((p: any) => p.month === month && p.year === year);
  const [totalSales, setTotalSales] = useState(currentPerf?.totalSales?.toString() || "");
  const [notes, setNotes] = useState(currentPerf?.areaManagerNotes || "");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [name, setName] = useState(store.name);
  const [location, setLocation] = useState(store.location);
  const [phone, setPhone] = useState(store.phone);
  const [managerName, setManagerName] = useState(store.managerName);
  const [targetSales, setTargetSales] = useState(store.targetMonthlySales?.toString() || "");

  const achievement = currentPerf && store.targetMonthlySales > 0
    ? Math.round((currentPerf.totalSales / store.targetMonthlySales) * 100)
    : totalSales && store.targetMonthlySales > 0
    ? Math.round((parseFloat(totalSales) / store.targetMonthlySales) * 100)
    : null;

  const saveSales = async () => {
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

  const saveStoreInfo = async () => {
    setEditSaving(true);
    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
          phone: phone.trim(),
          managerName: managerName.trim(),
          targetMonthlySales: parseFloat(targetSales) || 0,
          updatedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast("Store info updated");
      setEditing(false);
      router.refresh();
    } catch {
      toast("Failed to save store info", "error");
    } finally {
      setEditSaving(false);
    }
  };

  const cancelEdit = () => {
    setName(store.name);
    setLocation(store.location);
    setPhone(store.phone);
    setManagerName(store.managerName);
    setTargetSales(store.targetMonthlySales?.toString() || "");
    setEditing(false);
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  const achieveBarColor = achievement === null ? "#6366f1" :
    achievement >= 100 ? "#10b981" :
    achievement >= 80 ? "#f59e0b" : "#ef4444";
  const achieveTextColor = achievement === null ? "text-slate-400" :
    achievement >= 100 ? "text-emerald-400" :
    achievement >= 80 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Store Info</CardTitle>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors border border-white/[0.07] rounded-lg px-2 py-1"
              >
                <Pencil size={12} /> Edit
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Store Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Manager Name</label>
                <input value={managerName} onChange={(e) => setManagerName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Monthly Sales Target (RM)</label>
                <input type="number" value={targetSales} onChange={(e) => setTargetSales(e.target.value)} className={inputCls} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={saveStoreInfo} disabled={editSaving} size="sm">
                  <Save size={14} /> {editSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button onClick={cancelEdit} variant="ghost" size="sm">
                  <X size={14} /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <MapPin size={14} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Location</p>
                  <p className="text-sm text-slate-300 mt-0.5">{store.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Phone size={14} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Phone</p>
                  <p className="text-sm text-slate-300 mt-0.5">{store.phone || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <User size={14} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Manager</p>
                  <p className="text-sm text-slate-300 mt-0.5">{store.managerName || "—"}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>This Month&apos;s Sales</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Actual Sales (RM)</label>
              <input
                type="number"
                value={totalSales}
                onChange={(e) => setTotalSales(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Target (RM)</label>
              <p className="mt-2 text-sm font-semibold text-slate-300">{formatCurrency(store.targetMonthlySales)}</p>
            </div>
          </div>

          {achievement !== null && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Achievement</span>
                <span className={`text-sm font-bold ${achieveTextColor}`}>{achievement}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(achievement, 100)}%`, background: achieveBarColor }}
                />
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Area Manager Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this month's performance..."
              className={`${inputCls} resize-none`}
            />
          </div>
          <Button onClick={saveSales} disabled={saving} size="sm">
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
