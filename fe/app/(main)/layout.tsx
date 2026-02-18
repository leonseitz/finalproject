"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, BarChart2, Settings } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRecordingPage = pathname.includes("/record");

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#10141d] text-white">
      {/* Main Content Area - with padding bottom for nav bar (except on recording page) */}
      <main className={`flex-1 overflow-y-auto ${isRecordingPage ? "" : "pb-24"}`}>
        {children}
      </main>

      {/* Bottom Navigation Bar - Hide on recording page */}
      {!isRecordingPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-[#1f293a] bg-[#161b26] pb-2 pt-2 px-6 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
          <Link 
            href="/home" 
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive("/home") ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Home className={`h-6 w-6 ${isActive("/home") ? "" : ""}`} />
            <span className="text-[10px] font-medium">Home</span>
            {isActive("/home") && (
              <div className="absolute top-0 -mt-px h-[2px] w-12 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            )}
          </Link>
          
          <Link 
            href="/history" 
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive("/history") ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <History className={`h-6 w-6 ${isActive("/history") ? "" : ""}`} />
            <span className="text-[10px] font-medium">History</span>
            {isActive("/history") && (
              <div className="absolute top-0 -mt-px h-[2px] w-12 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            )}
          </Link>
          
          <Link 
            href="/dashboard" 
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive("/dashboard") ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <BarChart2 className={`h-6 w-6 ${isActive("/dashboard") ? "" : ""}`} />
            <span className="text-[10px] font-medium">Dashboard</span>
            {isActive("/dashboard") && (
              <div className="absolute top-0 -mt-px h-[2px] w-12 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            )}
          </Link>
          
          <Link 
            href="/settings" 
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive("/settings") ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Settings className={`h-6 w-6 ${isActive("/settings") ? "" : ""}`} />
            <span className="text-[10px] font-medium">Settings</span>
            {isActive("/settings") && (
              <div className="absolute top-0 -mt-px h-[2px] w-12 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            )}
          </Link>
        </nav>
      )}
    </div>
  );
}
