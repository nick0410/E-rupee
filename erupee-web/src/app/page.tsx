"use client";

import Link from "next/link";

export default function EntryPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 
    bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#334155] 
    dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#334155]">

      {/* e₹ Logo */}
      <div className="animate-bounce-in">
        <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center 
        bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] 
        shadow-[0_0_60px_rgba(59,130,246,0.5)]">
          <span className="text-black dark:text-white text-6xl font-bold select-none">
            e₹
          </span>
        </div>
      </div>

      <div className="h-10" />

      {/* Title */}
      <div className="animate-slide-up delay-200 text-center">
        <p className="text-black/90 dark:text-white/90 text-lg tracking-wider font-medium">
          Welcome to
        </p>

        <h1 className="text-white dark:text-white text-5xl md:text-6xl font-bold mt-2">
          eRupeeX
        </h1>

        <p className="text-white/80 dark:text-white/80 text-base mt-3 font-medium">
          Your Digital Currency Platform
        </p>
      </div>

      <div className="h-20" />

      {/* Login Button */}
      <div className="animate-slide-up delay-400 w-full max-w-md">
        <Link href="/login">
          <button className="w-full h-[58px] bg-[#3B82F6] hover:bg-[#2563EB] 
          text-white text-lg font-bold rounded-2xl 
          shadow-[0_12px_40px_rgba(59,130,246,0.4)] 
          transition-all duration-300 
          hover:shadow-[0_16px_50px_rgba(59,130,246,0.5)] 
          hover:scale-[1.02] active:scale-[0.98] tracking-wide">
            Login
          </button>
        </Link>
      </div>

      <div className="h-4" />

      {/* Sign Up Button */}
      <div className="animate-slide-up delay-500 w-full max-w-md">
        <Link href="/signup">
          <button className="w-full h-[58px] 
          bg-transparent 
          border-2 border-white/40 dark:border-white/40 
          hover:border-white/70 dark:hover:border-white/70 
          text-white/90 dark:text-white/90 
          text-lg font-semibold rounded-2xl 
          transition-all duration-300 
          hover:bg-white/10 dark:hover:bg-white/10 
          hover:scale-[1.02] active:scale-[0.98] tracking-wide">
            Sign Up
          </button>
        </Link>
      </div>

      <div className="h-10" />

      {/* Footer */}
      <p className="animate-fade-in delay-600 
      text-white/70 dark:text-white/70 
      text-sm tracking-[3px] font-medium">
        Secure • Fast • Reliable
      </p>
    </div>
  );
}