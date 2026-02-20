"use client";

import { useMemo } from "react";
import {
  FiTrendingUp, FiActivity, FiBarChart2,
  FiDollarSign, FiArrowUpRight, FiArrowDownLeft, FiRefreshCw,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";

export default function AnalyticsPage() {
  const { transactions, balance, locks, networkInfo, refreshAll, loading } = useWallet();

  const analytics = useMemo(() => {
    const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);
    const typeCounts: Record<string, number> = {};
    const typeVolumes: Record<string, number> = {};
    transactions.forEach(t => {
      typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
      typeVolumes[t.type] = (typeVolumes[t.type] || 0) + t.amount;
    });

    const avgTxAmount = transactions.length > 0 ? totalVolume / transactions.length : 0;
    const largestTx = transactions.length > 0 ? Math.max(...transactions.map(t => t.amount)) : 0;
    const smallestTx = transactions.length > 0 ? Math.min(...transactions.map(t => t.amount)) : 0;

    // Group by date
    const byDate: Record<string, number> = {};
    transactions.forEach(t => {
      const date = new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      byDate[date] = (byDate[date] || 0) + t.amount;
    });

    return { totalVolume, typeCounts, typeVolumes, avgTxAmount, largestTx, smallestTx, byDate };
  }, [transactions]);

  const typeColors: Record<string, string> = {
    MINT: '#10b981', TRANSFER: '#3b82f6', LOCK: '#f59e0b', RELEASE: '#8b5cf6',
  };

  const dateEntries = Object.entries(analytics.byDate);
  const maxDateVol = dateEntries.length > 0 ? Math.max(...dateEntries.map(([, v]) => v)) : 1;

  const typeEntries = Object.entries(analytics.typeCounts);
  const totalTxCount = transactions.length || 1;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real transaction analytics computed from your blockchain data</p>
        </div>
        <button onClick={() => refreshAll()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-300 text-sm hover:border-blue-500/40 transition-all">
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Key Metrics from real data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume', value: `₹${analytics.totalVolume.toLocaleString()}`, icon: <FiDollarSign size={16} />, color: 'text-blue-400' },
          { label: 'Transactions', value: transactions.length.toString(), icon: <FiActivity size={16} />, color: 'text-emerald-400' },
          { label: 'Avg Amount', value: `₹${Math.round(analytics.avgTxAmount).toLocaleString()}`, icon: <FiBarChart2 size={16} />, color: 'text-violet-400' },
          { label: 'Active Locks', value: locks.length.toString(), icon: <FiTrendingUp size={16} />, color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="card-hover p-4 stat-glow">
            <div className="flex items-center gap-2 mb-2">
              <span className={s.color}>{s.icon}</span>
              <span className="text-slate-500 text-xs uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-white text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-hover p-4 text-center">
          <p className="text-emerald-400 text-xl font-bold">₹{analytics.largestTx.toLocaleString()}</p>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">Largest Transaction</p>
        </div>
        <div className="card-hover p-4 text-center">
          <p className="text-blue-400 text-xl font-bold">₹{analytics.smallestTx.toLocaleString()}</p>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">Smallest Transaction</p>
        </div>
        <div className="card-hover p-4 text-center">
          <p className="text-white text-xl font-bold">₹{(balance?.total ?? 0).toLocaleString()}</p>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">Total Balance</p>
        </div>
        <div className="card-hover p-4 text-center">
          <p className="text-amber-400 text-xl font-bold">₹{(balance?.locked ?? 0).toLocaleString()}</p>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">Locked Amount</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Volume by Date Bar Chart */}
        <div className="lg:col-span-2 card-hover p-5">
          <h3 className="text-white font-semibold mb-5">Volume by Date</h3>
          {dateEntries.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-slate-500 text-sm">No transaction data yet</p>
            </div>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {dateEntries.slice(-10).map(([date, vol], i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full relative">
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400/70 bar-animate cursor-pointer hover:from-blue-500 hover:to-blue-300 transition-colors relative"
                      style={{ height: `${(vol / maxDateVol) * 180}px`, animationDelay: `${i * 0.1}s` }} />
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                      ₹{vol.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-slate-500 text-xs">{date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Type Distribution */}
        <div className="card-hover p-5">
          <h3 className="text-white font-semibold mb-5">Transaction Types</h3>
          {typeEntries.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-slate-500 text-sm">No data</p>
            </div>
          ) : (
            <>
              {/* Donut Chart */}
              <div className="w-40 h-40 mx-auto relative mb-6">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3.5" />
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
                  <p className="text-white text-lg font-bold">{transactions.length}</p>
                  <p className="text-slate-500 text-[9px]">TOTAL</p>
                </div>
              </div>
              {/* Legend */}
              <div className="space-y-2">
                {typeEntries.map(([type, count], i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeColors[type] || '#64748b' }} />
                      <span className="text-slate-400 text-xs">{type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-semibold">{count}</span>
                      <span className="text-slate-500 text-[10px]">({Math.round(count / totalTxCount * 100)}%)</span>
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
        <h3 className="text-white font-semibold mb-4">Volume by Transaction Type</h3>
        {typeEntries.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No data available. Make some transactions to see analytics.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(analytics.typeVolumes).map(([type, vol], i) => {
              const pct = analytics.totalVolume > 0 ? (vol / analytics.totalVolume) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeColors[type] || '#64748b' }} />
                      <span className="text-slate-400">{type}</span>
                    </div>
                    <span className="text-white font-medium">₹{vol.toLocaleString()} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-2">
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
          <h3 className="text-white font-semibold">Network Status</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">LIVE</span>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Block Height', value: networkInfo ? `#${networkInfo.blockNumber}` : '—' },
            { label: 'Chain ID', value: networkInfo ? networkInfo.chainId.toString() : '—' },
            { label: 'Gas Price', value: networkInfo ? `${networkInfo.gasPrice} Gwei` : '—' },
            { label: 'Network', value: 'Hardhat Local' },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-800/40 text-center">
              <p className="text-white text-lg font-bold font-mono">{item.value}</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
