"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FiHome, FiSend, FiList, FiShoppingBag, FiGlobe, FiCode,
  FiBox, FiShield, FiBarChart2, FiSettings, FiLogOut, FiChevronLeft,
  FiChevronRight, FiZap, FiActivity,
} from "react-icons/fi";
import { useTheme } from "@/context/ThemeContext";

const NAV = [
  { section: "OVERVIEW", items: [
    { name: "Dashboard", href: "/dashboard", icon: FiHome },
  ]},
  { section: "PAYMENTS", items: [
    { name: "Send & Receive", href: "/dashboard/payments", icon: FiSend },
    { name: "Transactions", href: "/dashboard/transactions", icon: FiList },
  ]},
  { section: "MANAGEMENT", items: [
    { name: "Merchant POS", href: "/dashboard/merchant", icon: FiShoppingBag },
    { name: "Government", href: "/dashboard/government", icon: FiGlobe },
    { name: "Smart Contracts", href: "/dashboard/contracts", icon: FiCode },
    { name: "Login Audit", href: "/dashboard/login-audit", icon: FiActivity },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <aside className={`${collapsed ? "w-[72px]" : "w-64"} h-screen flex flex-col transition-all duration-300 flex-shrink-0 border-r ${
      isDark
        ? "bg-[#0A0F1E] border-slate-800/60"
        : "bg-white border-slate-200/80"
    }`}>
      {/* Logo */}
      <div className={`h-16 flex items-center px-4 border-b ${
        isDark ? "border-slate-800/60" : "border-slate-200/80"
      }`}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
          <FiZap className="text-white text-lg" />
        </div>
        {!collapsed && (
          <div className="ml-3">
            <h1 className={`font-bold text-lg leading-none ${isDark ? "text-white" : "text-slate-900"}`}>eRupeeX</h1>
            <p className={`text-[10px] tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>CBDC PLATFORM</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {NAV.map((group) => (
          <div key={group.section}>
            {!collapsed && (
              <p className={`text-[10px] font-semibold tracking-[0.15em] uppercase mb-2 px-3 ${
                isDark ? "text-slate-600" : "text-slate-400"
              }`}>
                {group.section}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${active
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : isDark
                          ? "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                      }
                    `}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className={`text-lg flex-shrink-0 ${active ? "text-blue-400" : ""}`} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className={`border-t p-3 space-y-2 ${isDark ? "border-slate-800/60" : "border-slate-200/80"}`}>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isDark
              ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
              : "text-slate-400 hover:text-red-500 hover:bg-red-50"
          }`}
          title={collapsed ? "Logout" : undefined}
        >
          <FiLogOut className="text-lg flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center justify-center w-full py-2 rounded-lg transition-all ${
            isDark
              ? "text-slate-600 hover:text-slate-400 hover:bg-white/5"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}
        >
          {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
