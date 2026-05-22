"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, MapPin, Users, Store, Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";

interface StoreData {
  id: string;
  name: string;
  location: string;
  managerName: string;
  phone: string;
  staff: { id: string }[];
}

function AddStoreModal({ onClose, onSave }: { onClose: () => void; onSave: (s: StoreData) => void }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [managerName, setManagerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Store name is required";
    if (!location.trim()) e.location = "Location is required";
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, phone, managerName }),
      });
      if (!res.ok) throw new Error();
      const store = await res.json();
      onSave({ ...store, staff: [] });
    } catch {
      setErrors({ general: "Failed to create store. Try again." });
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40";
  const labelCls = "block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/[0.08]" style={{ background: "#262220" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.07]">
          <div>
            <h2 className="text-lg font-bold text-stone-100">Add New Store</h2>
            <p className="text-xs text-stone-600 mt-0.5">Fill in the store details</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/[0.06] hover:bg-white/[0.10] rounded-xl flex items-center justify-center transition-colors">
            <X size={15} className="text-stone-400" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-4">
          <div>
            <label className={labelCls}>Store Name *</label>
            <input autoFocus value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }}
              placeholder="e.g. Harajuku KL Sentral" className={inputCls} />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className={labelCls}>Location *</label>
            <input value={location} onChange={(e) => { setLocation(e.target.value); setErrors({}); }}
              placeholder="e.g. Level 2, KL Sentral" className={inputCls} />
            {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Manager</label>
              <input value={managerName} onChange={(e) => setManagerName(e.target.value)}
                placeholder="e.g. Ahmad Razif" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="03-xxxx xxxx" className={inputCls} />
            </div>
          </div>

          {errors.general && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/20 px-4 py-2.5 rounded-xl">{errors.general}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.10] text-sm font-semibold text-stone-500 hover:bg-white/[0.04] transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !name.trim() || !location.trim()}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-all"
              style={{ background: "linear-gradient(135deg, #D97756, #C86645)", boxShadow: "0 4px 16px rgba(217,119,86,0.25)" }}>
              {saving ? "Creating…" : "Create Store"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoresClient({ initialStores }: { initialStores: StoreData[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [stores, setStores] = useState<StoreData[]>(initialStores);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/stores/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStores((prev) => prev.filter((s) => s.id !== id));
      setConfirmDeleteId(null);
      toast(`${name} removed`);
      router.refresh();
    } catch {
      toast("Failed to delete store. Try again.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-[#D97756]/80 uppercase tracking-widest mb-1">Overview</p>
          <h1 className="text-2xl font-bold text-stone-100">Stores</h1>
          <p className="text-sm text-stone-600 mt-0.5">{stores.length} active location{stores.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add Store
        </Button>
      </div>

      <div className="space-y-3">
        {stores.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-white/[0.04] border border-white/[0.07] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store size={28} className="text-stone-600" />
            </div>
            <p className="text-stone-500 font-medium">No stores yet</p>
            <p className="text-stone-600 text-sm mt-1">Add your first store to get started</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-sm text-[#D97756] font-semibold hover:text-[#E8926A]">
              + Add Store
            </button>
          </div>
        ) : stores.map((store) => {
          const isDeleting = deletingId === store.id;
          const isConfirming = confirmDeleteId === store.id;

          return (
            <div
              key={store.id}
              className={`rounded-2xl border border-white/[0.07] bg-[#262220] transition-all ${isDeleting ? "opacity-0 scale-95" : "opacity-100"} ${isConfirming ? "border-red-500/30" : "hover:border-[#D97756]/30"}`}
            >
              {isConfirming ? (
                <div className="p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-stone-200">Delete <span className="text-red-400">{store.name}</span>?</p>
                    <p className="text-xs text-stone-500 mt-0.5">This will permanently remove all staff, attendance, schedule, visit, and checklist data.</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 text-xs font-semibold text-stone-400 border border-white/[0.10] rounded-lg hover:bg-white/[0.06] transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => handleDelete(store.id, store.name)} disabled={isDeleting}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50">
                      {isDeleting ? "Deleting…" : "Yes, Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-start gap-4 group">
                  <Link href={`/stores/${store.id}`} className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl border border-[#D97756]/20 flex items-center justify-center shrink-0 group-hover:border-[#D97756]/40 transition-colors" style={{ background: "rgba(217,119,86,0.08)" }}>
                      <Store size={18} className="text-[#D97756]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-200 text-sm group-hover:text-white transition-colors mb-0.5">{store.name}</p>
                      <div className="flex items-center gap-1 text-xs text-stone-600 mb-2">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{store.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-600">
                        <span className="flex items-center gap-1"><Users size={11} /> {store.staff.length} staff</span>
                        {store.managerName && <><span className="text-white/10">·</span><span>{store.managerName}</span></>}
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setConfirmDeleteId(store.id)}
                      className="p-1.5 text-stone-700 hover:text-red-400 rounded-lg hover:bg-red-950/40 transition-colors"
                      title="Delete store"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={14} className="text-stone-700 group-hover:text-[#D97756] transition-colors" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && (
        <AddStoreModal
          onClose={() => setShowAdd(false)}
          onSave={(store) => {
            setStores((prev) => [...prev, store].sort((a, b) => a.name.localeCompare(b.name)));
            setShowAdd(false);
            toast(`${store.name} added!`);
          }}
        />
      )}
    </div>
  );
}
