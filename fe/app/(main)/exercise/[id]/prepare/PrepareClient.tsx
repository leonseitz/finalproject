"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Info, AlertTriangle, Target, Play, Activity } from "lucide-react";
import { EXERCISE_DATA } from "@/constants/exerciseData";

export default function PrepareClient() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = Number(params.id);
  const exercise = EXERCISE_DATA[exerciseId];

  // Determine target type based on exercise: Plank (ID 5) uses time, others use reps
  const initialTargetType = exerciseId === 5 ? "time" : "reps";
  const [targetType, setTargetType] = useState<"reps" | "time">(initialTargetType);
  const [val, setVal] = useState("");
  const [side, setSide] = useState<"both" | "left" | "right">("right");
  const [autoStop, setAutoStop] = useState(true);

  useEffect(() => {
    setTargetType(initialTargetType);
  }, [exerciseId, initialTargetType]);

  if (!exercise) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        <p>ไม่พบข้อมูลท่าออกกำลังกาย</p>
      </div>
    );
  }

  const handleStart = () => {
    if (!val) {
      alert("กรุณาตั้งเป้าหมายก่อนเริ่มออกกำลังกาย");
      return;
    }
    router.push(`/exercise/${exerciseId}/record?target=${val}&type=${targetType}&side=${side}&auto_stop=${autoStop}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0f172a] text-white font-sans p-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f293a] text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold">เตรียมตัวออกกำลังกาย</h1>
      </div>

      {/* Exercise Title Card */}
      <div className="mb-4 rounded-3xl bg-linear-to-br from-cyan-500 to-blue-600 p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <exercise.icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">{exercise.title_th}</h2>
            <p className="text-white/80 text-sm">เตรียมความพร้อมก่อนเริ่มต้น</p>
          </div>
        </div>
      </div>

      {/* Side Selection (Only for Bicep Curl) */}
      {exerciseId === 1 && (
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            เลือกข้างที่ต้องการเล่น
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "right", label: "แขนขวา" },
              { id: "left", label: "แขนซ้าย" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setSide(option.id as any)}
                className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border-2 ${
                  side === option.id
                    ? "bg-cyan-500 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "bg-[#1c2333] border-transparent text-gray-400 hover:bg-[#252e42]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Goal Setting */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-cyan-400" />
          ตั้งเป้าหมาย ({targetType === "reps" ? "จำนวนครั้ง" : "วินาที"})
        </h3>
        
        <div className="rounded-3xl bg-[#1c2333] p-6">

          <div className="relative mb-6">
            <input
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={targetType === "reps" ? "0 ครั้ง" : "0 วินาที"}
              className="w-full bg-[#0f172a] border-2 border-gray-800 rounded-2xl py-4 px-6 text-center text-3xl font-bold text-cyan-400 focus:border-cyan-500 focus:outline-none transition-all"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              {targetType === "reps" ? "ครั้ง" : "วินาที"}
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#0f172a] rounded-2xl p-4 mb-6 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${autoStop ? 'bg-cyan-500' : 'bg-gray-600'}`} onClick={() => setAutoStop(!autoStop)} role="button">
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${autoStop ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm font-medium text-gray-300">หยุดอัตโนมัติเมื่อครบ</span>
            </div>
            <span className="text-xs text-gray-500">
              {autoStop ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </span>
          </div>

          <button
            onClick={handleStart}
            className="w-full h-14 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98]"
          >
            <Play className="h-5 w-5 fill-current" />
            ยืนยันและเริ่มเลย
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-4">
        <div className="rounded-3xl bg-[#1c2333] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold mb-1">วิธีออกกำลังกาย</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{exercise.description}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-[#1c2333] p-5 border border-green-500/10">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold mb-1">เกณฑ์การให้คะแนน</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{exercise.how_to_score}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-[#1c2333] p-5 border border-orange-500/10">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold mb-1 text-orange-400">ข้อควรระวัง (หักคะแนน)</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{exercise.warnings}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
