"use client";

import { ChevronLeft, HelpCircle, MessageCircle, FileQuestion, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HelpSettingsPage() {
  const router = useRouter();

  const helpItems = [
    {
      title: "คำถามที่พบบ่อย (FAQ)",
      icon: FileQuestion,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10"
    },
    {
      title: "ติดต่อสอบถาม",
      icon: MessageCircle,
      color: "text-green-400",
      bg: "bg-green-400/10"
    },
    {
      title: "เว็บไซต์หลัก",
      icon: Globe,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
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
          <h1 className="text-2xl font-bold text-white">ศูนย์ช่วยเหลือ</h1>
          <p className="text-gray-400 text-sm">รับความช่วยเหลือและคำแนะนำ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {helpItems.map((item, idx) => (
          <button 
            key={idx}
            className="flex items-center gap-4 p-5 rounded-2xl bg-[#1c2333] border border-[#1f293a] hover:bg-[#232d42] transition-colors text-left"
          >
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.bg}`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <p className="text-xs text-gray-400 mt-1">คลิกเพื่อดูรายละเอียดเพิ่มเติม</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-gray-600 rotate-180" />
          </button>
        ))}

        <div className="mt-8 p-6 rounded-3xl bg-linear-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 text-center">
            <HelpCircle className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">ยังต้องการความช่วยเหลือ?</h3>
            <p className="text-sm text-gray-300 mb-6">
                หากคุณไม่พบคำตอบที่ต้องการ สามารถติดต่อทีมงานซัพพอร์ตของเราได้ตลอด 24 ชั่วโมง
            </p>
            <button className="w-full bg-cyan-500 text-white font-bold py-3 rounded-xl hover:bg-cyan-400 transition-colors">
                ส่งข้อความหาเรา
            </button>
        </div>
      </div>
    </div>
  );
}
