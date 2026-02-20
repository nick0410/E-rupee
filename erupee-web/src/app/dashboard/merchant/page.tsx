"use client";

import { useState } from "react";
import {
  FiDollarSign, FiShoppingBag,
  FiCheck, FiCreditCard, FiCopy, FiAlertCircle,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { api } from "@/lib/api";

export default function MerchantPage() {
  const { user, balance, transactions, refreshAll } = useWallet();
  const [posAmount, setPosAmount] = useState('');
  const [posProcessing, setPosProcessing] = useState(false);
  const [posResult, setPosResult] = useState<{ success: boolean; msg: string; hash?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const address = balance?.address || user?.walletAddress || "";

  // Real merchant transactions from DB
  const merchantTxs = transactions.filter(t => t.type === 'TRANSFER' && t.toAddress?.toLowerCase() === address.toLowerCase());
  const totalRevenue = merchantTxs.reduce((s, t) => s + t.amount, 0);

  const handlePOS = async () => {
    if (!posAmount || parseFloat(posAmount) <= 0) return;
    setPosProcessing(true);
    setPosResult(null);
    try {
      // Simulate receiving payment = minting to own account (demo)
      const res = await api.mint(user!.id, posAmount);
      await refreshAll();
      setPosResult({ success: true, msg: `Payment of ₹${posAmount} received!`, hash: res.txHash });
      setPosAmount('');
    } catch (err: any) {
      setPosResult({ success: false, msg: err.message || 'Payment failed' });
    }
    setPosProcessing(false);
  };

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Merchant Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">POS terminal & revenue tracking</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-hover p-4 stat-glow">
          <FiDollarSign className="text-violet-400 mb-2" size={18} />
          <p className="text-white text-xl font-bold">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-slate-500 text-xs">Total Revenue</p>
        </div>
        <div className="card-hover p-4 stat-glow">
          <FiCreditCard className="text-blue-400 mb-2" size={18} />
          <p className="text-white text-xl font-bold">{merchantTxs.length}</p>
          <p className="text-slate-500 text-xs">Transactions</p>
        </div>
        <div className="card-hover p-4 stat-glow">
          <FiShoppingBag className="text-emerald-400 mb-2" size={18} />
          <p className="text-white text-xl font-bold">₹{merchantTxs.length > 0 ? Math.round(totalRevenue / merchantTxs.length).toLocaleString() : '0'}</p>
          <p className="text-slate-500 text-xs">Avg Ticket</p>
        </div>
        <div className="card-hover p-4 stat-glow">
          <FiCheck className="text-amber-400 mb-2" size={18} />
          <p className="text-white text-xl font-bold">₹{(balance?.available ?? 0).toLocaleString()}</p>
          <p className="text-slate-500 text-xs">Balance</p>
        </div>
      </div>

      {/* Smart POS Terminal */}
      <div className="card-hover p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center mx-auto mb-3">
            <FiCreditCard className="text-white text-2xl" />
          </div>
          <h3 className="text-white font-bold text-lg">Smart POS Terminal</h3>
          <p className="text-slate-500 text-xs mt-1">Accept eINR payments</p>
        </div>

        {/* Amount Display */}
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 mb-4 text-center">
          <p className="text-slate-500 text-xs mb-1">AMOUNT</p>
          <p className="text-white text-4xl font-bold font-mono">₹ {posAmount || '0'}</p>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-4 max-w-xs mx-auto">
          {[1,2,3,4,5,6,7,8,9,'.',0,'⌫'].map((key) => (
            <button key={key} onClick={() => {
              if (key === '⌫') setPosAmount(p => p.slice(0, -1));
              else setPosAmount(p => p + key);
            }}
              className="h-14 rounded-xl bg-slate-800/60 border border-slate-700/40 text-white text-lg font-medium hover:bg-slate-700/60 hover:border-slate-600 transition-all active:scale-95">
              {key}
            </button>
          ))}
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-4 gap-2 mb-4 max-w-xs mx-auto">
          {[100, 250, 500, 1000].map(a => (
            <button key={a} onClick={() => setPosAmount(String(a))} className="py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-all">
              ₹{a}
            </button>
          ))}
        </div>

        {/* Charge Button */}
        <button onClick={handlePOS} disabled={posProcessing || !posAmount || parseFloat(posAmount) <= 0}
          className="w-full h-14 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-lg font-bold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 max-w-xs mx-auto">
          {posProcessing ? <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><FiCheck size={20} /> Charge ₹{posAmount || '0'}</>}
        </button>

        {posResult && (
          <div className={`mt-4 p-4 rounded-xl border max-w-xs mx-auto ${posResult.success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-center gap-2 mb-1">
              {posResult.success ? <FiCheck className="text-emerald-400" /> : <FiAlertCircle className="text-red-400" />}
              <span className={`text-sm font-medium ${posResult.success ? 'text-emerald-400' : 'text-red-400'}`}>{posResult.msg}</span>
            </div>
            {posResult.hash && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-slate-500 text-xs font-mono truncate">{posResult.hash.slice(0, 20)}...</span>
                <button onClick={() => { navigator.clipboard.writeText(posResult.hash!); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="text-slate-400 hover:text-white">
                  {copied ? <FiCheck size={10} /> : <FiCopy size={10} />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Sales from real transactions */}
      <div className="card-hover p-5">
        <h3 className="text-white font-semibold mb-4">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No transactions yet</p>
        ) : (
          <div className="space-y-1">
            {transactions.slice(0, 8).map((tx, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-800/30 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.type === 'MINT' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
                }`}>
                  <FiDollarSign size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{tx.type} - ₹{tx.amount.toLocaleString()}</p>
                  <p className="text-slate-500 text-[10px]">{tx.note || '—'} • {new Date(tx.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <span className="text-emerald-400 text-sm font-semibold">₹{tx.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
