"use client";

import { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiCopy, FiCheck, FiMaximize } from "react-icons/fi";
import { QRCodeCanvas } from "qrcode.react";
import { useWallet } from "@/context/WalletContext";
import { useTheme } from "@/context/ThemeContext";

export default function ReceivePage() {
  const { user, balance } = useWallet();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const address = balance?.address || user?.walletAddress || "";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR data string (openable URL for quick testing)
  const qrData = `${baseUrl}/dashboard/payments/send?to=${encodeURIComponent(address)}&amount=${encodeURIComponent(amount || "0")}&note=${encodeURIComponent(note)}`;

  return (
    <div className="space-y-6 max-w-[600px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/payments" className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
          isDark ? "bg-slate-800/60 border-slate-700/30 text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
        }`}>
          <FiArrowLeft size={16} />
        </Link>
        <div>
          <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Receive eINR</h1>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Share your wallet address or QR code</p>
        </div>
      </div>

      {/* Wallet Address Card */}
      <div className="card-hover p-6 space-y-4">
        <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Your Wallet Address</h3>
        <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/80 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}>
          <p className="text-blue-500 text-sm font-mono break-all leading-relaxed">{address || "No wallet address found"}</p>
        </div>
        <button onClick={copyAddress} disabled={!address}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          {copied ? <><FiCheck size={14} /> Copied!</> : <><FiCopy size={14} /> Copy Address</>}
        </button>
      </div>

      {/* QR Code */}
      <div className="card-hover p-6 space-y-4">
        <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>QR Code</h3>
        <div className="mx-auto flex items-center justify-center">
          <div className="bg-white rounded-2xl p-3 shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
            <QRCodeCanvas
              value={qrData || "http://localhost:3000"}
              size={260}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          </div>
        </div>
        <p className={`text-xs text-center ${isDark ? "text-slate-500" : "text-slate-500"}`}>Scan this QR to send eINR to your wallet</p>

        {/* Optional: Request specific amount */}
        <div className={`border-t pt-4 space-y-3 ${isDark ? "border-slate-800/50" : "border-slate-200"}`}>
          <h4 className={`text-xs uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Request Specific Amount (Optional)</h4>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>₹</span>
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00" type="text"
              className={`w-full px-4 py-3 pl-8 rounded-xl border text-sm font-mono focus:outline-none focus:border-blue-500/50 transition-colors ${
                isDark ? "bg-slate-800/60 border-slate-700/30 text-white placeholder:text-slate-600" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
              }`} />
          </div>
          <input value={note} onChange={e => setNote(e.target.value)}
            placeholder="Note (e.g., For dinner split)"
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-blue-500/50 transition-colors ${
              isDark ? "bg-slate-800/60 border-slate-700/30 text-white placeholder:text-slate-600" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
            }`} />
        </div>
      </div>

      {/* Payment Link */}
      <div className="card-hover p-5">
        <h3 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>Payment Deep Link</h3>
        <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-800/60 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}>
          <p className={`text-xs font-mono break-all ${isDark ? "text-slate-400" : "text-slate-500"}`}>{qrData}</p>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(qrData); }}
          className={`mt-3 px-4 py-2 rounded-lg border text-sm flex items-center gap-2 transition-all ${
            isDark ? "border-slate-700/30 text-slate-300 hover:text-white" : "border-slate-200 text-slate-600 hover:text-slate-900 bg-white"
          }`}>
          <FiCopy size={12} /> Copy Link
        </button>
      </div>
    </div>
  );
}
