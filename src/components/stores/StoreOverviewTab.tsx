"use client";
import { useState } from "react";
import { MapPin, Phone, User, Save, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";

interface StoreShape {
  id: string;
  name: string;
  location: string;
  phone: string;
  managerName: string;
}

export function StoreOverviewTab({ store }: { store: StoreShape }) {
  const { toast } = useToast();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [name, setName] = useState(store.name);
  const [location, setLocation] = useState(store.location);
  const [phone, setPhone] = useState(store.phone);
  const [managerName, setManagerName] = useState(store.managerName);

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
    setEditing(false);
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40";
  const labelCls = "block text-xs font-medium text-stone-500 mb-1";

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Store Info</CardTitle>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors border border-white/[0.07] rounded-lg px-2 py-1"
              >
                <Pencil size={12} /> Edit
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {editing ? (
            <div className="space-y-3">
              <div><label className={labelCls}>Store Name</label><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Location</label><input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Manager Name</label><input value={managerName} onChange={(e) => setManagerName(e.target.value)} className={inputCls} /></div>
              <div className="flex gap-2 pt-1">
                <Button onClick={saveStoreInfo} disabled={editSaving} size="sm"><Save size={14} /> {editSaving ? "Saving..." : "Save Changes"}</Button>
                <Button onClick={cancelEdit} variant="ghost" size="sm"><X size={14} /> Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              {[
                { icon: <MapPin size={14} className="text-[#D97756]" />, label: "Location", value: store.location },
                { icon: <Phone size={14} className="text-[#D97756]" />, label: "Phone", value: store.phone || "—" },
                { icon: <User size={14} className="text-[#D97756]" />, label: "Manager", value: store.managerName || "—" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg border border-[#D97756]/20 flex items-center justify-center shrink-0" style={{ background: "rgba(217,119,86,0.08)" }}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-stone-300 mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
