import { DailyStats } from "@/app/services/stats";
import { Activity, Flame, Target, AlertCircle, CheckCircle, XCircle, Trophy, Dumbbell } from "lucide-react";

interface DailyViewProps {
  stats: DailyStats;
}

export default function DailyView({ stats }: DailyViewProps) {
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const scoreColor = stats.comparison.score_vs_avg >= 0 ? "text-green-400" : "text-red-400";
  const scoreSign = stats.comparison.score_vs_avg >= 0 ? "+" : "";

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-white">
              {new Date(stats.date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Score */}
        <div className="rounded-2xl bg-[#1c2333] p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Target className="h-4 w-4" /> คะแนนรวม
          </div>
          <div className="text-2xl font-bold text-white">{stats.total_score}</div>
          <div className={`text-xs ${scoreColor}`}>
            {scoreSign}{Math.round(stats.comparison.score_vs_avg)} จากค่าเฉลี่ย
          </div>
        </div>

        {/* Duration */}
        <div className="rounded-2xl bg-[#1c2333] p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Activity className="h-4 w-4" /> เวลาที่ใช้
          </div>
          <div className="text-2xl font-bold text-white">{formatDuration(stats.total_duration_sec)}</div>
          <div className={`text-xs ${stats.comparison.time_vs_avg >= 0 ? "text-green-400" : "text-red-400"}`}>
             {stats.comparison.time_vs_avg >= 0 ? "+" : "-"}{formatDuration(Math.abs(stats.comparison.time_vs_avg))} จากค่าเฉลี่ย
          </div>
        </div>

        {/* Calories (Estimated) */}
        <div className="rounded-2xl bg-[#1c2333] p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Flame className="h-4 w-4" /> แคลอรี่
          </div>
          <div className="text-2xl font-bold text-white">{stats.calories_burned}</div>
          <div className={`text-xs ${stats.comparison.calories_vs_avg >= 0 ? "text-green-400" : "text-red-400"}`}>
             {stats.comparison.calories_vs_avg >= 0 ? "+" : ""}{Math.round(stats.comparison.calories_vs_avg)} จากค่าเฉลี่ย
          </div>
        </div>
        
        {/* Total Reps */}
        <div className="rounded-2xl bg-[#1c2333] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Dumbbell className="h-4 w-4" /> จำนวนครั้งรวม
            </div>
            <div className="text-2xl font-bold text-white">
                {stats.mistake_summary.total_reps}
            </div>
            <div className={`text-xs ${stats.comparison.reps_vs_avg >= 0 ? "text-green-400" : "text-red-400"}`}>
                {stats.comparison.reps_vs_avg >= 0 ? "+" : ""}{Math.round(stats.comparison.reps_vs_avg)} จากค่าเฉลี่ย
            </div>
        </div>
      </div>

      {/* Best Session Card */}
      <div className="rounded-3xl bg-linear-to-br from-teal-600 to-emerald-700 p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
               <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                      สถิติที่ดีที่สุดของวันนี้
                  </span>
              </div>
              
              {stats.best_session ? (
                  <>
                    <h3 className="text-xl font-bold mb-1">{stats.best_session.exercise}</h3>
                    <p className="text-sm opacity-90">
                        คะแนนสูงสุด {stats.best_session.score.toLocaleString()} คะแนน 
                        ({stats.best_session.reps} ครั้ง)
                    </p>
                    <div className="mt-3 inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-md">
                        {Math.floor(stats.best_session.duration_sec / 60)}m {stats.best_session.duration_sec % 60}s
                    </div>
                  </>
              ) : (
                  <>
                     <h3 className="text-xl font-bold mb-1">ยังไม่มีสถิติวันนี้</h3>
                     <p className="text-sm opacity-90">
                        เริ่มออกกำลังกายเพื่อสร้างสถิติใหม่ของวัน!
                     </p>
                  </>
              )}
          </div>
          
          {/* Background Decoration */}
           <div className="absolute top-[-20px] right-[-20px] h-32 w-32 rounded-full bg-white/10 blur-3xl" />
           <div className="absolute bottom-[-10px] right-2 transform rotate-12 opacity-20">
             <Trophy className="h-24 w-24" />
           </div>
      </div>

      {/* Mistake Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Correct vs Incorrect Visual */}
        <div className="rounded-3xl bg-[#1c2333] p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            สรุปความถูกต้อง
          </h3>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex flex-col items-center flex-1 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <span className="text-green-400 font-bold text-xl">{stats.mistake_summary.correct_reps}</span>
                <span className="text-xs text-gray-400">ถูกต้อง</span>
            </div>
            <div className="flex flex-col items-center flex-1 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="text-red-400 font-bold text-xl">{stats.mistake_summary.incorrect_reps}</span>
                <span className="text-xs text-gray-400">มีข้อผิดพลาด</span>
            </div>
          </div>

          <div className="relative h-4 w-full rounded-full bg-gray-700 overflow-hidden">
             <div 
                className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
                style={{ width: `${stats.mistake_summary.accuracy}%` }}
             />
          </div>
          <div className="mt-2 text-right text-sm text-gray-200">
             ความแม่นยำรวม {Math.round(stats.mistake_summary.accuracy)}%
          </div>
        </div>

        {/* Common Mistakes */}
        <div className="rounded-3xl bg-[#1c2333] p-6">
           <h3 className="font-bold text-white mb-4 flex items-center gap-2">
             <AlertCircle className="h-5 w-5 text-orange-400" />
             ข้อผิดพลาดที่พบ
           </h3>
           
           {stats.common_mistakes.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                   <p>ไม่มีข้อผิดพลาดที่พบ! 🎉</p>
               </div>
           ) : (
               <div className="space-y-3">
                   {stats.common_mistakes.map((item, idx) => (
                       <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#2a3449]">
                           <div className="flex items-center gap-3">
                               <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">
                                   {idx + 1}
                               </div>
                               <span className="text-sm text-white">
                                   {item.issue} <span className="text-gray-400">({item.exercise_name})</span>
                               </span>
                           </div>
                           <span className="text-xs font-bold text-white bg-black/20 px-2 py-1 rounded-md">
                               {item.count} ครั้ง
                           </span>
                       </div>
                   ))}
               </div>
           )}
        </div>
      </div>
    </div>
  );
}
