"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.user) {
        localStorage.setItem("userId", String(res.user.id));
        localStorage.setItem("user", JSON.stringify(res.user));
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#1E3A8A] via-[#3B82F6] to-[#60A5FA] px-8 pt-16 pb-8">
      {/* Logo */}
      <div className="animate-bounce-in">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-white to-[#F0F9FF] shadow-[0_0_40px_rgba(96,165,250,0.5)]">
          <span className="text-[#1E3A8A] text-4xl font-bold select-none">e₹</span>
        </div>
      </div>

      <div className="h-8" />

      {/* Title */}
      <div className="animate-slide-up delay-200 text-center">
        <h1 className="text-white text-3xl md:text-4xl font-bold">Welcome Back</h1>
        <p className="text-white/80 mt-2">Sign in to your eRupeeX account</p>
      </div>

      <div className="h-12" />

      {/* Form */}
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        {/* Email */}
        <div className="animate-slide-up delay-300">
          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A8A] text-lg" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl text-gray-800 placeholder:text-gray-400 shadow-[0_8px_30px_rgba(255,255,255,0.15)] focus:ring-2 focus:ring-[#60A5FA] transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="animate-slide-up delay-400">
          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A8A] text-lg" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full h-14 pl-12 pr-12 bg-white rounded-2xl text-gray-800 placeholder:text-gray-400 shadow-[0_8px_30px_rgba(255,255,255,0.15)] focus:ring-2 focus:ring-[#60A5FA] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
        </div>

        {/* Forgot Password */}
        <div className="animate-fade-in delay-500 text-right">
          <button type="button" className="text-white font-semibold text-sm hover:underline">
            Forgot Password?
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-white text-sm text-center">
            {error}
          </div>
        )}

        {/* Login Button */}
        <div className="animate-slide-up delay-600">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-white text-[#1E3A8A] font-bold text-lg rounded-2xl shadow-[0_12px_40px_rgba(255,255,255,0.2)] hover:shadow-[0_16px_50px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-6 h-6 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
            ) : (
              "Login"
            )}
          </button>
        </div>
      </form>

      <div className="h-6" />

      {/* Sign Up Link */}
      <p className="animate-fade-in delay-700 text-white/80">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-white font-bold hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
