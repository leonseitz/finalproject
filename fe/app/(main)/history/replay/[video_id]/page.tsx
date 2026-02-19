"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Play, Loader2, AlertCircle } from "lucide-react";

interface ReplayPageProps {
  params: Promise<{
    video_id: string;
  }>;
}

import { getSessionDetails, SessionDetails } from "../../../../services/history";

export default function ReplayPage({ params }: ReplayPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const return_date = searchParams.get("return_date");
  const { video_id } = use(params);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function fetchData() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            // 1. Fetch Video Blob
            const protocol = window.location.protocol === "https:" ? "https:" : "http:";
            const host = window.location.hostname;
            const port = "8000";
            const apiUrl = `${protocol}//${host}:${port}/api/exercise/video/${video_id}`;
            
            const vidRes = await fetch(apiUrl, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!vidRes.ok) {
                 if (vidRes.status === 401) {
                     localStorage.removeItem("token");
                     router.push("/login");
                     return;
                 }
                 throw new Error("Could not load video");
            }

            const blob = await vidRes.blob();
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);

            // 2. Fetch Session Details
            const details = await getSessionDetails(video_id);
            setSessionData(details);

            setLoading(false);

        } catch (err) {
            console.error(err);
            setError("ไม่สามารถโหลดข้อมูลได้");
            setLoading(false);
        }
    }
    
    if (video_id) {
        fetchData();
    }
    
    // Cleanup
    return () => {
        if (videoUrl) URL.revokeObjectURL(videoUrl);
    }
  }, [video_id, router]);

  const handleBack = () => {
      if (return_date) {
         router.push(`/history?open_date=${encodeURIComponent(return_date)}`);
      } else {
         router.back();
      }
  };
  
  const seekTo = (timestamp: number) => {
      if (videoRef.current) {
          videoRef.current.currentTime = timestamp;
          videoRef.current.play();
      }
  };

  return (
    <div className="flex flex-col p-6 font-sans min-h-screen bg-[#10141d]">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button 
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2333] text-gray-400 hover:bg-[#232d42] hover:text-white transition-colors"
        >
            <ChevronRight className="h-5 w-5 rotate-180" />
        </button>
        <div>
            <h1 className="text-xl font-bold text-white mb-0.5">ผลการฝึกซ้อม</h1>
            <p className="text-gray-400 text-xs">Video ID: {video_id}</p>
        </div>
      </div> 

      {sessionData?.type_name && (
        <div className="mb-4 pl-2">
             <h2 className="text-2xl font-bold text-cyan-400">{sessionData.type_name}</h2>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl bg-[#1c2333] border border-red-500/20 text-red-400">
           <AlertCircle className="h-10 w-10 mb-2" />
           <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="flex h-64 w-full items-center justify-center rounded-xl bg-[#1c2333]">
           <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="space-y-6">
            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                <video 
                    ref={videoRef}
                    src={videoUrl!} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                />
            </div> 

            {/* Score Summary */}
            {sessionData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[#1c2333] border border-[#2a3449]">
                        <p className="text-gray-400 text-xs mb-1">คะแนนรวม</p>
                        <p className="text-2xl font-bold text-cyan-400">{sessionData.score.total} <span className="text-lg text-gray-500 font-normal">/ {sessionData.reps.length * 5}</span></p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1c2333] border border-[#2a3449]">
                        <p className="text-gray-400 text-xs mb-1">ความแม่นยำ</p>
                        <p className="text-2xl font-bold text-emerald-400">{sessionData.score.accuracy}%</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1c2333] border border-[#2a3449]">
                        <p className="text-gray-400 text-xs mb-1">จำนวนครั้ง</p>
                        <p className="text-2xl font-bold text-white">{sessionData.reps.length} <span className="text-sm font-normal text-gray-500">ครั้ง</span></p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1c2333] border border-[#2a3449]">
                        <p className="text-gray-400 text-xs mb-1">เวลาทั้งหมด</p>
                        <p className="text-2xl font-bold text-white">{sessionData.duration} <span className="text-sm font-normal text-gray-500">วินาที</span></p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Repetition List */}
                <div className="p-5 rounded-2xl bg-[#1c2333] border border-[#2a3449]">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Play className="h-4 w-4 text-cyan-400 fill-cyan-400" /> 
                        รายละเอียดแต่ละครั้ง (Repetitions)
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {sessionData?.reps.map((rep) => (
                            <div key={rep.rep_no} className="flex items-center justify-between p-3 rounded-xl bg-[#151a25] border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                                        #{rep.rep_no}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${rep.score >= 3 ? "text-emerald-400" : "text-red-400"}`}>
                                            {rep.score} คะแนน
                                        </p>
                                        <p className="text-xs text-gray-500">{rep.duration} วินาที</p>
                                    </div>
                                </div>
                                {rep.warnings > 0 && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                                        {rep.warnings} คำเตือน
                                    </span>
                                )}
                            </div>
                        ))}
                        {sessionData?.reps.length === 0 && (
                           <p className="text-center text-gray-500 py-4 text-sm">ไม่พบข้อมูลการทำ</p>
                        )}
                    </div>
                </div>

                {/* Feedback Timeline */}
                <div className="p-5 rounded-2xl bg-[#1c2333] border border-[#2a3449]">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-400" /> 
                        ไทม์ไลน์แจ้งเตือน (Events)
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {sessionData?.feedbacks.map((fb, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => seekTo(fb.timestamp)}
                                className="group cursor-pointer flex items-start gap-3 p-3 rounded-xl bg-[#151a25] border border-gray-800 hover:bg-[#1a202e] hover:border-cyan-500/30 transition-all"
                            >
                                <div className="mt-1 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-300 group-hover:text-white transition-colors">{fb.message}</p>
                                    <p className="text-xs text-cyan-500 mt-1">
                                        ที่เวลา {fb.timestamp.toFixed(1)} วินาที (ครั้งที่ {fb.rep_no})
                                    </p>
                                </div>
                            </div>
                        ))}
                         {sessionData?.feedbacks.length === 0 && (
                           <p className="text-center text-gray-500 py-4 text-sm">ไม่มีการแจ้งเตือนข้อผิดพลาด (ทำได้เยี่ยมมาก!)</p>
                        )}
                    </div>
                </div>
            </div>

        </div>
      )}
    </div>
  );
}
