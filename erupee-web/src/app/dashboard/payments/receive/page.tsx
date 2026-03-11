"use client";

import { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiCopy, FiCheck, FiMaximize } from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import ERupeeQR from "@/components/ERupeeQR";

export default function ReceivePage() {
  const { user, balance } = useWallet();
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const address = balance?.address || user?.walletAddress || "";

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR data string
  const qrData = `erupee://pay?to=${address}&amount=${amount || '0'}&note=${encodeURIComponent(note)}`;

  return (
    <div className="space-y-6 max-w-[600px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/payments" className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <FiArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Receive eINR</h1>
          <p className="text-slate-400 text-xs">Share your wallet address or QR code</p>
        </div>
      </div>

      {/* Wallet Address Card */}
      <div className="card-hover p-6 space-y-4">
        <h3 className="text-white font-semibold">Your Wallet Address</h3>
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/30">
          <p className="text-blue-400 text-sm font-mono break-all leading-relaxed">{address || "No wallet address found"}</p>
        </div>
        <button onClick={copyAddress} disabled={!address}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          {copied ? <><FiCheck size={14} /> Copied!</> : <><FiCopy size={14} /> Copy Address</>}
        </button>
      </div>

      {/* QR Code */}
      <div className="card-hover p-6 space-y-4">
        <h3 className="text-white font-semibold">QR Code</h3>
        <div className="mx-auto flex items-center justify-center">
          <ERupeeQR value={qrData} size={260} />
        </div>
        <p className="text-slate-500 text-xs text-center">Scan this QR to send eINR to your wallet</p>

        {/* Optional: Request specific amount */}
        <div className="border-t border-slate-800/50 pt-4 space-y-3">
          <h4 className="text-slate-400 text-xs uppercase tracking-wider">Request Specific Amount (Optional)</h4>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00" type="text"
              className="w-full px-4 py-3 pl-8 rounded-xl bg-slate-800/60 border border-slate-700/30 text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          <input value={note} onChange={e => setNote(e.target.value)}
            placeholder="Note (e.g., For dinner split)"
            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/30 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors" />
        </div>
      </div>

      {/* Payment Link */}
      <div className="card-hover p-5">
        <h3 className="text-white font-semibold mb-3">Payment Deep Link</h3>
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/30">
          <p className="text-slate-400 text-xs font-mono break-all">{qrData}</p>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(qrData); }}
          className="mt-3 px-4 py-2 rounded-lg border border-slate-700/30 text-slate-300 text-sm hover:text-white flex items-center gap-2 transition-all">
          <FiCopy size={12} /> Copy Link
        </button>
      </div>
    </div>
  );
}
