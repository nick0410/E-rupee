"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiUser, FiMail, FiPhone, FiLock, FiMapPin, FiCreditCard, FiEye, FiEyeOff, FiChevronDown } from "react-icons/fi";
import { api } from "@/lib/api";

function isPanValid(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", state: "", pan: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: field === "pan" ? e.target.value.toUpperCase() : e.target.value }));

  const filteredStates = INDIAN_STATES.filter(s =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.state) {
      setError("Please select your state");
      return;
    }

    if (!isPanValid(form.pan)) {
      setError("Invalid PAN format. Use: ABCDE1234F");
      return;
    }

    setLoading(true);
    try {
      const res = await api.register(form);
      if (res.user) {
        localStorage.setItem("userId", String(res.user.id));
        localStorage.setItem("user", JSON.stringify(res.user));
        setShowSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "name",     icon: FiUser,       label: "Full Name",    type: "text",  delay: "delay-300" },
    { key: "email",    icon: FiMail,       label: "Email",        type: "email", delay: "delay-300" },
    { key: "phone",    icon: FiPhone,      label: "Phone Number", type: "tel",   delay: "delay-400" },
    { key: "password", icon: FiLock,       label: "Password",     type: "password", delay: "delay-400" },
    { key: "pan",      icon: FiCreditCard, label: "PAN Number",   type: "text",  delay: "delay-600" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#1E3A8A] via-[#3B82F6] to-[#60A5FA] px-8 pt-10 pb-8">
      {/* Logo */}
      <div className="animate-bounce-in">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-white to-[#F0F9FF] shadow-[0_0_40px_rgba(96,165,250,0.5)]">
          <span className="text-[#1E3A8A] text-4xl font-bold select-none">e₹</span>
        </div>
      </div>

      <div className="h-6" />

      {/* Title */}
      <div className="animate-slide-up delay-200 text-center">
        <h1 className="text-white text-3xl md:text-4xl font-bold">Create Account</h1>
        <p className="text-white/80 mt-2">Sign up to get started</p>
      </div>

      <div className="h-8" />

      {/* Form */}
      <form onSubmit={handleSignup} className="w-full max-w-md space-y-4">
        {fields.filter(f => f.key !== "pan").map(({ key, icon: Icon, label, type, delay }) => (
          <div key={key} className={`animate-slide-up ${delay}`}>
            <div className="relative">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A8A] text-lg" />
              <input
                type={key === "password" ? (showPassword ? "text" : "password") : type}
                value={form[key as keyof typeof form]}
                onChange={update(key)}
                placeholder={label}
                required
                className="w-full h-14 pl-12 pr-12 bg-white rounded-2xl text-gray-800 placeholder:text-gray-400 shadow-[0_8px_30px_rgba(255,255,255,0.15)] focus:ring-2 focus:ring-[#60A5FA] transition-all"
              />
              {key === "password" && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* State Dropdown */}
        <div className={`animate-slide-up delay-500 relative ${stateOpen ? "z-50" : "z-0"}`}>
          <div className="relative">
            <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A8A] text-lg z-10" />
            <button
              type="button"
              onClick={() => setStateOpen(!stateOpen)}
              className={`w-full h-14 pl-12 pr-12 bg-white rounded-2xl text-left shadow-[0_8px_30px_rgba(255,255,255,0.15)] transition-all ${
                form.state ? "text-gray-800" : "text-gray-400"
              } ${stateOpen ? "ring-2 ring-[#60A5FA]" : ""}`}
            >
              {form.state || "Select State"}
            </button>
            <FiChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 ${stateOpen ? "rotate-180" : ""}`} size={20} />
          </div>

          {/* Dropdown Panel */}
          {stateOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-blue-100 overflow-hidden animate-scale-in">
              {/* Search */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    value={stateSearch}
                    onChange={e => setStateSearch(e.target.value)}
                    placeholder="Search state..."
                    autoFocus
                    className="w-full h-10 pl-9 pr-4 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#60A5FA] transition-all"
                  />
                </div>
              </div>
              {/* Options */}
              <div className="max-h-52 overflow-y-auto">
                {filteredStates.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No states found</p>
                ) : (
                  filteredStates.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, state: s }));
                        setStateOpen(false);
                        setStateSearch("");
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-all hover:bg-blue-50 flex items-center gap-3 ${
                        form.state === s ? "bg-blue-50 text-[#1E3A8A] font-semibold" : "text-gray-700"
                      }`}
                    >
                      <FiMapPin className={`flex-shrink-0 ${form.state === s ? "text-[#1E3A8A]" : "text-gray-300"}`} size={14} />
                      {s}
                      {form.state === s && (
                        <svg className="w-4 h-4 text-[#1E3A8A] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* PAN Field */}
        {fields.filter(f => f.key === "pan").map(({ key, icon: Icon, label, type, delay }) => (
          <div key={key} className={`animate-slide-up ${delay}`}>
            <div className="relative">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A8A] text-lg" />
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={update(key)}
                placeholder={label}
                required
                className="w-full h-14 pl-12 pr-12 bg-white rounded-2xl text-gray-800 placeholder:text-gray-400 shadow-[0_8px_30px_rgba(255,255,255,0.15)] focus:ring-2 focus:ring-[#60A5FA] transition-all"
              />
            </div>
            <p className="text-white/70 text-xs mt-1 ml-1">Format: ABCDE1234F</p>
          </div>
        ))}

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-white text-sm text-center">
            {error}
          </div>
        )}

        {/* Sign Up Button */}
        <div className="animate-slide-up delay-600">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-white text-[#1E3A8A] font-bold text-lg rounded-2xl shadow-[0_12px_40px_rgba(255,255,255,0.2)] hover:shadow-[0_16px_50px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-6 h-6 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
            ) : (
              "Sign Up"
            )}
          </button>
        </div>
      </form>

      <div className="h-6" />

      {/* Login Link */}
      <p className="animate-fade-in delay-700 text-white/80">
        Already have an account?{" "}
        <Link href="/login" className="text-white font-bold hover:underline">
          Login
        </Link>
      </p>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-scale-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1E3A8A] mb-2">Verification Successful</h2>
            <p className="text-gray-600 mb-6">Your account has been successfully verified.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full h-12 bg-[#1E3A8A] text-white font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
