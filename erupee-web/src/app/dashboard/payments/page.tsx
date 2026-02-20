"use client";

import Link from "next/link";
import {
  FiSend, FiDownload, FiDollarSign, FiLock,
  FiSmartphone, FiWifi, FiMaximize,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { formatINR } from "@/lib/utils";

export default function PaymentsHub() {
  const { balance, loading } = useWallet();
  const avail = balance ? parseFloat(balance.available) : 0;

  const actions = [
    {
      label: "Send Money (P2P)",
      desc: "Transfer eINR to any wallet address. Real on-chain transaction with blockchain confirmation.",
      href: "/dashboard/payments/send",
      icon: FiSend,
      color: "from-blue-600 to-blue-500",
      badge: "LIVE",
    },
    {
      label: "Receive / QR Code",
      desc: "Share your wallet address or generate a QR code for receiving payments.",
      href: "/dashboard/payments/receive",
      icon: FiDownload,
      color: "from-emerald-600 to-emerald-500",
      badge: "LIVE",
    },
    {
      label: "Mint eINR",
      desc: "Issue new Digital Rupee tokens from RBI reserve. Admin-authorized minting to your wallet.",
      href: "/dashboard/payments/mint",
      icon: FiDollarSign,
      color: "from-green-600 to-green-500",
      badge: "BLOCKCHAIN",
    },
    {
      label: "Lock Tokens",
      desc: "Time-lock tokens for FD, escrow, or compliance. Set unlock dates and attach documents.",
      href: "/dashboard/payments/lock",
      icon: FiLock,
      color: "from-amber-600 to-amber-500",
      badge: "SMART CONTRACT",
    },
  ];

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-slate-400 text-sm mt-0.5">Send, receive, mint, and manage your Digital Rupee</p>
      </div>

      {/* Available Balance */}
      <div className="card-hover p-5 border-l-4 border-l-emerald-500">
        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Available to Spend</p>
        <p className="text-emerald-400 text-2xl font-bold">{loading ? "..." : formatINR(avail)}</p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link key={action.label} href={action.href}
            className="card-hover p-6 group hover:border-blue-500/30 transition-all flex gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
              <action.icon className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-semibold">{action.label}</p>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-500/15 text-blue-400">{action.badge}</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity Summary */}
      <div className="card-hover p-5">
        <h3 className="text-white font-semibold mb-3">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Choose Action", desc: "Select send, receive, mint, or lock from above" },
            { step: "2", title: "Fill Details", desc: "Enter amount, recipient address, and optional notes" },
            { step: "3", title: "Blockchain Confirm", desc: "Transaction is processed on Hardhat blockchain and you get a tx hash" },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{s.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
