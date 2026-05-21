"use client";
import { useState } from "react";
import { Plus, Minus, Pencil, Trash2, RefreshCw, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { formatCurrency } from "@/lib/utils";

function StockForm({ storeId, initial, onSave, onCancel }: any) {
  const [productName, setProductName] = useState(initial?.productName || "");
  const [category, setCategory] = useState(initial?.category || "Bomber Jacket");
  const [size, setSize] = useState(initial?.size || "M");
  const [color, setColor] = useState(initial?.color || "Black");
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() || "0");
  const [minStockLevel, setMinStockLevel] = useState(initial?.minStockLevel?.toString() || "5");
  const [sellingPrice, setSellingPrice] = useState(initial?.sellingPrice?.toString() || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!productName.trim()) { setError("Product name is required"); return; }
    setSaving(true);
    try {
      const url = initial ? `/api/stock/${initial.id}` : `/api/stores/${storeId}/stock`;
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, category, size, color, quantity: parseInt(quantity), minStockLevel: parseInt(minStockLevel), sellingPrice: parseFloat(sellingPrice) || 0 }),
      });
      onSave(await res.json());
    } finally { setSaving(false); }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Product Name *</label>
          <input value={productName} onChange={(e) => { setProductName(e.target.value); setError(""); }}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white" placeholder="e.g. Sakura Bomber Jacket" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
            {["Bomber Jacket","Track Top","Varsity Jacket","Oversized Tee","Windbreaker"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Size</label>
          <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
            {["XS","S","M","L","XL","XXL"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Color</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white" placeholder="Black" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Price (RM)</label>
          <input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white" placeholder="0" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white" min="0" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Min Stock Level</label>
          <input type="number" value={minStockLevel} onChange={(e) => setMinStockLevel(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white" min="0" />
        </div>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : initial ? "Save" : "Add Item"}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function StoreStockTab({ store }: { store: any }) {
  const { toast } = useToast();
  const [items, setItems] = useState(store.stockItems || []);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = items.filter((i: any) =>
    i.productName.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const updateQty = async (id: string, delta: number) => {
    const item = items.find((i: any) => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    const res = await fetch(`/api/stock/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    });
    const updated = await res.json();
    setItems((prev: any[]) => prev.map((i) => i.id === id ? updated : i));
  };

  const restock = async (id: string) => {
    const qty = prompt("Enter restock quantity:");
    if (!qty || isNaN(parseInt(qty))) return;
    const item = items.find((i: any) => i.id === id);
    const newQty = item.quantity + parseInt(qty);
    const res = await fetch(`/api/stock/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty, lastRestocked: new Date().toISOString() }),
    });
    const updated = await res.json();
    setItems((prev: any[]) => prev.map((i) => i.id === id ? updated : i));
    toast(`Restocked +${qty} units`);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this stock item?")) return;
    await fetch(`/api/stock/${id}`, { method: "DELETE" });
    setItems((prev: any[]) => prev.filter((i) => i.id !== id));
    toast("Item deleted");
  };

  const lowStockCount = items.filter((i: any) => i.quantity <= i.minStockLevel).length;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" />
        </div>
        <Button size="sm" onClick={() => { setShowAdd(true); setEditId(null); }}><Plus size={14} /> Add Item</Button>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2 text-sm text-red-700 font-medium">
          ⚠ {lowStockCount} item{lowStockCount > 1 ? "s" : ""} below minimum stock level
        </div>
      )}

      {showAdd && (
        <StockForm storeId={store.id}
          onSave={(item: any) => { setItems((prev: any[]) => [...prev, item]); setShowAdd(false); toast("Item added"); }}
          onCancel={() => setShowAdd(false)} />
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Product", "Category", "Size", "Color", "Price", "Qty", "Min", ""].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 font-medium text-slate-500 text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-400">No items found.</td></tr>
                ) : filtered.map((item: any) => {
                  const isLow = item.quantity <= item.minStockLevel;
                  if (editId === item.id) return (
                    <tr key={item.id}><td colSpan={8} className="p-3">
                      <StockForm storeId={store.id} initial={item}
                        onSave={(updated: any) => { setItems((prev: any[]) => prev.map((i) => i.id === updated.id ? updated : i)); setEditId(null); toast("Item updated"); }}
                        onCancel={() => setEditId(null)} />
                    </td></tr>
                  );
                  return (
                    <tr key={item.id} className={isLow ? "bg-red-50" : "hover:bg-slate-50"}>
                      <td className="px-3 py-2.5 font-medium text-slate-900">{item.productName}</td>
                      <td className="px-3 py-2.5 text-slate-600">{item.category}</td>
                      <td className="px-3 py-2.5 text-slate-600">{item.size}</td>
                      <td className="px-3 py-2.5 text-slate-600">{item.color}</td>
                      <td className="px-3 py-2.5 text-slate-600">{formatCurrency(item.sellingPrice)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600">
                            <Minus size={10} />
                          </button>
                          <span className={`w-8 text-center font-medium text-sm ${isLow ? "text-red-700" : "text-slate-900"}`}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600">
                            <Plus size={10} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{item.minStockLevel}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => restock(item.id)} title="Restock" className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"><RefreshCw size={13} /></button>
                          <button onClick={() => setEditId(item.id)} className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"><Pencil size={13} /></button>
                          <button onClick={() => deleteItem(item.id)} className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"><Trash2 size={13} /></button>
                        </div>
                      </td>
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
