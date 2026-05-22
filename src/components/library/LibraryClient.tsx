"use client";
import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  Plus,
  Search,
  X,
  ChevronLeft,
  Trash2,
  Paperclip,
  GraduationCap,
  Pencil,
  Save,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";

interface Entry {
  id: string;
  category: string;
  title: string;
  content: string;
  attachmentUrls: string;
  isTraining: boolean;
  createdAt: string;
  updatedAt: string;
}

function parseAttachments(s: string): string[] {
  try { return JSON.parse(s); } catch { return []; }
}

function attachmentName(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1]?.split("?")[0] ?? "file";
}

function EntryForm({
  initial,
  onClose,
  onSave,
}: {
  initial?: Entry;
  onClose: () => void;
  onSave: (e: Entry) => void;
}) {
  const { toast } = useToast();
  const [category, setCategory] = useState(initial?.category ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [isTraining, setIsTraining] = useState(initial?.isTraining ?? false);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!category.trim() || !title.trim()) {
      toast("Category and title are required", "error");
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append("category", category);
      form.append("title", title);
      form.append("content", content);
      form.append("isTraining", String(isTraining));
      files.forEach((f) => form.append("attachments", f));
      const url = initial ? `/api/library/${initial.id}` : "/api/library";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: form });
      if (!res.ok) throw new Error();
      const entry = await res.json();
      onSave(entry);
    } catch {
      toast("Save failed", "error");
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40";
  const labelCls = "block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/[0.08] my-0 sm:my-4 flex flex-col max-h-[100dvh] sm:max-h-[90dvh]" style={{ background: "#262220" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.07] shrink-0">
          <h2 className="text-lg font-bold text-stone-100">{initial ? "Edit entry" : "New entry"}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-white/[0.06] hover:bg-white/[0.10] rounded-xl flex items-center justify-center transition-colors">
            <X size={15} className="text-stone-400" />
          </button>
        </div>
        <div className="px-6 pt-4 pb-4 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Category *</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Cash handling" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <button
                onClick={() => setIsTraining(!isTraining)}
                className={`w-full py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  isTraining
                    ? "bg-[#D97756]/15 border-[#D97756]/30 text-[#D97756]"
                    : "border-white/[0.08] text-stone-500 hover:bg-white/[0.04]"
                }`}
              >
                <GraduationCap size={13} /> {isTraining ? "Training" : "Reference"}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Title *</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Counting the till at closing" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Content (Markdown)</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10}
              placeholder={"# Steps\n\n1. Step one\n2. Step two\n\n**Important:** notes…"}
              className={`${inputCls} resize-none font-mono text-xs`} />
            <p className="text-xs text-stone-700 mt-1">Markdown supported: # heading, **bold**, lists, links</p>
          </div>
          <div>
            <label className={labelCls}>Attachments ({files.length})</label>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => {
              const newFiles = Array.from(e.target.files ?? []);
              setFiles((prev) => [...prev, ...newFiles]);
              e.target.value = "";
            }} />
            <button onClick={() => fileRef.current?.click()}
              className="w-full py-2.5 rounded-xl border border-white/[0.10] border-dashed text-sm text-stone-500 hover:text-stone-300 hover:bg-white/[0.04] transition-colors flex items-center justify-center gap-2">
              <Paperclip size={14} /> Add files (PDF, images, etc.)
            </button>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {files.map((f, i) => (
                  <div key={i} className="text-xs text-stone-500 bg-white/[0.04] px-2 py-1 rounded border border-white/[0.07] flex items-center gap-1.5">
                    {f.name.length > 20 ? `${f.name.slice(0, 17)}…` : f.name}
                    <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-stone-600 hover:text-red-400">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div
          className="flex gap-2 px-6 pt-3 border-t border-white/[0.07] shrink-0"
          style={{ background: "#262220", paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.10] text-sm font-semibold text-stone-500 hover:bg-white/[0.04] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #D97756, #C86645)", boxShadow: "0 4px 16px rgba(217,119,86,0.25)" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LibraryClient({ initialEntries }: { initialEntries: Entry[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);

  const categories = useMemo(() => {
    const set = new Set(entries.map((e) => e.category));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let list = entries;
    if (activeCategory) list = list.filter((e) => e.category === activeCategory);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(s) || e.content.toLowerCase().includes(s) || e.category.toLowerCase().includes(s));
    }
    return list;
  }, [entries, search, activeCategory]);

  const selected = entries.find((e) => e.id === selectedId);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      const res = await fetch(`/api/library/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setSelectedId(null);
      toast("Deleted");
      router.refresh();
    } catch {
      toast("Delete failed", "error");
    }
  };

  // Detail view
  if (selected) {
    const attachments = parseAttachments(selected.attachmentUrls);
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto w-full">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-300 mb-4 transition-colors">
          <ChevronLeft size={16} /> Back to library
        </button>
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#D97756] uppercase tracking-wider">{selected.category}</span>
              {selected.isTraining && (
                <span className="inline-flex items-center gap-1 text-xs text-[#D97756] bg-[#D97756]/10 border border-[#D97756]/20 rounded-full px-2 py-0.5">
                  <GraduationCap size={10} /> Training
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-stone-100">{selected.title}</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing(selected)} className="p-2 text-stone-500 hover:text-stone-300 border border-white/[0.07] rounded-lg hover:bg-white/[0.04] transition-colors">
              <Pencil size={14} />
            </button>
            <button onClick={() => handleDelete(selected.id)} className="p-2 text-stone-500 hover:text-red-400 border border-white/[0.07] rounded-lg hover:bg-red-950/40 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <Card className="mt-5">
          <CardContent className="p-5">
            <div className="prose prose-invert prose-sm max-w-none text-stone-200">
              {selected.content ? (
                <ReactMarkdown>{selected.content}</ReactMarkdown>
              ) : (
                <p className="text-stone-600 italic">No content. Edit to add some.</p>
              )}
            </div>
            {attachments.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Attachments</p>
                <div className="space-y-1.5">
                  {attachments.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-sm text-stone-300 hover:text-[#D97756] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg px-3 py-2 transition-colors">
                      <Paperclip size={13} />
                      <span className="truncate">{attachmentName(url)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {editing && (
          <EntryForm
            initial={editing}
            onClose={() => setEditing(null)}
            onSave={(updated) => {
              setEntries((prev) => prev.map((e) => e.id === updated.id ? updated : e));
              setEditing(null);
              toast("Updated");
            }}
          />
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-medium text-[#D97756]/80 uppercase tracking-widest mb-1">Knowledge</p>
          <h1 className="text-2xl font-bold text-stone-100">Library</h1>
          <p className="text-sm text-stone-600 mt-0.5">SOPs, procedures, training materials</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={15} /> New Entry
        </Button>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search entries…"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40"
        />
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              activeCategory === null
                ? "bg-[#D97756] border-[#D97756] text-white"
                : "border-white/[0.10] text-stone-500 hover:text-stone-300 hover:bg-white/[0.04]"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(activeCategory === c ? null : c)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === c
                  ? "bg-[#D97756] border-[#D97756] text-white"
                  : "border-white/[0.10] text-stone-500 hover:text-stone-300 hover:bg-white/[0.04]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-3">
              <BookOpen size={28} className="text-stone-600" />
            </div>
            {entries.length === 0 ? (
              <>
                <p className="text-stone-500 font-medium">Library is empty</p>
                <p className="text-stone-600 text-sm mt-1">Add SOPs, procedures, and training materials</p>
                <button onClick={() => setCreating(true)} className="mt-3 text-sm text-[#D97756] font-semibold hover:text-[#E8926A]">
                  + New entry
                </button>
              </>
            ) : (
              <p className="text-sm text-stone-500">No entries match your search.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setSelectedId(entry.id)}
              className="w-full text-left rounded-2xl border border-white/[0.07] bg-[#262220] hover:border-[#D97756]/30 hover:bg-[#2E2420] transition-all p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl border border-[#D97756]/20 flex items-center justify-center shrink-0" style={{ background: "rgba(217,119,86,0.08)" }}>
                  {entry.isTraining ? <GraduationCap size={16} className="text-[#D97756]" /> : <BookOpen size={16} className="text-[#D97756]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-[#D97756]/80 uppercase tracking-wider">{entry.category}</span>
                    {entry.isTraining && (
                      <span className="text-[10px] text-[#D97756] bg-[#D97756]/10 border border-[#D97756]/20 rounded-full px-1.5 py-0.5">Training</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-stone-200 truncate">{entry.title}</p>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2">{entry.content || "—"}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {creating && (
        <EntryForm
          onClose={() => setCreating(false)}
          onSave={(entry) => {
            setEntries((prev) => [...prev, entry].sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title)));
            setCreating(false);
            toast("Entry created");
          }}
        />
      )}
    </div>
  );
}
