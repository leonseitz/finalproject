const API_URL = "http://127.0.0.1:8000/api";

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
    message: string;
    rep_no: number;
  }[];
}

export const getSessionDetails = async (videoId: string): Promise<SessionDetails> => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/exercise/session/${videoId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch session details");
  }

  return res.json();
};
