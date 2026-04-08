"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Phone, ArrowRight, Activity, Calendar, Hash, Eye, EyeOff, Mail } from "lucide-react";
import Link from "next/link";
import { getApiBase } from "../../lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    tel: "",
    fname: "",
    lname: "",
    age: "",
    height: "",
    weight: ""
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      };

      const res = await fetch(`${getApiBase()}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Signup failed");
      }

      // Automatically login or redirect to login
      router.push("/login"); // Redirect to login for now
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#10141d] p-6 font-sans text-white">
      <div className="w-full max-w-lg">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create Profile
          </h1>
          <p className="mt-2 text-sm text-gray-400">Enter your details to join VisionFit AI</p>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSignUp} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center text-sm text-red-500">
              {error}
            </div>
          )}
          
          {/* Account Details Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Account Info</h2>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <User className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              </div>
              <input
                id="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                placeholder="Username"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
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

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                placeholder="Email Address"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Phone className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              </div>
              <input
                id="tel"
                type="tel"
                value={formData.tel}
                onChange={handleChange}
                className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                placeholder="Phone Number (Tel)"
              />
            </div>
          </div>

          {/* Personal Details Section */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Personal Details</h2>
            
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <input
                  id="fname"
                  type="text"
                  value={formData.fname}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 px-4 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                  placeholder="First Name"
                />
              </div>
              <div className="relative group">
                <input
                  id="lname"
                  type="text"
                  value={formData.lname}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 px-4 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                  placeholder="Last Name"
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
               <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 pl-10 pr-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                  placeholder="Age"
                />
              </div>
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Activity className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 pl-10 pr-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                  placeholder="Height"
                />
              </div>

               <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Hash className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full rounded-2xl bg-[#1c2333] border border-transparent py-4 pl-10 pr-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:bg-[#1f293a] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                  placeholder="Weight"
                />
              </div>
            </div>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 p-[1px] shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-[0.98] disabled:opacity-70 cursor-pointer"
          >
            <div className="relative flex items-center justify-center rounded-full bg-[#10141d] group-hover:bg-transparent px-8 py-4 text-base font-bold text-white transition-all">
              {loading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-white" />
              ) : (
                <span className="flex items-center gap-2 group-hover:text-white transition-colors">
                  Create Account <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </div>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
