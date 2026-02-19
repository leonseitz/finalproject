"use client";

import { ChevronLeft, User, Save, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "../../../services/user";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    weight: "",
    height: "",
    age: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getUserProfile();
        if (user) {
          setFormData({
            firstName: user.personal_detail?.fname || "",
            lastName: user.personal_detail?.lname || "",
            username: user.username || "",
            email: user.email || "",
            weight: user.personal_detail?.weight?.toString() || "",
            height: user.personal_detail?.height?.toString() || "",
            age: user.personal_detail?.age?.toString() || "",
          });
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
        const payload = {
            fname: formData.firstName,
            lname: formData.lastName,
            username: formData.username,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            height: formData.height ? parseFloat(formData.height) : null,
            age: formData.age ? parseInt(formData.age) : null,
        };
        
        await updateUserProfile(payload);
        alert("บันทึกข้อมูลเรียบร้อย");
    } catch (error) {
        console.error("Failed to update profile", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
        setIsLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-white">ข้อมูลส่วนตัว</h1>
          <p className="text-gray-400 text-sm">จัดการข้อมูลบัญชีของคุณ</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Avatar Section */}
        <div className="flex justify-center mb-4">
            <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gray-700 border-4 border-[#1c2333] flex items-center justify-center overflow-hidden">
                    <span className="text-3xl font-bold text-white">
                        {formData.username ? formData.username[0]?.toUpperCase() : "U"}
                    </span>
                </div>
                <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-cyan-500 flex items-center justify-center text-white border-2 border-[#1c2333]">
                    <Camera className="h-4 w-4" />
                </button>
            </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">ชื่อจริง</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input 
                            type="text" 
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full bg-[#1c2333] border border-[#2a3449] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            placeholder="ชื่อจริง"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">นามสกุล</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input 
                            type="text" 
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full bg-[#1c2333] border border-[#2a3449] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            placeholder="นามสกุล"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">ชื่อผู้ใช้</label>
                <input 
                    type="text" 
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-[#1c2333] border border-[#2a3449] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Username"
                />
            </div>

             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">น้ำหนัก (kg)</label>
                    <input 
                        type="number" 
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        className="w-full bg-[#1c2333] border border-[#2a3449] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        placeholder="0"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">ส่วนสูง (cm)</label>
                    <input 
                        type="number" 
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        className="w-full bg-[#1c2333] border border-[#2a3449] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        placeholder="0"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">อายุ (ปี)</label>
                    <input 
                        type="number" 
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        className="w-full bg-[#1c2333] border border-[#2a3449] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        placeholder="0"
                    />
                </div>
            </div>
        </div>

        <button 
            onClick={handleSave}
            disabled={isLoading}
            className="mt-4 w-full bg-cyan-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? (
                <span>กำลังบันทึก...</span>
            ) : (
                <>
                    <Save className="h-5 w-5" />
                    <span>บันทึกการเปลี่ยนแปลง</span>
                </>
            )}
        </button>
      </div>
    </div>
  );
}
