"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Play, Loader2, AlertCircle } from "lucide-react";

interface ReplayPageProps {
  params: Promise<{
    video_id: string;
  }>;
}

export default function ReplayPage({ params }: ReplayPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const return_date = searchParams.get("return_date");
  const { video_id } = use(params);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVideo() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const protocol = window.location.protocol === "https:" ? "https:" : "http:";
            const host = window.location.hostname;
            const port = "8000";
            const apiUrl = `${protocol}//${host}:${port}/api/exercise/video/${video_id}`;
            
            // Checks for video fetch... same logic
            
            // Let's try fetching as blob for now to support Auth header securely
            const res = await fetch(apiUrl, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                 if (res.status === 401) {
                     localStorage.removeItem("token");
                     router.push("/login");
                     return;
                 }
                 throw new Error("Could not load video");
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
            setLoading(false);

        } catch (err) {
            console.error(err);
            setError("ไม่สามารถโหลดวิดีโอได้");
            setLoading(false);
        }
    }
    
    if (video_id) {
        fetchVideo();
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

  return (
    <div className="flex flex-col p-6 font-sans min-h-screen bg-[#10141d]">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button 
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2333] text-gray-400 hover:bg-[#232d42] hover:text-white"
        >
            <ChevronRight className="h-5 w-5 rotate-180" />
        </button>
        <div>
            <h1 className="text-xl font-bold text-white mb-0.5">การเล่นวิดีโอย้อนหลัง</h1>
            <p className="text-gray-400 text-xs">Video ID: {video_id}</p>
        </div>
      </div>

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
            {/* Video Player Section */}
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                <video 
                    src={videoUrl!} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Placeholders for Future Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#1c2333] border border-gray-800 opacity-50">
                    <h3 className="text-white font-bold mb-2">ผลการวิเคราะห์ (Analysis)</h3>
                    <p className="text-sm text-gray-500">ส่วนนี้จะแสดงคะแนนและการวิเคราะห์ท่าทาง...</p>
                    <div className="mt-4 h-20 bg-[#151a25] rounded-lg animate-pulse"></div>
                </div>
                <div className="p-5 rounded-2xl bg-[#1c2333] border border-gray-800 opacity-50">
                    <h3 className="text-white font-bold mb-2">ไทม์ไลน์แจ้งเตือน (Events)</h3>
                    <p className="text-sm text-gray-500">ส่วนนี้จะแสดงรายการแจ้งเตือนที่เกิดขึ้น...</p>
                    <div className="mt-4 space-y-2">
                        <div className="h-8 bg-[#151a25] rounded-lg animate-pulse"></div>
                        <div className="h-8 bg-[#151a25] rounded-lg animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
