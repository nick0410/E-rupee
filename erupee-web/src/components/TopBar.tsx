"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FiSearch, FiBell, FiUser, FiChevronRight, FiCamera, FiTrash2, FiBox, FiBarChart2, FiPieChart, FiSettings, FiActivity } from "react-icons/fi";
import BlockchainIcon from "./BlockchainIcon";
import { useTheme } from "@/context/ThemeContext";
import { clearPaymentAlerts, getPaymentAlerts, requestNotificationPermission, subscribePaymentAlerts, type PaymentAlert } from "@/lib/paymentNotifications";

const SYSTEM_MENU = [
  { name: "Blockchain", href: "/dashboard/blockchain", icon: FiBox },
  { name: "Analytics", href: "/dashboard/analytics", icon: FiBarChart2 },
  { name: "Investments", href: "/dashboard/investments", icon: FiPieChart },
  { name: "Login Audit", href: "/dashboard/login-audit", icon: FiActivity },
  { name: "Settings", href: "/dashboard/settings", icon: FiSettings },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/payments": "Payments",
  "/dashboard/transactions": "Transactions",
  "/dashboard/merchant": "Merchant POS",
  "/dashboard/government": "Government & Subsidies",
  "/dashboard/contracts": "Smart Contracts",
  "/dashboard/blockchain": "Blockchain Explorer",
  "/dashboard/analytics": "Analytics",
  "/dashboard/investments": "Investments",
  "/dashboard/login-audit": "Login Audit",
  "/dashboard/settings": "Settings",
};

