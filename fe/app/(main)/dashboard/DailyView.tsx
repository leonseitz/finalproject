import { DailyStats } from "@/app/services/stats";
import { Activity, Flame, Target, AlertCircle, CheckCircle, XCircle } from "lucide-react";

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
          <div className="text-xs text-gray-500">
             {Math.round(stats.total_duration_sec / 60)} นาที
          </div>
        </div>

        {/* Calories (Estimated) */}
        <div className="rounded-2xl bg-[#1c2333] p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Flame className="h-4 w-4" /> แคลอรี่
          </div>
          <div className="text-2xl font-bold text-white">{stats.calories_burned}</div>
          <div className="text-xs text-gray-500">kcal (ประมาณ)</div>
        </div>
        
        {/* Accuracy */}
        <div className="rounded-2xl bg-[#1c2333] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400 text-xs">
                <CheckCircle className="h-4 w-4" /> ความแม่นยำ
            </div>
            <div className="text-2xl font-bold text-white">
                {Math.round(stats.mistake_summary.accuracy)}%
            </div>
            <div className="text-xs text-gray-500">
                {stats.mistake_summary.correct_reps}/{stats.mistake_summary.total_reps} ครั้งที่ถูกต้อง
            </div>
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
          <div className="mt-2 text-right text-xs text-gray-500">
             ความแม่นยำรวม {Math.round(stats.mistake_summary.accuracy)}%
          </div>
        </div>

        {/* Common Mistakes */}
        <div className="rounded-3xl bg-[#1c2333] p-6">
           <h3 className="font-bold text-white mb-4 flex items-center gap-2">
             <AlertCircle className="h-5 w-5 text-orange-400" />
             ข้อผิดพลาดที่พบบ่อย
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
                               <span className="text-sm text-gray-300">{item.issue}</span>
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
