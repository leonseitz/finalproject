"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { getApiBase } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${getApiBase()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Store token
      localStorage.setItem("token", data.access_token);
      
      router.push("/home");
    } catch (err: any) {
      console.error("Login Error:", err);
      const errorMessage = err.message || "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#10141d] p-6 font-sans text-white">
      {/* Main Container */}
      <div className="w-full max-w-sm">
        
        {/* Logo Section */}
        <div className="mb-12 flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
            VisionFit<span className="text-cyan-400">&nbsp;&nbsp;AI</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">Welcome back, please sign in</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center text-sm text-red-500">
                {error}
              </div>
            )}

            {/* Email or Phone Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <User className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              </div>
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                placeholder="Email or Username"
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 pl-12 pr-12 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-cyan-400 transition-colors focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            <div className="flex justify-end">
              <a href="#" className="text-sm font-medium text-gray-400 hover:text-cyan-400 transition-colors">
                Forgot Password?
              </a>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 p-[1px] shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-[0.98] disabled:opacity-70 cursor-pointer"
          >
            <div className="relative flex items-center justify-center rounded-full bg-[#10141d] group-hover:bg-transparent px-8 py-4 text-base font-bold text-white transition-all">
              {loading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-white" />
              ) : (
                <span className="flex items-center gap-2 group-hover:text-white transition-colors">
                  Sign In <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </div>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
