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
  
  // Default to today in YYYY-MM-DD format
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  // Default to current month in YYYY-MM format
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
        if (viewMode === "daily") {
            // Pass selectedDate to getDailyStats
            const data = await getDailyStats(selectedDate);
            setDailyStats(data);
        } else {
            // Parse selectedMonth (YYYY-MM)
            const [year, month] = selectedMonth.split("-").map(Number);
            const data = await getMonthlyStats(month, year);
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
  }, [viewMode, selectedDate, selectedMonth]); // Add selectedMonth to dependencies

  return (
    <div className="flex flex-col p-6 font-sans min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">แดชบอร์ด</h1>
          <p className="text-gray-400 text-sm">วิเคราะห์ประสิทธิภาพการฝึกของคุณ</p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 self-start md:self-auto">
            {/* Date/Month Picker */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-cyan-400/70 group-hover:text-cyan-400 transition-colors" />
                </div>
                {viewMode === "daily" ? (
                    <input 
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-[#1c2333] text-white text-sm rounded-2xl pl-10 pr-4 py-2.5 border border-gray-800/50 shadow-sm focus:outline-hidden focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer hover:bg-[#232d42] h-[46px] appearance-none"
                    />
                ) : (
                    <input 
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-[#1c2333] text-white text-sm rounded-2xl pl-10 pr-4 py-2.5 border border-gray-800/50 shadow-sm focus:outline-hidden focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer hover:bg-[#232d42] h-[46px] appearance-none"
                    />
                )}
            </div>

            {/* View Switcher */}
            <div className="flex p-1 bg-[#1c2333] rounded-2xl border border-gray-800/50 shadow-sm">
                <button 
                    onClick={() => setViewMode("daily")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                        viewMode === "daily" 
                        ? "bg-cyan-500/10 text-cyan-400 shadow-inner" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <Calendar className="h-4 w-4" />
                    รายวัน
                </button>
                <button 
                    onClick={() => setViewMode("monthly")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                        viewMode === "monthly" 
                        ? "bg-cyan-500/10 text-cyan-400 shadow-inner" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <FileChartColumn className="h-4 w-4" />
                    รายเดือน
                </button>
            </div>
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

