"use client";

import { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiCopy, FiCheck, FiAlertCircle, FiLock, FiUnlock, FiCalendar, FiClock } from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { api } from "@/lib/api";

type LockState = "idle" | "confirming" | "processing" | "success" | "error";

export default function LockPage() {
  const { user, balance, locks, refreshAll } = useWallet();
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("7"); // days
  const [state, setState] = useState<LockState>("idle");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [tab, setTab] = useState<"lock" | "active">("lock");

  const address = balance?.address || user?.walletAddress || "";
  const available = Number(balance?.available ?? 0) || 0;
  const locked = Number(balance?.locked ?? 0) || 0;

  const unlockTime = Math.floor(Date.now() / 1000) + parseInt(duration) * 86400;

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > available) return;
    setState("confirming");
  };

  const handleLock = async () => {
    setState("processing");
    setError("");
    try {
      const res = await api.lock(user!.id, amount, unlockTime);
      setTxHash(res.tx || "");
      await refreshAll();
      setState("success");
    } catch (err: any) {
      setError(err.message || "Lock failed");
      setState("error");
    }
  };

  const handleRelease = async (lockAddress: string) => {
    setReleasing(lockAddress);
    try {
      await api.release(user!.id);
      await refreshAll();
    } catch (err: any) {
      alert("Release failed: " + (err.message || "Unknown error"));
    }
    setReleasing(null);
  };

  const reset = () => {
    setAmount("");
    setDuration("7");
    setTxHash("");
    setError("");
    setState("idle");
  };

  const copyHash = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const durations = [
    { label: "1 Day", value: "1" },
    { label: "7 Days", value: "7" },
    { label: "30 Days", value: "30" },
    { label: "90 Days", value: "90" },
    { label: "180 Days", value: "180" },
    { label: "365 Days", value: "365" },
  ];

  return (
    <div className="space-y-6 max-w-[700px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/payments" className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <FiArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Lock Tokens</h1>
          <p className="text-slate-400 text-xs">Time-lock eINR for savings, compliance, or escrow</p>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-hover p-4">
          <p className="text-slate-400 text-xs">Available</p>
          <p className="text-white font-bold text-lg">₹{available.toLocaleString()}</p>
        </div>
        <div className="card-hover p-4">
          <p className="text-slate-400 text-xs">Locked</p>
          <p className="text-amber-400 font-bold text-lg">₹{locked.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-800/40 border border-slate-700/20">
        <button onClick={() => setTab("lock")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            tab === "lock" ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'}`}>
          <FiLock size={14} /> Lock Tokens
        </button>
        <button onClick={() => setTab("active")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            tab === "active" ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}>
          <FiClock size={14} /> Active Locks ({locks.length})
        </button>
      </div>

      {/* Lock Tab */}
      {tab === "lock" && (
        <>
          {state === "idle" && (
            <div className="card-hover p-6 space-y-5">
              <h3 className="text-white font-semibold">Lock Amount</h3>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-semibold">₹</span>
                <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00" type="text" autoFocus
                  className="w-full px-4 py-4 pl-10 rounded-xl bg-slate-800/60 border border-slate-700/30 text-white text-2xl font-mono placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              {parseFloat(amount) > available && (
                <p className="text-red-400 text-xs">Exceeds available balance</p>
              )}

              <div>
                <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Lock Duration</h4>
                <div className="grid grid-cols-3 gap-2">
                  {durations.map(d => (
                    <button key={d.value} onClick={() => setDuration(d.value)}
                      className={`py-2.5 rounded-lg text-xs font-medium transition-all ${duration === d.value
                        ? 'bg-amber-600/20 border border-amber-500/40 text-amber-400'
                        : 'bg-slate-800/60 border border-slate-700/30 text-slate-400 hover:text-white'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Unlock Date</span>
                  <span className="text-white">{new Date(unlockTime * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Unlock Time</span>
                  <span className="text-white">{new Date(unlockTime * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <button onClick={handleConfirm}
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > available}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                Lock Tokens
              </button>
            </div>
          )}

          {state === "confirming" && (
            <div className="card-hover p-6 space-y-5">
              <h3 className="text-white font-semibold">Confirm Lock</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                  <span className="text-slate-400 text-sm">Amount</span>
                  <span className="text-amber-400 font-bold">₹{parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                  <span className="text-slate-400 text-sm">Duration</span>
                  <span className="text-white text-sm">{duration} Day{parseInt(duration) > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                  <span className="text-slate-400 text-sm">Unlocks On</span>
                  <span className="text-white text-sm">{new Date(unlockTime * 1000).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                  <span className="text-slate-400 text-sm">Wallet</span>
                  <span className="text-white text-sm font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-amber-400 text-xs flex items-center gap-2">
                  <FiAlertCircle size={12} />
                  Tokens cannot be used until the unlock date. This action is irreversible.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setState("idle")} className="flex-1 py-3 rounded-xl border border-slate-700/30 text-slate-300 text-sm hover:text-white transition-all">Back</button>
                <button onClick={handleLock} className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all">Confirm Lock</button>
              </div>
            </div>
          )}

          {state === "processing" && (
            <div className="card-hover p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin mx-auto" />
              <p className="text-white font-semibold">Locking Tokens...</p>
              <p className="text-slate-500 text-xs">Locking ₹{parseFloat(amount).toLocaleString()} for {duration} days</p>
            </div>
          )}

          {state === "success" && (
            <div className="card-hover p-6 space-y-5 border-l-4 border-amber-500">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <FiLock size={24} className="text-amber-400" />
                </div>
                <h3 className="text-white font-bold text-lg">Tokens Locked!</h3>
                <p className="text-amber-400 text-2xl font-bold mt-2">₹{parseFloat(amount).toLocaleString()}</p>
                <p className="text-slate-400 text-xs mt-1">Unlocks {new Date(unlockTime * 1000).toLocaleDateString('en-IN')}</p>
              </div>
              {txHash && (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/30">
                  <p className="text-slate-500 text-xs mb-1">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <p className="text-blue-400 font-mono text-xs break-all flex-1">{txHash}</p>
                    <button onClick={copyHash} className="text-slate-400 hover:text-white shrink-0">{copied ? <FiCheck size={12} /> : <FiCopy size={12} />}</button>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all">Lock More</button>
                <button onClick={() => { reset(); setTab("active"); }} className="flex-1 py-3 rounded-xl border border-slate-700/30 text-slate-300 text-sm hover:text-white text-center transition-all">View Locks</button>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="card-hover p-6 space-y-4 border-l-4 border-red-500">
              <div className="text-center">
                <FiAlertCircle size={32} className="text-red-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Lock Failed</h3>
                <p className="text-red-400 text-sm mt-1">{error}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setState("confirming")} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all">Retry</button>
                <button onClick={reset} className="flex-1 py-3 rounded-xl border border-slate-700/30 text-slate-300 text-sm hover:text-white transition-all">Start Over</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Active Locks Tab */}
      {tab === "active" && (
        <div className="space-y-3">
          {locks.length === 0 ? (
            <div className="card-hover p-10 text-center">
              <FiUnlock size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No active locks</p>
              <button onClick={() => setTab("lock")} className="mt-3 text-blue-400 text-sm hover:underline">Create a lock →</button>
            </div>
          ) : (
            locks.map((lock: any, i: number) => {
              const isExpired = Date.now() / 1000 > Number(lock.unlockTime);
              return (
                <div key={i} className={`card-hover p-5 border-l-4 ${isExpired ? 'border-emerald-500' : 'border-amber-500'}`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-white font-bold">₹{Number(lock.amount).toLocaleString()}</p>
                      <p className="text-slate-400 text-xs flex items-center gap-1">
                        <FiCalendar size={10} />
                        Unlocks: {new Date(Number(lock.unlockTime) * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {lock.documentCID && (
                        <p className="text-slate-500 text-xs">Doc: {lock.documentCID}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${isExpired ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {isExpired ? 'Expired' : 'Active'}
                      </span>
                      {isExpired && (
                        <button onClick={() => handleRelease(address)}
                          disabled={releasing === address}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all disabled:opacity-50">
                          {releasing === address ? 'Releasing...' : 'Release'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
