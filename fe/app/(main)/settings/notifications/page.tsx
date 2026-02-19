"use client";

import { ChevronLeft, Bell, Mail, Smartphone, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState([
    {
      id: "push_enable",
      title: "การแจ้งเตือนทั่วไป",
      description: "รับการแจ้งเตือนเกี่ยวกับกิจกรรมและการอัปเดต",
      enabled: true,
      icon: Bell,
      color: "text-orange-400",
      bg: "bg-orange-400/10"
    },
    {
      id: "email_news",
      title: "ข่าวสารทางอีเมล",
      description: "รับข้อมูลข่าวสารและโปรโมชั่นพิเศษ",
      enabled: false,
      icon: Mail,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    {
      id: "app_sound",
      title: "เสียงในแอปพลิเคชัน",
      description: "เปิดเสียงเอฟเฟกต์ขณะใช้งาน",
      enabled: true,
      icon: Volume2,
      color: "text-purple-400",
      bg: "bg-purple-400/10"
    },
     {
      id: "system_alert",
      title: "การเตือนจากระบบ",
      description: "แจ้งเตือนเมื่อระบบมีการซ่อมบำรุงหรืออัปเดต",
      enabled: true,
      icon: Smartphone,
      color: "text-green-400",
      bg: "bg-green-400/10"
    }
  ]);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

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
          <h1 className="text-2xl font-bold text-white">การแจ้งเตือน</h1>
          <p className="text-gray-400 text-sm">จัดการการแจ้งเตือนที่คุณได้รับ</p>
        </div>
      </div>

      <div className="space-y-4">
        {settings.map((item) => (
          <div 
            key={item.id}
            className="rounded-2xl bg-[#1c2333] p-4 flex items-center justify-between border border-[#1f293a]"
          >
            <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.bg}`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-400">{item.description}</p>
                </div>
            </div>
            
            <button
                onClick={() => toggleSetting(item.id)}
                className={`w-12 h-7 rounded-full transition-colors flex items-center p-1 ${
                    item.enabled ? "bg-cyan-500" : "bg-gray-700"
                }`}
            >
                <div className={`h-5 w-5 rounded-full bg-white transition-transform ${
                    item.enabled ? "translate-x-5" : ""
                }`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
