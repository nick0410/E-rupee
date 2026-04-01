"use client";

import { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiSend, FiCheck, FiAlertTriangle, FiCopy, FiMaximize } from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import QRScanner from "@/components/QRScanner";

type Status = "idle" | "confirming" | "processing" | "success" | "error";

export default function SendPage() {
  const { user, balance, refreshAll } = useWallet();
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const avail = balance ? parseFloat(balance.available) : 0;
  const parsedAmount = parseFloat(amount) || 0;
  const isValid = toAddress.startsWith("0x") && toAddress.length >= 10 && parsedAmount > 0 && parsedAmount <= avail;

  const handleConfirm = () => {
    if (!isValid) return;
    setStatus("confirming");
  };

  const handleSend = async () => {
    if (!user) return;
    setStatus("processing");
    setError("");
    try {
      const res = await api.transfer(user.id, toAddress, amount, note);
      setTxHash(res.tx);
      setStatus("success");
      await refreshAll();
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
    }
  };

  const reset = () => {
    setToAddress(""); setAmount(""); setNote("");
    setStatus("idle"); setTxHash(""); setError("");
  };

  const copyHash = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleScan = (data: string) => {
    try {
      // Expecting URL like: erupee://pay?to=0x...&amount=50&note=abc
      if (data.startsWith('erupee://pay')) {
        const url = new URL(data);
        const to = url.searchParams.get('to');
        const amt = url.searchParams.get('amount');
        const n = url.searchParams.get('note');
        
        if (to) setToAddress(to);
        if (amt && amt !== '0') setAmount(amt);
        if (n) setNote(n);
      } else if (/^https?:\/\//i.test(data) || /^localhost[:/]/i.test(data)) {
        const link = /^https?:\/\//i.test(data) ? data : `http://${data}`;
        window.location.href = link;
        return;
      } else if (data.startsWith('0x')) {
        setToAddress(data);
      }
      setShowScanner(false);
    } catch {
      // Just fallback to setting data as address if URL parsing fails
      setToAddress(data);
      setShowScanner(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[600px] mx-auto">
      {showScanner && (
        <QRScanner 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/payments" className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <FiArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Send eINR</h1>
            <p className="text-slate-400 text-xs">Real on-chain P2P transfer</p>
          </div>
        </div>
        <button 
          onClick={() => setShowScanner(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-sm font-medium transition-all"
        >
          <FiMaximize /> Scan QR
        </button>
      </div>

      {/* Success State */}
      {status === "success" && (
        <div className="card-hover p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
            <FiCheck size={28} />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Transfer Successful!</h2>
            <p className="text-slate-400 text-sm mt-1">₹{parsedAmount.toLocaleString('en-IN')} sent to {toAddress.slice(0, 8)}...{toAddress.slice(-6)}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/30">
            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Transaction Hash</p>
            <div className="flex items-center gap-2">
              <p className="text-blue-400 text-xs font-mono flex-1 break-all">{txHash}</p>
              <button onClick={copyHash} className="text-slate-400 hover:text-white transition-colors">
                {copied ? <FiCheck size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all">
              Send Another
            </button>
            <Link href="/dashboard/transactions" className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700/30 text-slate-300 hover:text-white text-sm font-medium text-center transition-all">
              View Transactions
            </Link>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="card-hover p-6 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 mb-2">
            <FiAlertTriangle className="text-red-400" size={20} />
            <h3 className="text-red-400 font-semibold">Transfer Failed</h3>
          </div>
          <p className="text-slate-400 text-sm">{error}</p>
          <button onClick={() => setStatus("idle")} className="mt-3 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/30 text-slate-300 text-sm hover:text-white transition-all">
            Try Again
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {status === "confirming" && (
        <div className="card-hover p-6 border-l-4 border-l-blue-500 space-y-4">
          <h3 className="text-white font-semibold text-lg">Confirm Transfer</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-500 text-sm">To</span>
              <span className="text-white text-sm font-mono">{toAddress.slice(0, 10)}...{toAddress.slice(-6)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-500 text-sm">Amount</span>
              <span className="text-white text-sm font-bold">₹{parsedAmount.toLocaleString('en-IN')}</span>
            </div>
            {note && (
              <div className="flex justify-between py-2 border-b border-slate-800/50">
                <span className="text-slate-500 text-sm">Note</span>
                <span className="text-slate-300 text-sm">{note}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-slate-500 text-sm">Network Fee</span>
              <span className="text-emerald-400 text-sm">FREE (CBDC)</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStatus("idle")} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700/30 text-slate-300 text-sm font-medium hover:text-white transition-all">
              Cancel
            </button>
            <button onClick={handleSend} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
              <FiSend size={14} /> Confirm & Send
            </button>
          </div>
        </div>
      )}

      {/* Processing */}
      {status === "processing" && (
        <div className="card-hover p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto">
            <span className="w-8 h-8 border-3 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Processing Transfer...</h3>
            <p className="text-slate-500 text-sm mt-1">Submitting to blockchain network</p>
          </div>
        </div>
      )}

      {/* Form */}
      {(status === "idle") && (
        <>
          <div className="card-hover p-5 border-l-4 border-l-emerald-500">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Available Balance</p>
            <p className="text-emerald-400 text-2xl font-bold">{formatINR(avail)}</p>
          </div>

          <div className="card-hover p-6 space-y-5">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Recipient Wallet Address *</label>
              <input value={toAddress} onChange={e => setToAddress(e.target.value)}
                placeholder="0x1234...abcd"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/30 text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors" />
              {toAddress && !toAddress.startsWith("0x") && (
                <p className="text-red-400 text-xs mt-1">Address must start with 0x</p>
              )}
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Amount (eINR) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00" type="text"
                  className="w-full px-4 py-3 pl-8 rounded-xl bg-slate-800/60 border border-slate-700/30 text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              {parsedAmount > avail && (
                <p className="text-red-400 text-xs mt-1">Exceeds available balance</p>
              )}
              {/* Quick amounts */}
              <div className="flex gap-2 mt-2">
                {[100, 500, 1000, 5000].map(a => (
                  <button key={a} onClick={() => setAmount(a.toString())}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/20 text-slate-400 text-xs hover:text-white hover:border-blue-500/30 transition-all">
                    ₹{a.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Note (optional)</label>
              <input value={note} onChange={e => setNote(e.target.value)}
                placeholder="e.g., Rent payment Feb 2026"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/30 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors" />
            </div>

            <button onClick={handleConfirm} disabled={!isValid}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <FiSend size={16} /> Review Transfer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
