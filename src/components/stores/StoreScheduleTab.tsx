"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Upload, Trash2, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toaster";
import { compressImage } from "@/lib/image";

interface ScheduleData {
  id: string;
  storeId: string;
  weekStartDate: string;
  imageUrl: string;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${monday.toLocaleDateString("en-MY", opts)} – ${sunday.toLocaleDateString("en-MY", opts)} ${sunday.getFullYear()}`;
}

export function StoreScheduleTab({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [week, setWeek] = useState<Date>(getMonday(new Date()));
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/schedule?week=${week.toISOString()}`);
      const data = await res.json();
      setSchedule(data.schedule);
    } finally {
      setLoading(false);
    }
  }, [storeId, week]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const changeWeek = (delta: number) => {
    const next = new Date(week);
    next.setDate(next.getDate() + delta * 7);
    setWeek(getMonday(next));
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const dataUrl = await compressImage(file, 1400, 0.78);
      const res = await fetch(`/api/stores/${storeId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: dataUrl, week: week.toISOString() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      setSchedule(data);
      toast("Schedule uploaded");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;
    if (!confirm("Delete this week's schedule?")) return;
    try {
      const res = await fetch(`/api/schedule/${schedule.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSchedule(null);
      toast("Schedule deleted");
    } catch {
      toast("Delete failed", "error");
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Shift Schedule</CardTitle>
          <div className="flex items-center justify-between mt-3">
            <button onClick={() => changeWeek(-1)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-stone-500 hover:text-stone-300 transition-colors border border-white/[0.07]">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-200">
              <Calendar size={14} className="text-[#D97756]" />
              {formatWeekRange(week)}
            </div>
            <button onClick={() => changeWeek(1)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-stone-500 hover:text-stone-300 transition-colors border border-white/[0.07]">
              <ChevronRight size={16} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            aria-hidden
            tabIndex={-1}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none", overflow: "hidden", clip: "rect(0 0 0 0)" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
          {loading ? (
            <div className="py-12 text-center text-stone-600 text-sm flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : schedule ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02]">
                <Image
                  src={schedule.imageUrl}
                  alt="Shift schedule"
                  width={1200}
                  height={1600}
                  className="w-full h-auto object-contain"
                  unoptimized
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.10] text-sm font-semibold text-stone-300 hover:bg-white/[0.04] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Replace
                </button>
                <button
                  onClick={handleDelete}
                  className="py-2.5 px-4 rounded-xl border border-red-500/20 text-sm font-semibold text-red-400 hover:bg-red-950/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-3">
                <Calendar size={28} className="text-stone-600" />
              </div>
              <p className="text-sm text-stone-500 mb-4">No schedule for this week yet.</p>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="py-2.5 px-6 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(180deg, #F4A982 0%, #D97756 55%, #A8552F 100%)", boxShadow: "0 4px 20px -2px rgba(217,119,86,0.45), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -6px 12px -6px rgba(0,0,0,0.35)" }}
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Uploading…" : "Upload Schedule"}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
