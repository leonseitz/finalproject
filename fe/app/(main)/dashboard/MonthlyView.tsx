import { MonthlyStats } from "@/app/services/stats";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Activity, Flame, Dumbbell, Trophy } from "lucide-react";

interface MonthlyViewProps {
  stats: MonthlyStats;
}

const EXERCISE_COLORS: Record<string, string> = {
  // Singular / API Format
  "bicep curl": "#60a5fa",
  squat: "#c084fc",
  "push up": "#fb923c",
  "pull up": "#4ade80",
  plank: "#fbbf24",

  // Plural / Frontend Format (just in case)
  "bicep curls": "#60a5fa",
  squats: "#c084fc",
  "push-ups": "#fb923c",
  "pull-ups": "#4ade80",
};

export default function MonthlyView({ stats }: MonthlyViewProps) {
  // Safe check for empty data
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Month Header */}
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-bold text-white">
          {new Date(stats.year, stats.month - 1).toLocaleDateString("th-TH", {
            month: "long",
            year: "numeric",
          })}
        </h2>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-linear-to-br from-indigo-900 to-[#1c2333] p-4 border border-indigo-500/20">
          <div className="text-indigo-300 text-xs mb-1">คะแนนรวมทั้งเดือน</div>
          <div className="text-2xl font-bold text-white">
            {stats.total_score.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl bg-linear-to-br from-cyan-900 to-[#1c2333] p-4 border border-cyan-500/20">
          <div className="text-cyan-300 text-xs mb-1">เวลารวม (นาที)</div>
          <div className="text-2xl font-bold text-white">
            {Math.round(stats.total_duration / 60)}
          </div>
        </div>
        <div className="rounded-2xl bg-linear-to-br from-orange-900 to-[#1c2333] p-4 border border-orange-500/20">
          <div className="text-orange-300 text-xs mb-1">แคลอรี่ (Kcal)</div>
          <div className="text-2xl font-bold text-white">
            {stats.calories_burned.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trend (Line/Area Chart) */}
        <div className="lg:col-span-2 rounded-3xl bg-[#1c2333] p-6 h-[330px]">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            แนวโน้มการออกกำลังกาย
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.activity_trend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2a3449"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={50}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1c2333",
                    borderColor: "#2a3449",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exercise Distribution (Donut Chart) */}
        <div className="rounded-3xl bg-[#1c2333] p-6 h-[350px]">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-purple-400" />
            สัดส่วนท่าออกกำลังกาย
          </h3>
          <div className="h-[250px] w-full relative">
            {stats.exercise_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.exercise_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.exercise_distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          EXERCISE_COLORS[entry.name.toLowerCase()] || "#8884d8"
                        }
                        stroke="rgba(0,0,0,0)"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1c2333",
                      borderColor: "#2a3449",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                ไม่มีข้อมูล
              </div>
            )}
          </div>
        </div>

        {/* Achievements Card - Best Session */}
        <div className="rounded-3xl bg-linear-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                สถิติสูงสุดของเดือน
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
                    {new Date(stats.best_session.date).toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })}
                 </div>
              </>
            ) : (
               <>
                 <h3 className="text-xl font-bold mb-1">ยังไม่มีสถิติ</h3>
                 <p className="text-sm opacity-90">
                   เริ่มออกกำลังกายเพื่อสร้างสถิติใหม่ประจำเดือนนี้!
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
      </div>
    </div>
  );
}
