export interface ExerciseStat {
  type_id: number;
  type_name: string;
  reps: number;
  duration_sec: number;
  calories: number;
}

export interface DailyStats {
  date: string;
  total_score: number;
  total_duration_sec: number;
  total_exercises: number;
  calories_burned: number;
  exercise_stats: ExerciseStat[];
  best_session?: {
    exercise: string;
    reps: number;
    score: number;
    duration_sec: number;
    date: string;
  };
  mistake_summary: {
    total_reps: number;
    correct_reps: number;
    incorrect_reps: number;
    accuracy: number;
  };
  common_mistakes: { issue: string; exercise_name: string; count: number }[];
  comparison: {
    score_vs_avg: number;
    time_vs_avg: number;
    calories_vs_avg: number;
    reps_vs_avg: number;
  };
}

export interface MonthlyStats {
  year: number;
  month: number;
  total_score: number;
  total_duration: number;
  calories_burned: number;
  activity_trend: { date: string; score: number; duration: number }[];
  exercise_distribution: { name: string; value: number }[];
  best_session?: {
    exercise: string;
    reps: number;
    score: number;
    duration_sec: number;
    date: string;
  } | null;
}

const getAuthHeaders = () => {
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

import { getApiBase } from "../lib/api";
// Use strict 127.0.0.1 to match user.ts and avoid localhost/IPv6 issues
const API_URL = () => `${getApiBase()}/api/stats`;

const getBaseUrl = () => {
    return API_URL();
};

export async function getDailyStats(date?: string): Promise<DailyStats> {
  let url = `${getBaseUrl()}/daily`;
  if (date) {
    url += `?target_date=${date}`;
  }

  console.log("Fetching Daily Stats from:", url);
  console.log("With headers:", getAuthHeaders());
  
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Stats API Error Details:", errorData);
    throw new Error(errorData.detail || `Failed to fetch daily stats: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getMonthlyStats(
  month?: number,
  year?: number,
): Promise<MonthlyStats> {
  let url = `${getBaseUrl()}/monthly`;
  const params = new URLSearchParams();
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch monthly stats");
  }

  return res.json();
}
