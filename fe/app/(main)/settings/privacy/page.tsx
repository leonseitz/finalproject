"use client";

import { ChevronLeft, Shield, FileText, Lock, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacySettingsPage() {
  const router = useRouter();

  const privacyItems = [
    {
        title: "นโยบายความเป็นส่วนตัว",
        icon: FileText,
        description: "อ่านนโยบายเกี่ยวกับข้อมูลของคุณ"
    },
    {
        title: "ความปลอดภัยของบัญชี",
        icon: Lock,
        description: "จัดการรหัสผ่านและความปลอดภัย"
    },
    {
        title: "การมองเห็นข้อมูล",
        icon: Eye,
        description: "เลือกผู้ที่สามารถเห็นข้อมูลของคุณได้"
    }
  ];

  return (
    <div className="flex flex-col p-6 font-sans min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#1c2333] text-gray-400 hover:text-white border border-[#2a3449] transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">ความเป็นส่วนตัว</h1>
          <p className="text-gray-400 text-sm">จัดการความเป็นส่วนตัวและความปลอดภัย</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-3xl bg-[#1c2333] p-8 flex flex-col items-center text-center border border-[#1f293a]">
            <div className="h-20 w-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                <Shield className="h-10 w-10 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">ข้อมูลของคุณปลอดภัย</h2>
            <p className="text-sm text-gray-400">
                เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ ข้อมูลทั้งหมดจะถูกเข้ารหัสและรักษาความปลอดภัยตามมาตรฐานสากล
            </p>
        </div>

        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">การตั้งค่า</h3>
            {privacyItems.map((item, idx) => (
                <button 
                    key={idx}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1c2333] border border-[#1f293a] hover:bg-[#232d42] transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#2a3449] flex items-center justify-center text-gray-300">
                            <item.icon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <span className="block text-sm font-bold text-white">{item.title}</span>
                            <span className="block text-xs text-gray-400">{item.description}</span>
                        </div>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-gray-500 rotate-180" />
                </button>
            ))}
        </div>
      </div>
    </div>
  );
}
