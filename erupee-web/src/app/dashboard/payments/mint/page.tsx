"use client";

import { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiCopy, FiCheck, FiAlertCircle } from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { api } from "@/lib/api";

type MintState = "idle" | "confirming" | "processing" | "success" | "error";

export default function MintPage() {
  const { user, balance, refreshAll } = useWallet();
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<MintState>("idle");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const address = balance?.address || user?.walletAddress || "";
  const available = Number(balance?.available ?? 0) || 0;

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setState("confirming");
  };

  const handleMint = async () => {
    setState("processing");
    setError("");
    try {
      const res = await api.mint(user!.id, amount);
      setTxHash(res.tx || "");
      await refreshAll();
      setState("success");
    } catch (err: any) {
      setError(err.message || "Mint failed");
      setState("error");
    }
  };

  const reset = () => {
    setAmount("");
    setTxHash("");
    setError("");
    setState("idle");
  };

  const copyHash = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickAmounts = [1000, 5000, 10000, 50000, 100000];

  return (
    <div className="space-y-6 max-w-[600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/payments" className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <FiArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Mint eINR</h1>
          <p className="text-slate-400 text-xs">Issue new digital currency to your wallet</p>
        </div>
      </div>

      {/* Current Balance */}
      <div className="card-hover p-4 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs">Current Balance</p>
          <p className="text-white font-bold text-lg">₹{available.toLocaleString()}</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">Active</div>
      </div>

      {/* IDLE: Mint Form */}
      {state === "idle" && (
        <div className="card-hover p-6 space-y-5">
          <h3 className="text-white font-semibold">Mint Amount</h3>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-semibold">₹</span>
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00" type="text" autoFocus
              className="w-full px-4 py-4 pl-10 rounded-xl bg-slate-800/60 border border-slate-700/30 text-white text-2xl font-mono placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map(a => (
              <button key={a} onClick={() => setAmount(a.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${amount === a.toString()
                  ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400'
                  : 'bg-slate-800/60 border border-slate-700/30 text-slate-400 hover:text-white'}`}>
                ₹{a.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-amber-400 text-xs flex items-center gap-2">
              <FiAlertCircle size={12} />
              Minting creates new eINR tokens. In production, only authorized RBI entities can mint.
            </p>
          </div>

          <button onClick={handleConfirm}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Proceed to Mint
          </button>
        </div>
      )}

      {/* CONFIRMING */}
      {state === "confirming" && (
        <div className="card-hover p-6 space-y-5">
          <h3 className="text-white font-semibold">Confirm Minting</h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
              <span className="text-slate-400 text-sm">Amount to Mint</span>
              <span className="text-emerald-400 font-bold">₹{parseFloat(amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
              <span className="text-slate-400 text-sm">Recipient</span>
              <span className="text-white text-sm font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
              <span className="text-slate-400 text-sm">New Balance</span>
              <span className="text-white font-semibold">₹{(available + parseFloat(amount)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
              <span className="text-slate-400 text-sm">Network Fee</span>
              <span className="text-emerald-400 text-sm">FREE (CBDC)</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setState("idle")} className="flex-1 py-3 rounded-xl border border-slate-700/30 text-slate-300 text-sm hover:text-white transition-all">
              Back
            </button>
            <button onClick={handleMint} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all">
              Confirm Mint
            </button>
          </div>
        </div>
      )}

      {/* PROCESSING */}
      {state === "processing" && (
        <div className="card-hover p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin mx-auto" />
          <p className="text-white font-semibold">Minting eINR...</p>
          <p className="text-slate-500 text-xs">Issuing ₹{parseFloat(amount).toLocaleString()} to blockchain</p>
        </div>
      )}

      {/* SUCCESS */}
      {state === "success" && (
        <div className="card-hover p-6 space-y-5 border-l-4 border-emerald-500">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <FiCheck size={24} className="text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-lg">Minted Successfully!</h3>
            <p className="text-emerald-400 text-2xl font-bold mt-2">₹{parseFloat(amount).toLocaleString()}</p>
          </div>
          {txHash && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/30">
              <p className="text-slate-500 text-xs mb-1">Transaction Hash</p>
              <div className="flex items-center gap-2">
                <p className="text-blue-400 font-mono text-xs break-all flex-1">{txHash}</p>
                <button onClick={copyHash} className="text-slate-400 hover:text-white shrink-0">
                  {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all">
              Mint More
            </button>
            <Link href="/dashboard/transactions" className="flex-1 py-3 rounded-xl border border-slate-700/30 text-slate-300 text-sm hover:text-white text-center transition-all">
              View Transactions
            </Link>
          </div>
        </div>
      )}

      {/* ERROR */}
      {state === "error" && (
        <div className="card-hover p-6 space-y-4 border-l-4 border-red-500">
          <div className="text-center">
            <FiAlertCircle size={32} className="text-red-400 mx-auto mb-2" />
            <h3 className="text-white font-semibold">Mint Failed</h3>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setState("confirming")} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all">
              Retry
            </button>
            <button onClick={reset} className="flex-1 py-3 rounded-xl border border-slate-700/30 text-slate-300 text-sm hover:text-white transition-all">
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
