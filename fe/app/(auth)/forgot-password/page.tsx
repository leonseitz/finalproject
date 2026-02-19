"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, KeyRound, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1); // 1: Request OTP, 2: Reset Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Step 1: Request OTP
  const [email, setEmail] = useState("");

  // Step 2: Reset Password
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Failed to send OTP");
      }
      
      // In a real app, we wouldn't show the OTP, but for dev we might showing it or expecting it in console
      if (data.debug_otp) {
        console.log("DEBUG OTP:", data.debug_otp);
        alert(`DEBUG MODE: Your OTP is ${data.debug_otp}`);
      }

      setSuccessMessage("ส่งรหัสยืนยันไปยังอีเมลของคุณแล้ว (ตรวจสอบ Console/Alert สำหรับ Dev Mode)");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to reset password");
      }

      setSuccessMessage("เปลี่ยนรหัสผ่านสำเร็จ! กำลังพากลับไปหน้าเข้าสู่ระบบ...");
      setTimeout(() => {
        router.push("/login"); // Fixed: router.push instead of navigate
      }, 2000);
    } catch (err: any) {
        // Handle specific errors like 400 Bad Request (Invalid OTP)
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#10141d] p-6 font-sans text-white">
      <div className="w-full max-w-sm">
        
        {/* Back Button */}
        <Link href="/login" className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>กลับไปหน้าเข้าสู่ระบบ</span>
        </Link>
        
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
                {step === 1 ? "ลืมรหัสผ่าน?" : "ตั้งรหัสผ่านใหม่"}
            </h1>
            <p className="text-gray-400 text-sm">
                {step === 1 
                    ? "กรอกอีเมลของคุณเพื่อรับรหัสยืนยัน (OTP)" 
                    : "กรอกรหัส OTP ที่ได้รับและตั้งรหัสผ่านใหม่"}
            </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center text-sm text-red-500">
                {error}
            </div>
        )}
        {successMessage && (
            <div className="mb-6 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center text-sm text-green-500 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {successMessage}
            </div>
        )}

        {/* Form Step 1 */}
        {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-6">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    </div>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                        placeholder="อีเมลของคุณ"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-full bg-linear-to-r from-blue-600 to-cyan-400 p-px shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-[0.98] disabled:opacity-70"
                >
                    <div className="relative flex items-center justify-center rounded-full bg-[#10141d] group-hover:bg-transparent px-8 py-4 text-base font-bold text-white transition-all">
                        {loading ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-white" />
                        ) : (
                            <span className="flex items-center gap-2 group-hover:text-white transition-colors">
                                ส่งรหัสยืนยัน <ArrowRight className="h-5 w-5" />
                            </span>
                        )}
                    </div>
                </button>
            </form>
        )}

        {/* Form Step 2 */}
        {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-4">
                     <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <KeyRound className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            required
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all tracking-widest text-center font-mono text-lg"
                            placeholder="OTP 6 หลัก"
                            maxLength={6}
                        />
                    </div>
                    
                    <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 px-4 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                        placeholder="รหัสผ่านใหม่"
                    />
                    
                    <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 px-4 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                        placeholder="ยืนยันรหัสผ่านใหม่"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-full bg-linear-to-r from-blue-600 to-cyan-400 p-px shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-[0.98] disabled:opacity-70"
                >
                    <div className="relative flex items-center justify-center rounded-full bg-[#10141d] group-hover:bg-transparent px-8 py-4 text-base font-bold text-white transition-all">
                        {loading ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-white" />
                        ) : (
                            <span className="flex items-center gap-2 group-hover:text-white transition-colors">
                                เปลี่ยนรหัสผ่าน
                            </span>
                        )}
                    </div>
                </button>
                
                 <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-center text-sm text-gray-500 hover:text-cyan-400 transition-colors"
                >
                    ส่งรหัสยืนยันใหม่อีกครั้ง
                </button>
            </form>
        )}
      </div>
    </div>
  );
}
