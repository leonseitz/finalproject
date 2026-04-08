import { getApiBase } from "../lib/api";
const API_URL = () => `${getApiBase()}/api`;

export interface SessionDetails {
  video_id: number;
  type_name: string;
  duration: number;
  date: string;
  score: {
    total: number;
    accuracy: number;
    max: number;
    min: number;
    avg: number;
  };
  reps: {
    rep_no: number;
    score: number;
    duration: number;
    warnings: number;
  }[];
  feedbacks: {
    timestamp: number;
    timestamp_start_rep: number; // Added field
    message: string;
    rep_no: number;
  }[];
  goal_status?: number | null; // Added field
}

export const getSessionDetails = async (videoId: string): Promise<SessionDetails> => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL()}/exercise/session/${videoId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch session details");
  }

  return res.json();
};