export default function TopBar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [paymentAlerts, setPaymentAlerts] = useState<PaymentAlert[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const systemMenuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Load saved profile image
  useEffect(() => {
    const saved = localStorage.getItem("profileImg");
    if (saved) setProfileImg(saved);
  }, []);

  useEffect(() => {
    setPaymentAlerts(getPaymentAlerts());

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission("unsupported");
    }

    return subscribePaymentAlerts(() => setPaymentAlerts(getPaymentAlerts()));
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (systemMenuRef.current && !systemMenuRef.current.contains(e.target as Node)) setShowSystemMenu(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Resize to 128x128 thumbnail to stay within localStorage quota
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        // Crop to square from center
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        const compressed = canvas.toDataURL("image/jpeg", 0.8);
        setProfileImg(compressed);
        localStorage.setItem("profileImg", compressed);
        setShowMenu(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfileImg(null);
    localStorage.removeItem("profileImg");
    setShowMenu(false);
  };

  const handleBellClick = async () => {
    if (notificationPermission !== "granted") {
      const permission = await requestNotificationPermission();
      if (permission) setNotificationPermission(permission);
    }
    setShowNotifications((prev) => !prev);
  };

  const title = PAGE_TITLES[pathname] || "Dashboard";
  const crumbs = pathname.split("/").filter(Boolean);

  return (
    <header className={`h-16 backdrop-blur-xl border-b flex items-center justify-between px-6 flex-shrink-0 relative z-50 transition-colors duration-400 ${
      isDark
        ? "bg-[#0A0F1E]/80 border-slate-800/60"
        : "bg-white/80 border-slate-200/80"
    }`}>
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2">
        <nav className="flex items-center gap-1 text-sm">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <FiChevronRight className="text-slate-600 text-xs" />}
              <span className={i === crumbs.length - 1
                ? (isDark ? "text-white font-medium" : "text-slate-900 font-medium")
                : (isDark ? "text-slate-500" : "text-slate-400")
              }>
                {crumb.charAt(0).toUpperCase() + crumb.slice(1)}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Search + Notifications + User */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
          <input
            type="text"
            placeholder="Search transactions, wallets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-64 h-9 pl-9 pr-4 rounded-lg text-sm transition-all outline-none ${
              isDark
                ? "bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                : "bg-slate-100/80 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30"
            }`}
          />
        </div>

        {/* Blockchain / System Menu Icon */}
        <div className="relative" ref={systemMenuRef}>
          <button
            onClick={() => setShowSystemMenu(!showSystemMenu)}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
            title="System"
          >
            <BlockchainIcon size={40} />
          </button>

          {showSystemMenu && (
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setShowSystemMenu(false)} />
              <div className={`absolute right-0 top-12 w-56 border rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden z-[9999] transition-colors duration-400 ${
                isDark
                  ? "bg-[#0A0F1E] border-slate-700/60"
                  : "bg-white border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
              }`}>
                <p className={`text-[10px] font-semibold tracking-[0.15em] uppercase px-4 pt-3 pb-1 ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}>SYSTEM</p>
                {SYSTEM_MENU.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowSystemMenu(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-blue-500/10 text-blue-400"
                          : isDark
                            ? "text-slate-400 hover:text-white hover:bg-white/5"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <item.icon className={`text-base flex-shrink-0 ${active ? "text-blue-400" : ""}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Dark / Light Mode Toggle — organic leaf-shaped switch */}
        <button
          onClick={toggleTheme}
          className={`relative w-[52px] h-7 rounded-full transition-all duration-500 ease-in-out focus:outline-none group ${
            isDark
              ? "bg-gradient-to-r from-indigo-900/80 to-slate-800 shadow-inner shadow-indigo-950/40 border border-slate-700/50"
              : "bg-gradient-to-r from-amber-200 to-sky-200 shadow-inner shadow-amber-100/40 border border-amber-300/50"
          }`}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {/* Sliding knob */}
          <span
            className={`absolute top-[3px] w-[22px] h-[22px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.68,-0.4,0.32,1.4)] flex items-center justify-center shadow-lg ${
              isDark
                ? "left-[3px] bg-gradient-to-br from-indigo-400 to-violet-500 shadow-indigo-500/30"
                : "left-[25px] bg-gradient-to-br from-amber-400 to-orange-400 shadow-amber-400/40"
            }`}
          >
            {/* Moon icon (dark) */}
            <svg
              className={`w-3 h-3 text-white transition-all duration-300 absolute ${
                isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
              }`}
              fill="currentColor" viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
            {/* Sun icon (light) */}
            <svg
              className={`w-3.5 h-3.5 text-white transition-all duration-300 absolute ${
                isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
              }`}
              fill="currentColor" viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          </span>
          {/* Tiny floating particles for organic feel */}
          <span className={`absolute w-1 h-1 rounded-full transition-all duration-700 ${
            isDark
              ? "bg-indigo-400/40 top-1 right-3"
              : "bg-amber-400/50 top-1.5 left-2"
          }`} />
          <span className={`absolute w-0.5 h-0.5 rounded-full transition-all duration-700 ${
            isDark
              ? "bg-violet-300/30 bottom-1.5 right-5"
              : "bg-orange-300/40 bottom-1 left-4"
          }`} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={handleBellClick}
            className={`relative w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${
              isDark
                ? "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600"
                : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-sm"
            }`}
            title="Payment notifications"
          >
            <FiBell size={16} />
            {paymentAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {paymentAlerts.length > 9 ? "9+" : paymentAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 top-11 w-80 rounded-xl border p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${
              isDark ? "bg-[#0A0F1E] border-slate-700/60" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-semibold tracking-wide ${isDark ? "text-slate-300" : "text-slate-700"}`}>Payment Alerts</p>
                {paymentAlerts.length > 0 && (
                  <button
                    onClick={clearPaymentAlerts}
                    className={`text-[11px] ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Clear
                  </button>
                )}
              </div>

              {notificationPermission !== "granted" && (
                <p className={`text-[11px] mb-2 ${isDark ? "text-amber-300" : "text-amber-600"}`}>
                  Allow browser notification permission to get payment message + tune.
                </p>
              )}

              {paymentAlerts.length === 0 ? (
                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>No payment received alerts yet.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-auto pr-1">
                  {paymentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`rounded-lg p-2 border ${isDark ? "border-slate-700/50 bg-slate-900/40" : "border-slate-200 bg-slate-50"}`}
                    >
                      <p className={`text-xs font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{alert.message}</p>
                      <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>{new Date(alert.createdAt).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Image */}
        <div className="relative" ref={menuRef}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center cursor-pointer hover:opacity-90 transition-all ring-2 overflow-hidden ${
              isDark
                ? "ring-slate-700 hover:ring-blue-500/50"
                : "ring-slate-200 hover:ring-blue-400/50"
            }`}
          >
            {profileImg ? (
              <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <FiUser className="text-white text-lg" />
            )}
          </button>

          {/* Mini menu — rendered as fixed overlay so nothing can hide it */}
          {showMenu && (
            <>
              {/* Invisible backdrop to catch clicks outside */}
              <div className="fixed inset-0 z-[9998]" onClick={() => setShowMenu(false)} />
              <div className={`fixed right-4 top-14 w-48 border rounded-xl overflow-hidden z-[9999] transition-colors duration-400 ${
                isDark
                  ? "bg-[#141B2D] border-slate-700/60 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                  : "bg-white border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.1)]"
              }`}>
                <button
                  onClick={() => { fileRef.current?.click(); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                    isDark
                      ? "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <FiCamera size={15} />
                  {profileImg ? "Change Photo" : "Upload Photo"}
                </button>
                {profileImg && (
                  <button
                    onClick={removeImage}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border-t border-slate-700/20"
                  >
                    <FiTrash2 size={15} />
                    Remove Photo
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
