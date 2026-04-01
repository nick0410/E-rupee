"use client";

import { useMemo, useState } from "react";
import {
  FiTrendingUp, FiActivity, FiBarChart2,
  FiDollarSign, FiRefreshCw,
  FiTarget,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { useTheme } from "@/context/ThemeContext";
import {
  buildExpenseTrackerPlan,
  deriveFinancialSignals,
} from "@/lib/financeModels";

const MAX_ANALYTICS_TX_AMOUNT = 100000000;

export default function AnalyticsPage() {
  const { transactions, balance, locks, networkInfo, refreshAll, loading } = useWallet();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const availableAmount = parseFloat(String(balance?.available ?? 0)) || 0;
  const lockedAmount = parseFloat(String(balance?.locked ?? 0)) || 0;
  const totalBalance = availableAmount + lockedAmount;
  const [goalAmount, setGoalAmount] = useState("120000");
  const [goalMonths, setGoalMonths] = useState("12");

  const normalizeType = (type?: string) => {
    const normalized = (type || "UNKNOWN").toUpperCase();
    if (normalized === "TRANSFER") return "TRANSFER_OUT";
    if (normalized === "RECEIVE") return "TRANSFER_IN";
    if (normalized === "SUBSIDY") return "DISBURSE";
    return normalized;
  };

  const typeLabel = (type: string) => type.replace(/_/g, " ");

  const analytics = useMemo(() => {
    const normalizedTxs = transactions
      .map((tx) => ({
        ...tx,
        amount: Number(tx.amount) || 0,
        type: normalizeType(tx.type),
      }))
      .filter((tx) => Number.isFinite(tx.amount) && Math.abs(tx.amount) <= MAX_ANALYTICS_TX_AMOUNT);

    const totalVolume = normalizedTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const typeCounts: Record<string, number> = {};
    const typeVolumes: Record<string, number> = {};
    normalizedTxs.forEach((tx) => {
      typeCounts[tx.type] = (typeCounts[tx.type] || 0) + 1;
      typeVolumes[tx.type] = (typeVolumes[tx.type] || 0) + Math.abs(tx.amount);
    });

    const avgTxAmount = normalizedTxs.length > 0 ? totalVolume / normalizedTxs.length : 0;
    const txAmounts = normalizedTxs.map((tx) => Math.abs(tx.amount));
    const largestTx = txAmounts.length > 0 ? Math.max(...txAmounts) : 0;
    const smallestTx = txAmounts.length > 0 ? Math.min(...txAmounts) : 0;

    const byDateKey: Record<string, number> = {};
    normalizedTxs.forEach((tx) => {
      const d = new Date(tx.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const dateKey = d.toISOString().slice(0, 10);
      byDateKey[dateKey] = (byDateKey[dateKey] || 0) + Math.abs(tx.amount);
    });

    const byDate = Object.entries(byDateKey)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, volume]) => ({
        key: dateKey,
        label: new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        volume,
      }));

    return {
      totalVolume,
      typeCounts,
      typeVolumes,
      avgTxAmount,
      largestTx,
      smallestTx,
      byDate,
      totalTxCount: normalizedTxs.length,
      normalizedTxs,
    };
  }, [transactions]);

  const typeColors: Record<string, string> = {
    MINT: '#10b981',
    DISBURSE: '#14b8a6',
    MERCHANT_POS: '#8b5cf6',
    TRANSFER_IN: '#3b82f6',
    TRANSFER_OUT: '#f97316',
    LOCK: '#f59e0b',
    RELEASE: '#8b5cf6',
    INTEREST_CREDIT: '#22c55e',
  };

  const dateEntries = analytics.byDate;
  const maxDateVol = dateEntries.length > 0 ? Math.max(...dateEntries.map((entry) => entry.volume)) : 1;
  const typeEntries = Object.entries(analytics.typeCounts);
  const totalTxCount = analytics.totalTxCount || 1;

  const parsedGoalAmount = Math.max(0, Number(goalAmount) || 0);
  const parsedGoalMonths = Math.min(120, Math.max(1, Number(goalMonths) || 1));

  const financialSignals = useMemo(
    () => deriveFinancialSignals(analytics.normalizedTxs),
    [analytics.normalizedTxs],
  );

  const expensePlan = useMemo(
    () => buildExpenseTrackerPlan(financialSignals, parsedGoalAmount, parsedGoalMonths, lockedAmount),
    [financialSignals, parsedGoalAmount, parsedGoalMonths, lockedAmount],
  );

  const goalProgress = expensePlan.goalAmount > 0
    ? Math.min(100, (expensePlan.projectedSavings / expensePlan.goalAmount) * 100)
    : 0;

  const metricCards = [
    { label: 'Total Volume', value: `₹${analytics.totalVolume.toLocaleString()}`, icon: <FiDollarSign size={16} />, color: 'text-blue-500' },
    { label: 'Transactions', value: analytics.totalTxCount.toString(), icon: <FiActivity size={16} />, color: 'text-emerald-500' },
    { label: 'Avg Amount', value: `₹${Math.round(analytics.avgTxAmount).toLocaleString()}`, icon: <FiBarChart2 size={16} />, color: 'text-violet-500' },
    { label: 'Active Locks', value: locks.length.toString(), icon: <FiTrendingUp size={16} />, color: 'text-amber-500' },
  ];

  const detailCards = [
    { value: `₹${analytics.largestTx.toLocaleString()}`, label: 'Largest Transaction', cls: 'text-emerald-500' },
    { value: `₹${analytics.smallestTx.toLocaleString()}`, label: 'Smallest Transaction', cls: 'text-blue-500' },
    { value: `₹${totalBalance.toLocaleString()}`, label: 'Total Balance', cls: isDark ? 'text-white' : 'text-slate-900' },
    { value: `₹${lockedAmount.toLocaleString()}`, label: 'Locked Amount', cls: 'text-amber-500' },
  ];

  const networkCards = [
    { label: 'Block Height', value: networkInfo ? `#${networkInfo.blockNumber}` : '—' },
    { label: 'Chain ID', value: networkInfo ? networkInfo.chainId.toString() : '—' },
    { label: 'Gas Price', value: networkInfo ? `${networkInfo.gasPrice} Gwei` : '—' },
    { label: 'Network', value: 'Hardhat Local' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Analytics</h1>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Real transaction analytics computed from your blockchain data</p>
        </div>
        <button
          onClick={() => refreshAll()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${isDark ? "bg-slate-800/60 border-slate-700/40 text-slate-300 hover:border-blue-500/40" : "bg-white border-slate-200 text-slate-600 hover:border-blue-400/40 shadow-sm"
            }`}
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* 1) Expense Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-hover p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                <FiTarget className="text-blue-500" /> Expense Tracker
              </h3>
              <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Set your saving target and get a simple monthly execution plan.
              </p>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full border ${isDark ? "text-slate-300 border-slate-700" : "text-slate-600 border-slate-200"}`}>
              Simple Goal Model
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label className="space-y-1">
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Target Savings (Rs)</span>
              <input
                type="number"
                min={0}
                step={500}
                value={goalAmount}
                onChange={(event) => setGoalAmount(event.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-blue-500/60 ${isDark ? "bg-slate-800/60 border-slate-700/40 text-white" : "bg-white border-slate-200 text-slate-900"}`}
              />
            </label>
            <label className="space-y-1">
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Timeline (months)</span>
              <input
                type="number"
                min={1}
                max={120}
                value={goalMonths}
                onChange={(event) => setGoalMonths(event.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-blue-500/60 ${isDark ? "bg-slate-800/60 border-slate-700/40 text-white" : "bg-white border-slate-200 text-slate-900"}`}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`rounded-xl p-3 border ${isDark ? "bg-slate-800/30 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Need Per Month</p>
              <p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>₹{Math.round(expensePlan.requiredMonthlySaving).toLocaleString("en-IN")}</p>
            </div>
            <div className={`rounded-xl p-3 border ${isDark ? "bg-slate-800/30 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Projected by Goal</p>
              <p className="text-lg font-bold text-emerald-500">₹{Math.round(expensePlan.projectedSavings).toLocaleString("en-IN")}</p>
            </div>
            <div className={`rounded-xl p-3 border ${isDark ? "bg-slate-800/30 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Success Odds</p>
              <p className="text-lg font-bold text-blue-500">{expensePlan.achievementProbability}%</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Projected goal progress</span>
              <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{goalProgress.toFixed(0)}%</span>
            </div>
            <div className={`h-2 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500" style={{ width: `${goalProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="card-hover p-5">
          <h3 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>How To Achieve</h3>
          <div className="space-y-2">
            {expensePlan.actions.map((action, index) => (
              <div key={index} className={`p-2.5 rounded-lg border text-xs ${isDark ? "border-slate-700/40 bg-slate-900/30 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                {index + 1}. {action}
              </div>
            ))}
          </div>
          <div className={`mt-3 p-3 rounded-lg border ${isDark ? "border-amber-500/30 bg-amber-500/10" : "border-amber-200 bg-amber-50"}`}>
            <p className="text-amber-500 text-xs font-semibold">Monthly Gap</p>
            <p className={`text-sm mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>
              ₹{Math.round(expensePlan.monthlyGap).toLocaleString("en-IN")}
            </p>
            <p className={`text-[11px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Suggested cut: ₹{Math.round(expensePlan.recommendedCuts).toLocaleString("en-IN")},
              extra income target: ₹{Math.round(expensePlan.recommendedExtraIncome).toLocaleString("en-IN")}.
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((s, i) => (
          <div key={i} className="card-hover p-4 stat-glow">
            <div className="flex items-center gap-2 mb-2">
              <span className={s.color}>{s.icon}</span>
              <span className={`text-xs uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {detailCards.map((c, i) => (
          <div key={i} className="card-hover p-4 text-center">
            <p className={`text-xl font-bold ${c.cls}`}>{c.value}</p>
            <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Volume by Date Bar Chart */}
        <div className="lg:col-span-2 card-hover p-5">
          <h3 className={`font-semibold mb-5 ${isDark ? "text-white" : "text-slate-900"}`}>Volume by Date</h3>
          {dateEntries.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No transaction data yet</p>
            </div>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {dateEntries.slice(-10).map((entry, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full relative">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400/70 bar-animate cursor-pointer hover:from-blue-500 hover:to-blue-300 transition-colors relative"
                      style={{ height: `${(entry.volume / maxDateVol) * 180}px`, animationDelay: `${i * 0.1}s` }}
                    />
                    {/* Tooltip */}
                    <div className={`absolute -top-9 left-1/2 -translate-x-1/2 border rounded-lg px-3 py-1.5 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                      }`}>
                      ₹{entry.volume.toLocaleString()}
                    </div>
                  </div>
                  <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{entry.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Type Distribution */}
        <div className="card-hover p-5">
          <h3 className={`font-semibold mb-5 ${isDark ? "text-white" : "text-slate-900"}`}>Transaction Types</h3>
          {typeEntries.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No data</p>
            </div>
          ) : (
            <>
              {/* Donut Chart */}
              <div className="w-40 h-40 mx-auto relative mb-6">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeWidth="3.5" />
                  {(() => {
                    let offset = 0;
                    return typeEntries.map(([type, count], i) => {
                      const pct = (count / totalTxCount) * 100;
                      const el = (
                        <circle key={i} cx="18" cy="18" r="14" fill="none"
                          stroke={typeColors[type] || '#64748b'} strokeWidth="3.5"
                          strokeDasharray={`${pct * 0.88} ${88 - pct * 0.88}`}
                          strokeDashoffset={`${-offset * 0.88}`} />
                      );
                      offset += pct;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{analytics.totalTxCount}</p>
                  <p className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>TOTAL</p>
                </div>
              </div>
              {/* Legend */}
              <div className="space-y-2">
                {typeEntries.map(([type, count], i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeColors[type] || '#64748b' }} />
                      <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{typeLabel(type)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{count}</span>
                      <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>({Math.round(count / totalTxCount * 100)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Volume by Type */}
      <div className="card-hover p-5">
        <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Volume by Transaction Type</h3>
        {typeEntries.length === 0 ? (
          <p className={`text-sm text-center py-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}>No data available. Make some transactions to see analytics.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(analytics.typeVolumes)
              .sort((a, b) => b[1] - a[1])
              .map(([type, vol], i) => {
              const pct = analytics.totalVolume > 0 ? (vol / analytics.totalVolume) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeColors[type] || '#64748b' }} />
                      <span className={isDark ? "text-slate-400" : "text-slate-500"}>{typeLabel(type)}</span>
                    </div>
                    <span className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>₹{vol.toLocaleString()} ({Math.round(pct)}%)</span>
                  </div>
                  <div className={`w-full rounded-full h-2 ${isDark ? "bg-slate-800/80" : "bg-slate-200"}`}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: typeColors[type] || '#64748b' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Network Stats */}
      <div className="card-hover p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Network Status</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 text-xs font-medium">LIVE</span>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {networkCards.map((item, i) => (
            <div key={i} className={`p-3 rounded-xl text-center ${isDark ? "bg-slate-800/40" : "bg-slate-50"}`}>
              <p className={`text-lg font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>{item.value}</p>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
