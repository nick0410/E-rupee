"use client";

import { useState } from "react";
import {
  FiSearch, FiDownload, FiCheck, FiX, FiCopy,
  FiArrowUpRight, FiArrowDownLeft, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiInbox,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { shortHash } from "@/lib/utils";
import type { DbTransaction } from "@/lib/api";

export default function TransactionsPage() {
  const { user, balance, transactions, refreshTransactions, loading } = useWallet();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<DbTransaction | null>(null);
  const [copied, setCopied] = useState(false);
  const perPage = 10;

  const address = balance?.address || user?.walletAddress || "";

  // Filter transactions
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

  // Compute stats from real data
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
      MINT: 'bg-emerald-500/15 text-emerald-400',
      TRANSFER: 'bg-blue-500/15 text-blue-400',
      LOCK: 'bg-amber-500/15 text-amber-400',
      RELEASE: 'bg-purple-500/15 text-purple-400',
      SUBSIDY: 'bg-cyan-500/15 text-cyan-400',
    };
    return map[type] || 'bg-slate-500/15 text-slate-400';
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaction Ledger</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real blockchain transaction history</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refreshTransactions()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-300 text-sm hover:border-blue-500/40 transition-all">
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => {
            const csv = ['Type,From,To,Amount,Hash,Note,Date', ...transactions.map(tx =>
              `${tx.type},${tx.fromAddress},${tx.toAddress},${tx.amount},${tx.txHash || ''},${tx.note || ''},${tx.createdAt}`
            )].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
          }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-300 text-sm hover:border-blue-500/40 transition-all">
            <FiDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-hover p-3 text-center">
          <p className="text-lg font-bold text-white">{transactions.length}</p>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">Total</p>
        </div>
        <div className="card-hover p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">{transactions.filter(t => isIncoming(t)).length}</p>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">Incoming</p>
        </div>
        <div className="card-hover p-3 text-center">
          <p className="text-lg font-bold text-blue-400">{transactions.filter(t => !isIncoming(t)).length}</p>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">Outgoing</p>
        </div>
        <div className="card-hover p-3 text-center">
          <p className="text-lg font-bold text-amber-400">₹{totalVolume.toLocaleString()}</p>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">Volume</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by address, hash, note..."
            className="w-full h-10 pl-9 pr-4 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all" />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 bg-slate-800/60 border border-slate-700/60 rounded-lg text-sm text-white focus:border-blue-500/50 transition-all">
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Transaction Table */}
      {transactions.length === 0 ? (
        <div className="card-hover p-16 text-center">
          <FiInbox size={40} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No transactions yet</p>
          <p className="text-slate-600 text-xs mt-1">Transactions will appear here after you send, receive, mint, or lock tokens</p>
        </div>
      ) : (
        <div className="card-hover overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left text-slate-500 text-[10px] uppercase tracking-wider font-semibold py-3 px-4">Direction</th>
                  <th className="text-left text-slate-500 text-[10px] uppercase tracking-wider font-semibold py-3 px-4">Type</th>
                  <th className="text-left text-slate-500 text-[10px] uppercase tracking-wider font-semibold py-3 px-4">From / To</th>
                  <th className="text-right text-slate-500 text-[10px] uppercase tracking-wider font-semibold py-3 px-4">Amount</th>
                  <th className="text-left text-slate-500 text-[10px] uppercase tracking-wider font-semibold py-3 px-4">Tx Hash</th>
                  <th className="text-left text-slate-500 text-[10px] uppercase tracking-wider font-semibold py-3 px-4">Note</th>
                  <th className="text-left text-slate-500 text-[10px] uppercase tracking-wider font-semibold py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((tx) => {
                  const incoming = isIncoming(tx);
                  return (
                    <tr key={tx.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 cursor-pointer transition-colors" onClick={() => setSelectedTx(tx)}>
                      <td className="py-3 px-4">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${incoming ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
                          {incoming ? <FiArrowDownLeft size={12} /> : <FiArrowUpRight size={12} />}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeColor(tx.type)}`}>{tx.type}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-white text-xs font-mono">{tx.fromAddress ? `${tx.fromAddress.slice(0,6)}...${tx.fromAddress.slice(-4)}` : 'System'}</p>
                        <p className="text-slate-500 text-[10px] font-mono">→ {tx.toAddress ? `${tx.toAddress.slice(0,6)}...${tx.toAddress.slice(-4)}` : '—'}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-semibold ${incoming ? 'text-emerald-400' : 'text-white'}`}>
                          {incoming ? '+' : '-'}₹{tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-400 text-xs font-mono">{tx.txHash ? shortHash(tx.txHash) : '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-500 text-xs truncate max-w-[120px] block">{tx.note || '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-500 text-xs">{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/60">
              <p className="text-slate-500 text-xs">Showing {(page-1)*perPage+1}–{Math.min(page*perPage, filtered.length)} of {filtered.length}</p>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"><FiChevronLeft size={14} /></button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${page === p ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>{p}</button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p+1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"><FiChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTx(null)}>
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} className="text-slate-500 hover:text-white"><FiX size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-500 text-xs">ID</span>
                <span className="text-white text-xs">#{selectedTx.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-500 text-xs">Type</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeColor(selectedTx.type)}`}>{selectedTx.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-500 text-xs">Status</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400">{selectedTx.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-500 text-xs">From</span>
                <span className="text-white text-xs font-mono">{selectedTx.fromAddress || 'System'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-500 text-xs">To</span>
                <span className="text-white text-xs font-mono">{selectedTx.toAddress || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-500 text-xs">Amount</span>
                <span className="text-white text-sm font-semibold">₹{selectedTx.amount.toLocaleString()}</span>
              </div>
              {selectedTx.note && (
                <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                  <span className="text-slate-500 text-xs">Note</span>
                  <span className="text-white text-xs text-right max-w-[60%]">{selectedTx.note}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-500 text-xs">Date</span>
                <span className="text-white text-xs">{new Date(selectedTx.createdAt).toLocaleString('en-IN')}</span>
              </div>
              {selectedTx.txHash && (
                <div>
                  <p className="text-slate-500 text-xs mb-1">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-blue-400 font-mono bg-slate-800/60 px-3 py-2 rounded-lg flex-1 break-all">{selectedTx.txHash}</code>
                    <button onClick={() => copyHash(selectedTx.txHash!)} className="text-slate-400 hover:text-white shrink-0">
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
