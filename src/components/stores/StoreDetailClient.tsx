"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StoreOverviewTab } from "./StoreOverviewTab";
import { StoreStaffTab } from "./StoreStaffTab";
import { StoreScheduleTab } from "./StoreScheduleTab";
import { StoreAttendanceTab } from "./StoreAttendanceTab";
import { StoreStockTab } from "./StoreStockTab";
import { StorePerformanceTab } from "./StorePerformanceTab";

const TABS = ["Overview", "Staff", "Schedule", "Attendance", "Stock", "Performance"] as const;
type Tab = (typeof TABS)[number];

export function StoreDetailClient({ store }: { store: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 pt-4 pb-0">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900">{store.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{store.location}</p>
        </div>
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 md:p-6">
        {activeTab === "Overview" && <StoreOverviewTab store={store} />}
        {activeTab === "Staff" && <StoreStaffTab store={store} />}
        {activeTab === "Schedule" && <StoreScheduleTab store={store} />}
        {activeTab === "Attendance" && <StoreAttendanceTab store={store} />}
        {activeTab === "Stock" && <StoreStockTab store={store} />}
        {activeTab === "Performance" && <StorePerformanceTab store={store} />}
      </div>
    </div>
  );
}
