import { Calendar, ChevronRight, Activity, Zap, Dumbbell, Timer } from "lucide-react";
import { GroupedHistory } from "./types";

interface HistoryDayListProps {
  historyGroups: GroupedHistory[];
  onSelectGroup: (group: GroupedHistory) => void;
  getExerciseIcon: (name: string) => { icon: any; iconColor: string; iconBg: string };
  formatDuration: (seconds: number) => string;
}

export default function HistoryDayList({ 
  historyGroups, 
  onSelectGroup, 
  getExerciseIcon, 
  formatDuration 
}: HistoryDayListProps) {
  return (
    <div className="space-y-4 pb-20">
      {historyGroups.map((group, groupIdx) => {
        // Calculate Summary Stats
        const uniqueExercises = Array.from(new Set(group.items.map(i => i.name)));
        const totalDurationSec = group.items.reduce((acc, curr) => acc + curr.duration_sec, 0);
        const totalDurationStr = formatDuration(totalDurationSec);
        const sessionCount = group.items.length;

        return (
          <div 
            key={groupIdx}
            onClick={() => onSelectGroup(group)}
            className="group cursor-pointer rounded-2xl bg-[#1c2333] p-5 transition-all hover:bg-[#232d42] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-cyan-400" />
                    <h3 className="font-bold text-white text-lg">{group.date}</h3>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            
            <div className="flex items-center justify-between gap-4">
                <div className="flex -space-x-3 overflow-hidden py-1">
                    {uniqueExercises.slice(0, 3).map((name, idx) => {
                        const { icon: Icon, iconColor, iconBg } = getExerciseIcon(name);
                        return (
                            <div key={idx} className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1c2333] ${iconBg}`}>
                                <Icon className={`h-5 w-5 ${iconColor}`} />
                            </div>
                        );
                    })}
                    {uniqueExercises.length > 3  && (
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1c2333] bg-gray-700 text-xs font-bold text-white">
                            +{uniqueExercises.length - 3}
                        </div>
                    )}
                </div>
                
                <div className="flex-1 flex flex-col items-end">
                    <p className="text-gray-400 text-sm line-clamp-1">
                        {uniqueExercises.join(", ")}
                    </p>
                    <div className="flex items-center justify-end w-full mt-1.5 gap-3">
                        <span className="text-xs font-medium text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-md whitespace-nowrap">
                            {sessionCount} รายการ
                        </span>
                        <span className="text-xs text-gray-500 text-right">
                            เวลารวม {totalDurationStr}
                        </span>
                    </div>
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
