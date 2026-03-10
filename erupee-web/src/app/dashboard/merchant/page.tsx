"use client";

import { useState } from "react";
import {
  FiDollarSign, FiShoppingBag,
  FiCheck, FiCreditCard, FiCopy, FiAlertCircle,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

export default function MerchantPage() {
  const { user, balance, transactions, refreshAll } = useWallet();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [posAmount, setPosAmount] = useState('');
  const [posProcessing, setPosProcessing] = useState(false);
  const [posResult, setPosResult] = useState<{ success: boolean; msg: string; hash?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const address = balance?.address || user?.walletAddress || "";
  const merchantTxs = transactions.filter(t => t.type === 'TRANSFER' && t.toAddress?.toLowerCase() === address.toLowerCase());
  const totalRevenue = merchantTxs.reduce((s, t) => s + t.amount, 0);

  const handlePOS = async () => {
    if (!posAmount || parseFloat(posAmount) <= 0) return;
    setPosProcessing(true);
    setPosResult(null);
    try {
      const res = await api.mint(user!.id, posAmount);
      await refreshAll();
      setPosResult({ success: true, msg: `Payment of ₹${posAmount} received!`, hash: res.txHash });
      setPosAmount('');
    } catch (err: any) {
      setPosResult({ success: false, msg: err.message || 'Payment failed' });
    }
    setPosProcessing(false);
  };

  const statCards = [
    { icon: <FiDollarSign className="text-violet-500 mb-2" size={18} />, value: `₹${totalRevenue.toLocaleString()}`, label: "Total Revenue" },
    { icon: <FiCreditCard className="text-blue-500 mb-2" size={18} />, value: merchantTxs.length, label: "Transactions" },
    { icon: <FiShoppingBag className="text-emerald-500 mb-2" size={18} />, value: `₹${merchantTxs.length > 0 ? Math.round(totalRevenue / merchantTxs.length).toLocaleString() : '0'}`, label: "Avg Ticket" },
    { icon: <FiCheck className="text-amber-500 mb-2" size={18} />, value: `₹${(balance?.available ?? 0).toLocaleString()}`, label: "Balance" },
  ];

  const inputCls = `w-full px-3 py-2.5 rounded-xl text-sm font-mono placeholder:text-opacity-50 focus:outline-none focus:border-blue-500/50 border transition-all ${isDark
      ? "bg-slate-800/80 border-slate-700/30 text-white placeholder:text-slate-600"
      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
    }`;

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Merchant Dashboard</h1>
        <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>POS terminal & revenue tracking</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className="card-hover p-4 stat-glow">
            {s.icon}
            <p className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Smart POS Terminal */}
      <div className="card-hover p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center mx-auto mb-3">
            <FiCreditCard className="text-white text-2xl" />
          </div>
          <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Smart POS Terminal</h3>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Accept eINR payments</p>
        </div>

        {/* Amount Display */}
        <div className={`border rounded-xl p-6 mb-4 text-center transition-colors ${isDark ? "bg-slate-800/60 border-slate-700/40" : "bg-slate-50 border-slate-200"
          }`}>
          <p className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>AMOUNT</p>
          <p className={`text-4xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>₹ {posAmount || '0'}</p>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-4 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '⌫'].map((key) => (
            <button
              key={key}
              onClick={() => {
                if (key === '⌫') setPosAmount(p => p.slice(0, -1));
                else setPosAmount(p => p + key);
              }}
              className={`h-14 rounded-xl border text-lg font-medium transition-all active:scale-95 ${isDark
                  ? "bg-slate-800/60 border-slate-700/40 text-white hover:bg-slate-700/60 hover:border-slate-600"
                  : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-4 gap-2 mb-4 max-w-xs mx-auto">
          {[100, 250, 500, 1000].map(a => (
            <button key={a} onClick={() => setPosAmount(String(a))} className="py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-500 text-xs font-medium hover:bg-violet-500/20 transition-all">
              ₹{a}
            </button>
          ))}
        </div>

        {/* Charge Button */}
        <button
          onClick={handlePOS}
          disabled={posProcessing || !posAmount || parseFloat(posAmount) <= 0}
          className="w-full h-14 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-lg font-bold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 max-w-xs mx-auto"
        >
          {posProcessing ? <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><FiCheck size={20} /> Charge ₹{posAmount || '0'}</>}
        </button>

        {posResult && (
          <div className={`mt-4 p-4 rounded-xl border max-w-xs mx-auto ${posResult.success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-center gap-2 mb-1">
              {posResult.success ? <FiCheck className="text-emerald-500" /> : <FiAlertCircle className="text-red-500" />}
              <span className={`text-sm font-medium ${posResult.success ? 'text-emerald-500' : 'text-red-500'}`}>{posResult.msg}</span>
            </div>
            {posResult.hash && (
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-mono truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>{posResult.hash.slice(0, 20)}...</span>
                <button onClick={() => { navigator.clipboard.writeText(posResult.hash!); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className={`${isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>
                  {copied ? <FiCheck size={10} /> : <FiCopy size={10} />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Sales */}
      <div className="card-hover p-5">
        <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className={`text-sm text-center py-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}>No transactions yet</p>
        ) : (
          <div className="space-y-1">
            {transactions.slice(0, 8).map((tx, i) => (
              <div key={i} className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'MINT' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-blue-500/15 text-blue-500'
                  }`}>
                  <FiDollarSign size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{tx.type} - ₹{tx.amount.toLocaleString()}</p>
                  <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{tx.note || '—'} • {new Date(tx.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <span className="text-emerald-500 text-sm font-semibold">₹{tx.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
