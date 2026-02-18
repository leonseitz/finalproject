"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, FileChartColumn } from "lucide-react";
import { getDailyStats, getMonthlyStats, DailyStats, MonthlyStats } from "@/app/services/stats";
import DailyView from "./DailyView";
import MonthlyView from "./MonthlyView";

export default function DashboardPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
        if (viewMode === "daily") {
            const data = await getDailyStats();
            setDailyStats(data);
        } else {
            const data = await getMonthlyStats();
            setMonthlyStats(data);
        }
    } catch (err: any) {
        if (err.message.includes("401")) {
             router.push("/login");
             return;
        }
        console.error("Dashboard fetch error:", err);
        setError("ไม่สามารถโหลดข้อมูลสถิติได้");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  return (
    <div className="flex flex-col p-6 font-sans min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">แดชบอร์ด</h1>
          <p className="text-gray-400 text-sm">วิเคราะห์ประสิทธิภาพการฝึกของคุณ</p>
        </div>
        
        {/* View Switcher */}
        <div className="flex p-1 bg-[#1c2333] rounded-xl self-start md:self-auto">
            <button 
                onClick={() => setViewMode("daily")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === "daily" 
                    ? "bg-cyan-500/10 text-cyan-400" 
                    : "text-gray-400 hover:text-white"
                }`}
            >
                <Calendar className="h-4 w-4" />
                รายวัน
            </button>
            <button 
                onClick={() => setViewMode("monthly")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === "monthly" 
                    ? "bg-cyan-500/10 text-cyan-400" 
                    : "text-gray-400 hover:text-white"
                }`}
            >
                <FileChartColumn className="h-4 w-4" />
                รายเดือน
            </button>
        </div>
      </div>

      {loading ? (
          <div className="flex h-64 w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
      ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 text-red-500 text-center">
              {error}
          </div>
      ) : (
          <>
            {viewMode === "daily" && dailyStats && <DailyView stats={dailyStats} />}
            {viewMode === "monthly" && monthlyStats && <MonthlyView stats={monthlyStats} />}
          </>
      )}
    </div>
  );
}

