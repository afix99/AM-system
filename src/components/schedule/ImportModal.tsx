"use client";
import { useState, useRef } from "react";
import { Upload, X, Check, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

// ─── Excel parsing utilities ────────────────────────────────────────────────

function resolveWeekDates(dayNums: any[], month: number, year: number): (Date | null)[] {
  const nums = dayNums.map((d) => {
    if (d === "" || d == null) return null;
    const n = Number(d);
    return !isNaN(n) && n >= 1 && n <= 31 ? n : null;
  });

  const nonNull = nums.filter((n): n is number => n !== null);
  let curMonth = month;
  let curYear = year;

  // If week starts with a large day AND has small days → starts in previous month
  if (nonNull.length > 1 && nonNull[0] > 20 && nonNull.some((n) => n < 10)) {
    curMonth = month === 1 ? 12 : month - 1;
    curYear = month === 1 ? year - 1 : year;
  }

  const dates: (Date | null)[] = [];
  let prevNum: number | null = null;

  for (const n of nums) {
    if (n === null) { dates.push(null); continue; }
    // Month boundary: large day followed by small day
    if (prevNum !== null && prevNum > 20 && n < 10) {
      curMonth++;
      if (curMonth > 12) { curMonth = 1; curYear++; }
    }
    dates.push(new Date(curYear, curMonth - 1, n));
    prevNum = n;
  }
  return dates;
}

function normalizeShift(raw: any): string {
  if (raw === null || raw === undefined || raw === "") return "Off";
  const s = String(raw).trim().toUpperCase();
  if (!s) return "Off";
  if (s.startsWith("OFF")) return "Off";
  // Half Noon variants — check before HM and N
  if (s === "HN" || s.startsWith("HN ") || s.startsWith("HN(") || s.includes("3:30 - 10") || s.includes("3:30-10")) return "HN";
  // Half Morning variants
  if (s === "HM" || s.startsWith("HM ") || s.startsWith("HM(") || s.includes("9:30 - 3:30") || s.includes("9:30-3:30")) return "HM";
  // Pure codes
  if (s === "M" || s.includes("9:30 AM - 6:30") || s.includes("9:30AM-6:30")) return "M";
  if (s === "N" || s.includes("1PM") || s.includes("1 PM")) return "N";
  if (s === "H" || s.includes("5PM - 10") || s.includes("5PM-10")) return "H";
  if (s === "FULL") return "M"; // full day = Morning shift
  return "Off";
}

type ShiftEntry = { staffName: string; date: string; shiftType: string };

function parseExcelRows(rows: any[][], month: number, year: number): ShiftEntry[] {
  const results: ShiftEntry[] = [];
  let currentDates: (Date | null)[] = [];

  for (const row of rows) {
    const col2 = String(row[2] ?? "").trim();
    if (!col2 || col2 === "WEEK") continue;

    const dayNums = [row[3], row[4], row[5], row[6], row[7], row[8], row[9]];
    // Date row: at least one column is a positive integer day number
    const isDateRow = dayNums.some((d) => typeof d === "number" && d >= 1 && d <= 31);

    if (isDateRow) {
      currentDates = resolveWeekDates(dayNums, month, year);
      continue;
    }

    // Staff shift row
    if (currentDates.length === 7) {
      dayNums.forEach((shift, i) => {
        if (currentDates[i]) {
          results.push({
            staffName: col2,
            date: currentDates[i]!.toISOString().slice(0, 10),
            shiftType: normalizeShift(shift),
          });
        }
      });
    }
  }
  return results;
}

function matchStaff(
  importName: string,
  staff: { id: string; name: string }[]
): { id: string; name: string } | null {
  const norm = (s: string) => s.toLowerCase().trim();
  const exact = staff.find((s) => norm(s.name) === norm(importName));
  if (exact) return exact;

  const importWords = norm(importName).split(/\s+/).filter((w) => w.length > 2);
  for (const s of staff) {
    const staffWords = norm(s.name).split(/\s+/).filter((w) => w.length > 2);
    if (importWords.some((iw) => staffWords.some((sw) => sw === iw || sw.startsWith(iw) || iw.startsWith(sw)))) {
      return s;
    }
  }
  return null;
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Component ───────────────────────────────────────────────────────────────

type StaffMatch = { importName: string; matched: { id: string; name: string } | null };

interface Props {
  stores: { id: string; name: string; staff: { id: string; name: string }[] }[];
  onClose: () => void;
  onSuccess: () => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ImportModal({ stores, onClose, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [staffMatches, setStaffMatches] = useState<StaffMatch[]>([]);
  const [error, setError] = useState("");
  const [importedCount, setImportedCount] = useState(0);

  const selectedStore = stores.find((s) => s.id === storeId);

  const handlePreview = async () => {
    if (!file || !storeId) { setError("Please select a file and store."); return; }
    setError("");
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
      const parsed = parseExcelRows(rows, month, year);

      if (parsed.length === 0) {
        setError("No schedule data found. Make sure month/year match the file.");
        return;
      }

      const storeStaff = selectedStore?.staff ?? [];
      const uniqueNames = [...new Set(parsed.map((s) => s.staffName))];
      const matches: StaffMatch[] = uniqueNames.map((name) => ({
        importName: name,
        matched: matchStaff(name, storeStaff),
      }));

      setShifts(parsed);
      setStaffMatches(matches);
      setStep("preview");
    } catch {
      setError("Failed to read file. Make sure it is a valid .xlsx file.");
    }
  };

  const handleImport = async () => {
    setStep("importing");
    try {
      const res = await fetch("/api/import/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, shifts }),
      });
      const data = await res.json();
      setImportedCount(data.imported ?? 0);
      setStep("done");
      onSuccess();
    } catch {
      setError("Import failed. Please try again.");
      setStep("preview");
    }
  };

  const sortedDates = shifts.map((s) => s.date).sort();
  const dateRange =
    sortedDates.length
      ? `${fmtDate(sortedDates[0])} – ${fmtDate(sortedDates[sortedDates.length - 1])}`
      : "";
  const workingShifts = shifts.filter((s) => s.shiftType !== "Off").length;

  const shiftBadge = (type: string) => {
    const map: Record<string, string> = {
      M:   "bg-sky-100 text-sky-800",
      N:   "bg-indigo-100 text-indigo-800",
      H:   "bg-amber-100 text-amber-800",
      HM:  "bg-cyan-100 text-cyan-800",
      HN:  "bg-violet-100 text-violet-800",
      Off: "bg-slate-100 text-slate-400",
    };
    return map[type] ?? "bg-slate-100 text-slate-500";
  };

  // Preview: group shifts by staff for compact display
  const staffSummary = staffMatches.map((m) => {
    const entries = shifts.filter((s) => s.staffName === m.importName);
    const counts: Record<string, number> = {};
    for (const e of entries) counts[e.shiftType] = (counts[e.shiftType] ?? 0) + 1;
    return { ...m, counts, total: entries.length };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            {step === "upload" && "Import Schedule"}
            {step === "preview" && "Preview Import"}
            {step === "importing" && "Importing…"}
            {step === "done" && "Import Complete"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
            <X size={17} />
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Store</label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 bg-white"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Schedule Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 bg-white"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 bg-white"
                  >
                    {[year - 1, year, year + 1].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Excel File (.xlsx)</label>
                <button
                  onClick={() => fileRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    file
                      ? "border-indigo-300 bg-indigo-50/60"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  {file ? (
                    <>
                      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Check size={18} className="text-indigo-600" />
                      </div>
                      <p className="text-sm font-medium text-indigo-700">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · tap to change</p>
                    </>
                  ) : (
                    <>
                      <Upload size={22} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-500">Tap to select file</p>
                      <p className="text-xs text-slate-400 mt-0.5">.xlsx or .xls</p>
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-xl">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <Button onClick={handlePreview} disabled={!file} className="w-full">
                Preview <ArrowRight size={15} />
              </Button>
            </div>
          )}

          {/* ── Step 2: Preview ── */}
          {step === "preview" && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs text-slate-400 mb-0.5">Date range</p>
                <p className="text-sm font-semibold text-slate-900">{dateRange}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                  <span>{staffMatches.length} staff detected</span>
                  <span className="text-slate-300">·</span>
                  <span>{workingShifts} working shifts</span>
                  <span className="text-slate-300">·</span>
                  <span>{shifts.length - workingShifts} off days</span>
                </div>
              </div>

              {/* Staff list */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Staff</p>
                <div className="space-y-2">
                  {staffSummary.map((m) => (
                    <div key={m.importName} className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-slate-800">{m.importName}</span>
                        {m.matched ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Check size={11} strokeWidth={3} /> {m.matched.name}
                          </span>
                        ) : (
                          <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                            + New staff
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(m.counts)
                          .filter(([, v]) => v > 0)
                          .map(([type, count]) => (
                            <span key={type} className={`text-xs px-2 py-0.5 rounded-full font-medium ${shiftBadge(type)}`}>
                              {type} ×{count}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-xl">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep("upload")} className="flex-none">
                  <ArrowLeft size={14} />
                </Button>
                <Button onClick={handleImport} className="flex-1">
                  Import {shifts.length} entries
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Importing ── */}
          {step === "importing" && (
            <div className="py-10 text-center">
              <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-700">Saving schedule…</p>
              <p className="text-xs text-slate-400 mt-1">This may take a moment</p>
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {step === "done" && (
            <div className="py-10 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check size={26} className="text-emerald-600" strokeWidth={2.5} />
              </div>
              <p className="text-base font-bold text-slate-900">Import complete!</p>
              <p className="text-sm text-slate-500 mt-1">{importedCount} schedule entries saved</p>
              <Button onClick={onClose} className="mt-6 w-full">Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
