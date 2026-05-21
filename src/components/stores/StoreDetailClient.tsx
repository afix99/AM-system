"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StoreOverviewTab } from "./StoreOverviewTab";
import { StoreStaffTab } from "./StoreStaffTab";
import { StoreAttendanceTab } from "./StoreAttendanceTab";
import { StoreStockTab } from "./StoreStockTab";
import { StorePerformanceTab } from "./StorePerformanceTab";

const TABS = ["Overview", "Staff", "Attendance", "Stock", "Performance"] as const;
type Tab = (typeof TABS)[number];

export function StoreDetailClient({ store }: { store: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-4 md:px-6 pt-4 pb-0" style={{ background: "#1A1512" }}>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-300 mb-3 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="mb-4">
          <p className="text-xs font-medium text-[#D97756]/70 uppercase tracking-widest mb-0.5">Store Detail</p>
          <h1 className="text-xl font-bold text-stone-100">{store.name}</h1>
          <p className="text-sm text-stone-500 mt-0.5">{store.location}</p>
        </div>
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab
                  ? "border-[#D97756] text-[#D97756]"
                  : "border-transparent text-stone-600 hover:text-stone-300"
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
        {activeTab === "Attendance" && <StoreAttendanceTab store={store} />}
        {activeTab === "Stock" && <StoreStockTab store={store} />}
        {activeTab === "Performance" && <StorePerformanceTab store={store} />}
      </div>
    </div>
  );
}
