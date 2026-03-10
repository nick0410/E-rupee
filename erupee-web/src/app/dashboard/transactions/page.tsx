"use client";

import { useState } from "react";
import {
  FiSearch, FiDownload, FiCheck, FiX, FiCopy,
  FiArrowUpRight, FiArrowDownLeft, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiInbox,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { useTheme } from "@/context/ThemeContext";
import { shortHash } from "@/lib/utils";
import type { DbTransaction } from "@/lib/api";

export default function TransactionsPage() {
  const { user, balance, transactions, refreshTransactions, loading } = useWallet();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<DbTransaction | null>(null);
  const [copied, setCopied] = useState(false);
  const perPage = 10;

  const address = balance?.address || user?.walletAddress || "";

  const filtered = transactions.filter(tx => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (tx.fromAddress?.toLowerCase().includes(q)) ||
        (tx.toAddress?.toLowerCase().includes(q)) ||
        (tx.txHash?.toLowerCase().includes(q)) ||
        (tx.note?.toLowerCase().includes(q)) ||
        (tx.type?.toLowerCase().includes(q));
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const types = [...new Set(transactions.map(t => t.type))];
  const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);

  const isIncoming = (tx: DbTransaction) => {
    return tx.type === 'MINT' || tx.type === 'SUBSIDY' || tx.type === 'RECEIVE' ||
      (tx.toAddress?.toLowerCase() === address.toLowerCase());
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeColor = (type: string) => {
    const map: Record<string, string> = {
      MINT: 'bg-emerald-500/15 text-emerald-500',
      TRANSFER: 'bg-blue-500/15 text-blue-500',
      LOCK: 'bg-amber-500/15 text-amber-500',
      RELEASE: 'bg-purple-500/15 text-purple-500',
      SUBSIDY: 'bg-cyan-500/15 text-cyan-500',
    };
    return map[type] || 'bg-slate-500/15 text-slate-500';
  };

  const btnCls = `flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${isDark
      ? "bg-slate-800/60 border-slate-700/40 text-slate-300 hover:border-blue-500/40"
      : "bg-white border-slate-200 text-slate-600 hover:border-blue-400/40 shadow-sm"
    }`;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Transaction Ledger</h1>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Real blockchain transaction history</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refreshTransactions()} className={btnCls}>
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => {
              const csv = ['Type,From,To,Amount,Hash,Note,Date', ...transactions.map(tx =>
                `${tx.type},${tx.fromAddress},${tx.toAddress},${tx.amount},${tx.txHash || ''},${tx.note || ''},${tx.createdAt}`
              )].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
            }}
            className={btnCls}
          >
            <FiDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-hover p-3 text-center">
          <p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{transactions.length}</p>
          <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Total</p>
        </div>
        <div className="card-hover p-3 text-center">
          <p className="text-lg font-bold text-emerald-500">{transactions.filter(t => isIncoming(t)).length}</p>
          <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Incoming</p>
        </div>
        <div className="card-hover p-3 text-center">
          <p className="text-lg font-bold text-blue-500">{transactions.filter(t => !isIncoming(t)).length}</p>
          <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Outgoing</p>
        </div>
        <div className="card-hover p-3 text-center">
          <p className="text-lg font-bold text-amber-500">₹{totalVolume.toLocaleString()}</p>
          <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Volume</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by address, hash, note..."
            className={`w-full h-10 pl-9 pr-4 rounded-lg text-sm border transition-all focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 ${isDark
                ? "bg-slate-800/60 border-slate-700/60 text-white placeholder-slate-500"
                : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className={`h-10 px-3 rounded-lg text-sm border focus:border-blue-500/50 transition-all focus:outline-none ${isDark
              ? "bg-slate-800/60 border-slate-700/60 text-white"
              : "bg-white border-slate-200 text-slate-900"
            }`}
        >
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Transaction Table */}
      {transactions.length === 0 ? (
        <div className="card-hover p-16 text-center">
          <FiInbox size={40} className={`mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>No transactions yet</p>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>Transactions will appear here after you send, receive, mint, or lock tokens</p>
        </div>
      ) : (
        <div className="card-hover overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? "border-slate-800/60" : "border-slate-200"}`}>
                  {['Direction', 'Type', 'From / To', 'Amount', 'Tx Hash', 'Note', 'Time'].map((h, i) => (
                    <th key={h} className={`py-3 px-4 text-[10px] uppercase tracking-wider font-semibold ${isDark ? "text-slate-500" : "text-slate-400"} ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((tx) => {
                  const incoming = isIncoming(tx);
                  return (
                    <tr
                      key={tx.id}
                      className={`border-b cursor-pointer transition-colors ${isDark
                          ? "border-slate-800/30 hover:bg-slate-800/20"
                          : "border-slate-100 hover:bg-slate-50/80"
                        }`}
                      onClick={() => setSelectedTx(tx)}
                    >
                      <td className="py-3 px-4">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${incoming ? 'bg-emerald-500/15 text-emerald-500' : 'bg-blue-500/15 text-blue-500'}`}>
                          {incoming ? <FiArrowDownLeft size={12} /> : <FiArrowUpRight size={12} />}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeColor(tx.type)}`}>{tx.type}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className={`text-xs font-mono ${isDark ? "text-white" : "text-slate-900"}`}>{tx.fromAddress ? `${tx.fromAddress.slice(0, 6)}...${tx.fromAddress.slice(-4)}` : 'System'}</p>
                        <p className={`text-[10px] font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>→ {tx.toAddress ? `${tx.toAddress.slice(0, 6)}...${tx.toAddress.slice(-4)}` : '—'}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-semibold ${incoming ? 'text-emerald-500' : (isDark ? 'text-white' : 'text-slate-900')}`}>
                          {incoming ? '+' : '-'}₹{tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>{tx.txHash ? shortHash(tx.txHash) : '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs truncate max-w-[120px] block ${isDark ? "text-slate-500" : "text-slate-400"}`}>{tx.note || '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? "border-slate-800/60" : "border-slate-200"}`}>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</p>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}><FiChevronLeft size={14} /></button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${page === p ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30' : (isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')}`}>{p}</button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}><FiChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTx(null)}>
          <div
            className={`border rounded-2xl p-6 max-w-lg w-full shadow-2xl ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200"}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} className={isDark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-700"}><FiX size={18} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'ID', value: `#${selectedTx.id}` },
                { label: 'From', value: selectedTx.fromAddress || 'System' },
                { label: 'To', value: selectedTx.toAddress || '—' },
                { label: 'Amount', value: `₹${selectedTx.amount.toLocaleString()}`, cls: 'font-semibold' },
                ...(selectedTx.note ? [{ label: 'Note', value: selectedTx.note }] : []),
                { label: 'Date', value: new Date(selectedTx.createdAt).toLocaleString('en-IN') },
              ].map(item => (
                <div key={item.label} className={`flex justify-between py-1.5 border-b ${isDark ? "border-slate-800/40" : "border-slate-100"}`}>
                  <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.label}</span>
                  <span className={`text-xs font-mono ${isDark ? "text-white" : "text-slate-900"} ${item.cls || ''}`}>{item.value}</span>
                </div>
              ))}
              <div className={`flex justify-between py-1.5 border-b ${isDark ? "border-slate-800/40" : "border-slate-100"}`}>
                <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Type</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeColor(selectedTx.type)}`}>{selectedTx.type}</span>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${isDark ? "border-slate-800/40" : "border-slate-100"}`}>
                <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Status</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500">{selectedTx.status}</span>
              </div>
              {selectedTx.txHash && (
                <div>
                  <p className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <code className={`text-xs text-blue-500 font-mono px-3 py-2 rounded-lg flex-1 break-all ${isDark ? "bg-slate-800/60" : "bg-slate-50"}`}>{selectedTx.txHash}</code>
                    <button onClick={() => copyHash(selectedTx.txHash!)} className={isDark ? "text-slate-400 hover:text-white shrink-0" : "text-slate-400 hover:text-slate-700 shrink-0"}>
                      {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setSelectedTx(null)} className="w-full mt-5 h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
