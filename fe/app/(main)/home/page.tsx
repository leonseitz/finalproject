"use client";

import { Bell, Flame, ChevronRight, Plus, Dumbbell, Activity, Footprints, Timer, Zap, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserProfile } from "../../services/user";
import { getDailyStats, DailyStats } from "../../services/stats";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUserProfile();
      if (userData) {
        setUser(userData);
      }
    };
    fetchUser();

    const fetchStats = async () => {
      try {
        const stats = await getDailyStats();
        setDailyStats(stats);
      } catch (error) {
        console.error("Failed to fetch daily stats:", error);
      }
    };
    fetchStats();
  }, []);

  const exercises = [
    {
      id: 1,
      name: "Bicep Curls",
      title_th: "Bicep Curls",
      reps: "15 ครั้ง",
      duration: "10 นาที",
      color: "bg-blue-500",
      icon: Dumbbell,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-400/10",
    },
    {
      id: 2,
      name: "Squats",
      title_th: "Squats",
      reps: "25 ครั้ง",
      duration: "12 นาที",
      color: "bg-purple-500",
      icon: Zap,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-400/10",
    },
    {
      id: 3,
      name: "Push-ups",
      title_th: "Push-ups",
      reps: "30 ครั้ง",
      duration: "15 นาที",
      color: "bg-orange-500",
      icon: ArrowUpDown,
      iconColor: "text-orange-400",
      iconBg: "bg-orange-400/10",
    },
    {
      id: 4,
      name: "Pull-ups",
      title_th: "Pull-ups",
      reps: "10 ครั้ง",
      duration: "12 นาที",
      color: "bg-green-500",
      icon: Activity,
      iconColor: "text-green-400",
      iconBg: "bg-green-400/10",
    },
    {
      id: 5,
      name: "Plank",
      title_th: "Plank",
      reps: "2 นาที",
      duration: "10 นาที",
      color: "bg-amber-500",
      icon: Timer,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-400/10",
    },
  ];

  return (
    <div className="flex flex-col p-6 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            สวัสดี, {user?.personal_detail?.fname || user?.username}!
          </h1>
          <p className="text-gray-400 text-sm">พร้อมออกกำลังกายวันนี้แล้วหรือยัง?</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f293a] text-gray-400 hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <div className="h-10 w-10 overflow-hidden rounded-xl border border-gray-700 bg-gray-600">
             {/* Placeholder for User Avatar */}
             <div className="h-full w-full flex items-center justify-center bg-gray-700 text-xs text-white">
               {user?.username ? user.username[0].toUpperCase() : "U"}
             </div>
          </div>
        </div>
      </div>

      {/* Daily Stats Card */}
      {/* Daily Stats Card */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-linear-to-r from-cyan-500 to-blue-600 p-6 shadow-[0_10px_30px_rgba(6,182,212,0.3)]">
        <div className="relative z-10 text-white">
          <p className="mb-2 text-sm font-medium opacity-90">สถิติวันนี้</p>
          <h2 className="mb-2 text-4xl font-bold">
            {dailyStats ? Math.floor(dailyStats.total_duration_sec / 60) : 0} นาที
          </h2>
          <p className="text-sm font-medium opacity-80">
            {dailyStats ? dailyStats.total_exercises : 0} ท่า • {dailyStats ? dailyStats.mistake_summary.total_reps : 0} ครั้ง • {dailyStats ? dailyStats.calories_burned : 0} แคลอรี่
          </p>
        </div>
        {/* Flame Icon Background */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-4 backdrop-blur-sm">
           <Flame className="h-8 w-8 text-white fill-white" />
        </div>
      </div>

      {/* Exercises Section */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">ท่าออกกำลังกาย</h3>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 pb-8">
        {exercises.map((exercise) => {
          const stat = dailyStats?.exercise_stats?.find(s => s.type_id === exercise.id);
          const reps = stat ? stat.reps : 0;
          const duration = stat ? Math.floor(stat.duration_sec / 60) : 0;
          
          return (
          <Link
            key={exercise.id}
            href={`/exercise/${exercise.id}/prepare`}
            className="group relative flex flex-col justify-between rounded-3xl bg-[#1c2333] p-5 transition-all hover:bg-[#232d42]"
          >
            <div className="flex justify-between items-start mb-4">
               <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${exercise.iconBg}`}>
                  <exercise.icon className={`h-6 w-6 ${exercise.iconColor}`} />
               </div>
               {/* Shine effect on hover */}
               <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-white/5 blur-2xl transition-all group-hover:bg-white/10" />
            </div>
            
            <div>
              <h4 className="font-bold text-white text-lg">{exercise.title_th}</h4>
              <p className="text-sm text-gray-400 mt-1">วันนี้: {reps} ครั้ง</p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className={`rounded-lg px-3 py-1 text-xs font-medium ${exercise.iconBg} ${exercise.iconColor} bg-opacity-20`}>
                {duration} นาที
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a3449] text-gray-400 transition-colors group-hover:bg-cyan-500 group-hover:text-white">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
          );
        })}

        {/* Add New Card
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#2a3449] bg-transparent p-5 transition-all hover:border-cyan-500/50 hover:bg-[#1f293a] cursor-pointer group">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2a3449] transition-colors group-hover:bg-cyan-500">
            <Plus className="h-6 w-6 text-gray-400 group-hover:text-white" />
          </div>
          <span className="font-medium text-gray-400 group-hover:text-cyan-400">เพิ่มท่าใหม่</span>
        </div> */}
      </div>
    </div>
  );
}
