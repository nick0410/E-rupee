"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiSend, FiDownload, FiLock, FiDollarSign, FiActivity,
  FiRefreshCw, FiArrowUpRight, FiArrowDownLeft, FiClock,
  FiShield, FiBox, FiBarChart2,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { formatINR } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export default function DashboardPage() {
  const { user, balance, locks, transactions, networkInfo, loading, refreshAll, lastRefresh } = useWallet();
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setTimeout(() => setRefreshing(false), 500);
  };

  const bal = balance ? parseFloat(balance.balance) : 0;
  const avail = balance ? parseFloat(balance.available) : 0;
  const locked = balance ? parseFloat(balance.locked) : 0;

  const quickActions = [
    { label: "Send Money", desc: "P2P transfer to any wallet", href: "/dashboard/payments/send", icon: FiSend, color: "from-blue-600 to-blue-500" },
    { label: "Receive", desc: "Generate QR / share address", href: "/dashboard/payments/receive", icon: FiDownload, color: "from-emerald-600 to-emerald-500" },
    { label: "Mint Tokens", desc: "Issue new eINR from RBI", href: "/dashboard/payments/mint", icon: FiDollarSign, color: "from-green-600 to-green-500" },
    { label: "Lock Tokens", desc: "Time-lock for FD / escrow", href: "/dashboard/payments/lock", icon: FiLock, color: "from-amber-600 to-amber-500" },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Welcome, {user?.name || "User"} 👋
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {balance?.address ? `Wallet: ${balance.address.slice(0, 8)}...${balance.address.slice(-6)}` : "Loading wallet..."}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${isDark
              ? "bg-slate-800/60 border-slate-700/30 text-slate-300 hover:text-white hover:bg-slate-800"
              : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm"
            }`}
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={14} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-hover p-6 stat-glow border-l-4 border-l-blue-500">
          <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Total Balance</p>
          <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{loading ? "..." : formatINR(bal)}</p>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>On-chain eINR balance</p>
        </div>
        <div className="card-hover p-6 stat-glow border-l-4 border-l-emerald-500">
          <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Available</p>
          <p className="text-emerald-500 text-3xl font-bold">{loading ? "..." : formatINR(avail)}</p>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>Ready to spend or transfer</p>
        </div>
        <div className="card-hover p-6 stat-glow border-l-4 border-l-amber-500">
          <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Locked</p>
          <p className="text-amber-500 text-3xl font-bold">{loading ? "..." : formatINR(locked)}</p>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{locks.length} active lock{locks.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}
              className="card-hover p-5 group flex flex-col gap-3 hover:border-blue-500/30 transition-all">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <action.icon className="text-white" size={20} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{action.label}</p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Transactions + Locks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="card-hover p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Recent Transactions</h3>
            <Link href="/dashboard/transactions" className="text-blue-500 text-xs hover:underline">View All →</Link>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <FiActivity className={`mx-auto mb-2 ${isDark ? "text-slate-700" : "text-slate-300"}`} size={32} />
              <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No transactions yet</p>
              <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>Mint some eINR to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isDark
                      ? "bg-slate-800/30 border-slate-700/20"
                      : "bg-slate-50 border-slate-200/60"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.type === 'MINT' ? 'bg-green-500/15 text-green-500' :
                        tx.type === 'LOCK' ? 'bg-amber-500/15 text-amber-500' :
                          tx.fromAddress === balance?.address ? 'bg-red-500/15 text-red-500' :
                            'bg-emerald-500/15 text-emerald-500'
                      }`}>
                      {tx.type === 'MINT' ? <FiDollarSign size={16} /> :
                        tx.type === 'LOCK' ? <FiLock size={16} /> :
                          tx.fromAddress === balance?.address ? <FiArrowUpRight size={16} /> :
                            <FiArrowDownLeft size={16} />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{tx.type}</p>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{tx.note || (tx.toAddress ? tx.toAddress.slice(0, 12) + "..." : "—")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'MINT' || tx.toAddress === balance?.address ? 'text-emerald-500' : (isDark ? 'text-white' : 'text-slate-900')}`}>
                      {tx.type === 'MINT' || tx.toAddress === balance?.address ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </p>
                    <p className={`text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                      {new Date(tx.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Locks */}
        <div className="card-hover p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Active Locks</h3>
            <Link href="/dashboard/payments/lock" className="text-blue-500 text-xs hover:underline">New Lock →</Link>
          </div>
          {locks.length === 0 ? (
            <div className="text-center py-8">
              <FiLock className={`mx-auto mb-2 ${isDark ? "text-slate-700" : "text-slate-300"}`} size={32} />
              <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No active locks</p>
              <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>Lock tokens for FD-like returns</p>
            </div>
          ) : (
            <div className="space-y-2">
              {locks.map((lock, i) => {
                const unlockDate = new Date(lock.unlockTime * 1000);
                const isExpired = Date.now() > lock.unlockTime * 1000;
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border ${isDark
                        ? "bg-slate-800/30 border-slate-700/20"
                        : "bg-slate-50 border-slate-200/60"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>₹{parseFloat(lock.amount).toLocaleString('en-IN')}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isExpired ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}`}>
                        {isExpired ? 'UNLOCKABLE' : 'LOCKED'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      <FiClock size={10} />
                      <span>Unlocks: {unlockDate.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {lock.documentCID && <p className={`text-[10px] mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>Doc: {lock.documentCID.slice(0, 20)}...</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="card-hover p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500 text-xs font-medium">LIVE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FiBox className={isDark ? "text-slate-500" : "text-slate-400"} size={12} />
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Block: #{networkInfo?.blockNumber || "..."}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FiShield className={isDark ? "text-slate-500" : "text-slate-400"} size={12} />
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Chain: {networkInfo?.chainId || "..."}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FiActivity className={isDark ? "text-slate-500" : "text-slate-400"} size={12} />
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Gas: {networkInfo?.gasPrice || "..."} Gwei</span>
            </div>
          </div>
          <p className={`text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>
            Last refresh: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString('en-IN') : "never"}
          </p>
        </div>
      </div>
    </div>
  );
}
