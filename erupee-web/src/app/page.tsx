"use client";

import Link from "next/link";

export default function EntryPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#334155]">
      {/* e₹ Logo */}
      <div className="animate-bounce-in">
        <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] shadow-[0_0_60px_rgba(59,130,246,0.5)]">
          <span className="text-white text-6xl font-bold select-none">e₹</span>
        </div>
      </div>

      <div className="h-10" />

      {/* Title */}
      <div className="animate-slide-up delay-200 text-center">
        <p className="text-white/70 text-lg tracking-wider">Welcome to</p>
        <h1 className="text-white text-5xl md:text-6xl font-bold mt-2">eRupeeX</h1>
        <p className="text-white/60 text-base mt-3">Your Digital Currency Platform</p>
      </div>

      <div className="h-20" />

      {/* Login Button */}
      <div className="animate-slide-up delay-400 w-full max-w-md">
        <Link href="/login">
          <button className="w-full h-[58px] bg-[#3B82F6] hover:bg-[#2563EB] text-white text-lg font-bold rounded-2xl shadow-[0_12px_40px_rgba(59,130,246,0.4)] transition-all duration-300 hover:shadow-[0_16px_50px_rgba(59,130,246,0.5)] hover:scale-[1.02] active:scale-[0.98] tracking-wide">
            Login
          </button>
        </Link>
      </div>

      <div className="h-4" />

      {/* Sign Up Button */}
      <div className="animate-slide-up delay-500 w-full max-w-md">
        <Link href="/signup">
          <button className="w-full h-[58px] bg-transparent border-2 border-white/40 hover:border-white/70 text-white text-lg font-semibold rounded-2xl transition-all duration-300 hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] tracking-wide">
            Sign Up
          </button>
        </Link>
      </div>

      <div className="h-10" />

      {/* Footer */}
      <p className="animate-fade-in delay-600 text-white/50 text-sm tracking-[3px]">
        Secure • Fast • Reliable
      </p>
    </div>
  );
}
