import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { GroupedHistory } from "./types";

interface HistoryInDayProps {
  group: GroupedHistory;
  onBack: () => void;
}

export default function HistoryInDay({ group, onBack }: HistoryInDayProps) {
  return (
    <div className="flex flex-col p-6 font-sans min-h-screen bg-[#10141d]">
      {/* Header with Back Button */}
      <div className="mb-8 flex items-center gap-3">
        <button 
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2333] text-gray-400 hover:bg-[#232d42] hover:text-white"
        >
            <ChevronRight className="h-5 w-5 rotate-180" />
        </button>
        <div>
            <h1 className="text-xl font-bold text-white mb-0.5">{group.date}</h1>
            <p className="text-gray-400 text-xs">รายการออกกำลังกายทั้งหมด</p>
        </div>
      </div>

      <div className="space-y-4 pb-20">
        {group.items.map((item) => (
            <Link
              href={`/history/replay/${item.id}?return_date=${encodeURIComponent(group.date)}`}
              key={item.id}
              className="group flex items-center justify-between rounded-2xl bg-[#1c2333] p-4 transition-all hover:bg-[#232d42]"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.iconBg}`}>
                  <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
                <div>
                  <h4 className="font-bold text-white">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{item.time}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-700" />
                    <span className="text-xs text-cyan-400 font-medium">
                        {item.name.toLowerCase().includes("plank") ? item.duration : `${item.reps} ครั้ง`}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right block">
                    <p className="text-xs text-gray-400">ระยะเวลา</p>
                    <p className="text-sm font-medium text-white">{item.duration}</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a3449] text-gray-400 transition-colors group-hover:bg-cyan-500 group-hover:text-white">
                     <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
        ))}
      </div>
    </div>
  );
}
