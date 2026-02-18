import { Activity, Zap, Dumbbell, Timer } from "lucide-react";

export interface HistoryItem {
  id: number;
  name: string;
  started_at: string;
  duration_sec: number;
  reps: number;
  video_path: string;
}

export interface GroupedHistory {
  date: string;
  items: (HistoryItem & {
    time: string;
    duration: string;
    icon: any;
    iconColor: string;
    iconBg: string;
  })[];
}
