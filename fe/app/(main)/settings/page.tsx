"use client";

import { User, Bell, Shield, CircleHelp, LogOut, ChevronRight, Scale, Ruler, Calendar as CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserProfile } from "../../services/user";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUserProfile();
      if (userData) {
        setUser(userData);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const sections = [
    {
      title: "บัญชี",
      items: [
        { label: "ข้อมูลส่วนตัว", icon: User, color: "text-blue-400", bg: "bg-blue-400/10" },
        { label: "การแจ้งเตือน", icon: Bell, color: "text-orange-400", bg: "bg-orange-400/10" },
        { label: "ความเป็นส่วนตัว", icon: Shield, color: "text-purple-400", bg: "bg-purple-400/10" },
      ]
    },
    {
      title: "ความช่วยเหลือ",
      items: [
        { label: "ศูนย์ช่วยเหลือ", icon: CircleHelp, color: "text-green-400", bg: "bg-green-400/10" },
      ]
    }
  ];

  return (
    <div className="flex flex-col p-6 font-sans">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">การตั้งค่า</h1>
        <p className="text-gray-400 text-sm">จัดการบัญชีและแอพพลิเคชันของคุณ</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl bg-[#1c2333] p-6 mb-8 flex items-center gap-4 border border-[#1f293a]">
        <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-cyan-500/30 bg-gray-700 flex items-center justify-center text-xl font-bold text-white">
           {user?.username ? user.username[0].toUpperCase() : "U"}
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            {user?.personal_detail?.fname && user?.personal_detail?.lname 
              ? `${user.personal_detail.fname} ${user.personal_detail.lname}` 
              : user?.username || "นักกีฬา ตัวอย่าง"}
          </h2>
          {/* <p className="text-sm text-cyan-400">สมาชิกพรีเมียม</p> */}
        </div>
        <button className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a3449] text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Physical Details Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-[#1c2333] p-4 flex flex-col items-center gap-1 border border-[#1f293a]">
           <Scale className="h-5 w-5 text-gray-500 mb-1" />
           <span className="text-xs text-gray-400">น้ำหนัก</span>
           <span className="text-sm font-bold text-white">
             {user?.personal_detail?.weight ? `${user.personal_detail.weight} kg` : "-"}
           </span>
        </div>
        <div className="rounded-2xl bg-[#1c2333] p-4 flex flex-col items-center gap-1 border border-[#1f293a]">
           <Ruler className="h-5 w-5 text-gray-500 mb-1" />
           <span className="text-xs text-gray-400">ส่วนสูง</span>
           <span className="text-sm font-bold text-white">
             {user?.personal_detail?.height ? `${user.personal_detail.height} cm` : "-"}
           </span>
        </div>
        <div className="rounded-2xl bg-[#1c2333] p-4 flex flex-col items-center gap-1 border border-[#1f293a]">
           <CalendarIcon className="h-5 w-5 text-gray-500 mb-1" />
           <span className="text-xs text-gray-400">อายุ</span>
           <span className="text-sm font-bold text-white">
             {user?.personal_detail?.age ? `${user.personal_detail.age} ปี` : "-"}
           </span>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6 mb-8">
        {sections.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">{section.title}</h3>
            <div className="rounded-3xl bg-[#1c2333] overflow-hidden border border-[#1f293a]">
              {section.items.map((item, itemIdx) => (
                <button
                  key={itemIdx}
                  className={`w-full flex items-center justify-between p-4 hover:bg-[#232d42] transition-colors ${
                    itemIdx !== section.items.length - 1 ? "border-b border-[#1f293a]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}>
                       <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <span className="text-sm font-medium text-white">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-500/10 p-4 text-red-500 font-bold hover:bg-red-500/20 transition-all mb-8 cursor-pointer"
      >
        <LogOut className="h-5 w-5" />
        <span>ออกจากระบบ</span>
      </button>
    </div>
  );
}
