"use client";

import { Activity, Zap, Dumbbell, Timer, History as HistoryIcon, Loader2, ArrowUpDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GroupedHistory, HistoryItem } from "./types";
import HistoryDayList from "./HistoryDayList";
import HistoryInDay from "./HistoryInDay";

export default function HistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openDate = searchParams.get("open_date");
  const [historyGroups, setHistoryGroups] = useState<GroupedHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GroupedHistory | null>(null);

  const getExerciseIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("bicep")) return { icon: Dumbbell, iconColor: "text-blue-400", iconBg: "bg-blue-400/10" };
    if (lowerName.includes("squat")) return { icon: Zap, iconColor: "text-purple-400", iconBg: "bg-purple-400/10" };
    if (lowerName.includes("push")) return { icon: ArrowUpDown, iconColor: "text-orange-400", iconBg: "bg-orange-400/10" };
    if (lowerName.includes("plank")) return { icon: Timer, iconColor: "text-amber-400", iconBg: "bg-amber-400/10" };
    if (lowerName.includes("pull")) return { icon: Activity, iconColor: "text-green-400", iconBg: "bg-green-400/10" };
    return { icon: Activity, iconColor: "text-cyan-400", iconBg: "bg-cyan-400/10" };
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}\u00A0นาที ${secs > 0 ? `${secs}\u00A0วินาที` : ""}`;
    return `${secs}\u00A0วินาที`;
  };

  useEffect(() => {
    async function fetchHistory() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Get Backend URL 
        const protocol = window.location.protocol === "https:" ? "https:" : "http:";
        let host = window.location.hostname;
        // Fix for Windows IPv6 localhost issue
        if (host === "localhost") host = "127.0.0.1";
        const port = "8000"; 
        
        const apiUrl = `${protocol}//${host}:${port}/api/exercise/history?limit=100`;
        console.log("Fetching history from:", apiUrl);

        const res = await fetch(apiUrl, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) {
           if (res.status === 401) {
             localStorage.removeItem("token");
             router.push("/login");
             return;
           }
           let errorMessage = "Failed to fetch history";
           try {
             // Try to parse logging error from backend
             const errorData = await res.json();
             if (errorData.detail) errorMessage = errorData.detail;
           } catch (e) { /* ignore json parse error */ }
           
           throw new Error(errorMessage);
        }

        const data: HistoryItem[] = await res.json();
        
        // Grouping Logic
        const grouped: { [key: string]: GroupedHistory } = {};
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = today.toDateString();
        const yesterdayStr = yesterday.toDateString();
        
        data.forEach(item => {
            const dateObj = new Date(item.started_at);
            const dateStr = dateObj.toDateString();
            
            let groupLabel = dateStr;
            if (dateStr === todayStr) groupLabel = "วันนี้";
            else if (dateStr === yesterdayStr) groupLabel = "เมื่อวานนี้";
            else {
                // Format Thai Date: "4 ก.พ. 2026"
                groupLabel = new Intl.DateTimeFormat("th-TH", { 
                    day: "numeric", month: "short", year: "numeric" 
                }).format(dateObj);
            }
            
            if (!grouped[groupLabel]) {
                grouped[groupLabel] = { date: groupLabel, items: [] };
            }
            
            const { icon, iconColor, iconBg } = getExerciseIcon(item.name);
            
            grouped[groupLabel].items.push({
                ...item,
                time: new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(dateObj),
                duration: formatDuration(item.duration_sec),
                icon,
                iconColor,
                iconBg
            });
        });

        // Convert grouped object to array
        const orderedGroups: GroupedHistory[] = [];
        let currentLabel = "";
        let currentGroup: GroupedHistory | null = null;
        
        // Re-iterate to ensure order
        const processedKeys = new Set<string>();
        
        data.forEach(item => {
            const dateObj = new Date(item.started_at);
            const dateStr = dateObj.toDateString();
            let groupLabel = dateStr;
            if (dateStr === todayStr) groupLabel = "วันนี้";
            else if (dateStr === yesterdayStr) groupLabel = "เมื่อวานนี้";
            else {
                groupLabel = new Intl.DateTimeFormat("th-TH", { 
                    day: "numeric", month: "short", year: "numeric" 
                }).format(dateObj);
            }

            if (!processedKeys.has(groupLabel)) {
                orderedGroups.push(grouped[groupLabel]);
                processedKeys.add(groupLabel);
            }
        });

        setHistoryGroups(orderedGroups);
        setLoading(false);

      } catch (err) {
        console.error(err);
        setError("ไม่สามารถโหลดข้อมูลประวัติได้");
        setLoading(false);
      }
    }

    fetchHistory();
  }, [router]);

  // Effect to handle opening group from URL param
  useEffect(() => {
    if (openDate && historyGroups.length > 0) {
        const decodedDate = decodeURIComponent(openDate);
        const targetGroup = historyGroups.find(g => g.date === decodedDate);
        if (targetGroup) {
            setSelectedGroup(targetGroup);
            // Optional: Clear params to avoid reopening on refresh? 
            // Actually better to keep it so refresh stays on page.
        }
    }
  }, [openDate, historyGroups]);

  if (loading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-[#10141d]">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          </div>
      );
  }

  // --- Detail View ---
  if (selectedGroup) {
      return <HistoryInDay group={selectedGroup} onBack={() => setSelectedGroup(null)} />;
  }

  // --- Summary View ---
  return (
    <div className="flex flex-col p-6 font-sans min-h-screen bg-[#10141d]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">ประวัติการออกกำลังกาย</h1>
        <p className="text-gray-400 text-sm">ติดตามความก้าวหน้าของคุณที่นี่</p>
      </div>
      
      {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center text-red-500">
            {error}
          </div>
      )}

      {/* History List (Summary Cards) */}
      <HistoryDayList 
        historyGroups={historyGroups} 
        onSelectGroup={setSelectedGroup} 
        getExerciseIcon={getExerciseIcon} 
        formatDuration={formatDuration} 
      />

      {/* Empty State placeholder */}
      {!loading && historyGroups.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
           <HistoryIcon className="h-16 w-16 mb-4 text-gray-600" />
           <p className="text-gray-400">ยังไม่มีประวัติการออกกำลังกาย</p>
        </div>
      )}
    </div>
  );
}
