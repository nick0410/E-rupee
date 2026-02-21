"use client";

import { useState, useMemo } from "react";
import {
  FiGlobe, FiUsers, FiDollarSign, FiClock, FiMapPin, FiTag,
  FiAlertCircle, FiCheck, FiChevronDown, FiChevronUp, FiZap,
  FiPlay, FiPause, FiSend,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { api } from "@/lib/api";

/*
 * ═══════════════════════════════════════════════════════════════
 *  Government Subsidy — Programmable Token System
 *  Architecture: gov-service → smart-contract (SubsidyDistributor)
 *  Features: time-locked, geo-fenced, usage-restricted tokens
 *  Blockchain: Programmable money with on-chain restrictions
 * ═══════════════════════════════════════════════════════════════
 */

// Local subsidy scheme definitions (on-chain metadata would live here in production)
interface Restriction {
  type: string;
  label: string;
  description: string;
  params: Record<string, unknown>;
}

interface SubsidyScheme {
  id: string;
  name: string;
  ministry: string;
  status: "active" | "paused" | "completed";
  restrictions: Restriction[];
}

const SCHEMES: SubsidyScheme[] = [
  {
    id: "pm-kisan",
    name: "PM-KISAN Direct Transfer",
    ministry: "Ministry of Agriculture",
    status: "active",
    restrictions: [
      { type: "usage-restrict", label: "Agri Only", description: "Tokens can only be spent at registered agri-merchants", params: { category: "agriculture" } },
      { type: "expiry", label: "90-day Expiry", description: "Tokens expire 90 days after disbursement", params: { days: 90 } },
      { type: "geo-fence", label: "State Locked", description: "Usable only within beneficiary's registered state", params: { radius: "state" } },
    ],
  },
  {
    id: "lpg-subsidy",
    name: "LPG Subsidy (PAHAL)",
    ministry: "Ministry of Petroleum",
    status: "active",
    restrictions: [
      { type: "usage-restrict", label: "Fuel Only", description: "Restricted to LPG purchases at authorized dealers", params: { category: "fuel" } },
      { type: "time-lock", label: "Monthly Release", description: "Tokens released monthly on the 1st", params: { interval: "30d" } },
    ],
  },
  {
    id: "scholarship",
    name: "National Scholarship Portal",
    ministry: "Ministry of Education",
    status: "active",
    restrictions: [
      { type: "usage-restrict", label: "Education Only", description: "Tokens restricted to tuition and book purchases", params: { category: "education" } },
      { type: "expiry", label: "Semester Expiry", description: "Valid for current academic semester only", params: { days: 180 } },
    ],
  },
  {
    id: "mgnrega",
    name: "MGNREGA Wage Payment",
    ministry: "Ministry of Rural Development",
    status: "paused",
    restrictions: [
      { type: "geo-fence", label: "Panchayat Locked", description: "Usable within registered Gram Panchayat", params: { radius: "panchayat" } },
    ],
  },
];

function fmtINR(v: number) {
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function GovernmentPage() {
  const { user, balance, transactions, locks, refreshAll } = useWallet();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [distributing, setDistributing] = useState<string | null>(null);
  const [disburseTo, setDisburseTo] = useState("");
  const [disburseAmt, setDisburseAmt] = useState("");
  const [disburseStatus, setDisburseStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [disburseMsg, setDisburseMsg] = useState("");

  const address = balance?.address || user?.walletAddress || "";

  // Derive stats from real data
  const stats = useMemo(() => {
    const mintTxs = transactions.filter(t => t.type === "mint");
    const totalMinted = mintTxs.reduce((s, t) => s + t.amount, 0);
    const lockCount = locks.length;
    const totalLocked = locks.reduce((s, l) => s + parseFloat(l.amount), 0);
    const activeSchemes = SCHEMES.filter(s => s.status === "active").length;
    return { totalMinted, lockCount, totalLocked, activeSchemes, mintTxs: mintTxs.length };
  }, [transactions, locks]);

  const restrictionIcon = (type: string) => {
    switch (type) {
      case "time-lock": return <FiClock size={12} />;
      case "geo-fence": return <FiMapPin size={12} />;
      case "usage-restrict": return <FiTag size={12} />;
      case "expiry": return <FiAlertCircle size={12} />;
      default: return <FiZap size={12} />;
    }
  };

  const restrictionColor = (type: string) => {
    switch (type) {
      case "time-lock": return "bg-amber-500/15 text-amber-400 border-amber-500/20";
      case "geo-fence": return "bg-blue-500/15 text-blue-400 border-blue-500/20";
      case "usage-restrict": return "bg-violet-500/15 text-violet-400 border-violet-500/20";
      case "expiry": return "bg-red-500/15 text-red-400 border-red-500/20";
      default: return "bg-slate-500/15 text-slate-400 border-slate-500/20";
    }
  };

  const schemeStatusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-emerald-500/15 text-emerald-400";
      case "paused": return "bg-amber-500/15 text-amber-400";
      case "completed": return "bg-blue-500/15 text-blue-400";
      default: return "bg-slate-500/15 text-slate-400";
    }
  };

  const handleDisburse = async (schemeId: string) => {
    if (!user) return;
    setDistributing(schemeId);
    setDisburseStatus("processing");
    setDisburseMsg("");
    try {
      const res = await api.mint(user.id, disburseAmt || "1000");
      setDisburseStatus("success");
      setDisburseMsg(`Disbursed ${fmtINR(parseFloat(disburseAmt || "1000"))} eINR — TX: ${res.tx.slice(0, 14)}...`);
      setDisburseAmt("");
      refreshAll();
    } catch (e: unknown) {
      setDisburseStatus("error");
      setDisburseMsg(e instanceof Error ? e.message : "Disbursement failed");
    } finally {
      setTimeout(() => { setDistributing(null); setDisburseStatus("idle"); }, 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Government & Subsidies</h1>
        <p className="text-slate-400 text-sm mt-0.5">Programmable token distribution with smart contract enforcement</p>
      </div>

      {/* Overview Stats — derived from real blockchain data */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card-hover p-4 text-center">
          <FiDollarSign className="text-emerald-400 text-xl mx-auto mb-2" />
          <p className="text-white text-xl font-bold">{fmtINR(stats.totalMinted)}</p>
          <p className="text-slate-500 text-xs">Total Minted (Disbursed)</p>
        </div>
        <div className="card-hover p-4 text-center">
          <FiZap className="text-blue-400 text-xl mx-auto mb-2" />
          <p className="text-white text-xl font-bold">{stats.mintTxs}</p>
          <p className="text-slate-500 text-xs">Mint Transactions</p>
        </div>
        <div className="card-hover p-4 text-center">
          <FiUsers className="text-violet-400 text-xl mx-auto mb-2" />
          <p className="text-white text-xl font-bold">{fmtINR(stats.totalLocked)}</p>
          <p className="text-slate-500 text-xs">Locked (Earmarked)</p>
        </div>
        <div className="card-hover p-4 text-center">
          <FiGlobe className="text-amber-400 text-xl mx-auto mb-2" />
          <p className="text-white text-xl font-bold">{stats.activeSchemes}</p>
          <p className="text-slate-500 text-xs">Active Schemes</p>
        </div>
      </div>

      {/* Quick Disburse */}
      {disburseMsg && (
        <div className={`p-3 rounded-xl text-sm font-medium ${disburseStatus === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          {disburseMsg}
        </div>
      )}

      {/* Scheme Cards */}
      <div className="space-y-4">
        {SCHEMES.map(scheme => {
          const isExpanded = expanded === scheme.id;
          return (
            <div key={scheme.id} className="card-hover overflow-hidden">
              {/* Header */}
              <div className="p-5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : scheme.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <FiGlobe size={22} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{scheme.name}</h3>
                      <p className="text-slate-400 text-sm">{scheme.ministry}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {scheme.restrictions.map((r, i) => (
                          <span key={i} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${restrictionColor(r.type)}`}>
                            {restrictionIcon(r.type)} {r.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${schemeStatusColor(scheme.status)}`}>{scheme.status}</span>
                    {isExpanded ? <FiChevronUp className="text-slate-400" /> : <FiChevronDown className="text-slate-400" />}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-800/60 p-5 space-y-5 animate-fade-in">
                  {/* Token Restrictions Detail */}
                  <div>
                    <h4 className="text-white text-sm font-semibold mb-3">Programmable Token Rules</h4>
                    <div className="space-y-2">
                      {scheme.restrictions.map((r, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${restrictionColor(r.type).split(" ").slice(0, 2).join(" ")}`}>
                            {restrictionIcon(r.type)}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{r.label}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{r.description}</p>
                            <code className="text-[10px] text-blue-400/70 font-mono mt-1.5 block">{JSON.stringify(r.params)}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Disburse Action — real API call */}
                  <div className="space-y-3">
                    <label className="text-slate-500 text-xs">Disburse Amount (eINR)</label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={disburseAmt}
                        onChange={e => setDisburseAmt(e.target.value)}
                        placeholder="1000"
                        className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/30 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                      />
                      <button
                        onClick={() => handleDisburse(scheme.id)}
                        disabled={distributing === scheme.id || scheme.status !== "active"}
                        className="px-6 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {distributing === scheme.id ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><FiSend size={14} /> Disburse</>}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {[500, 1000, 5000, 10000].map(v => (
                        <button key={v} onClick={() => setDisburseAmt(String(v))} className="px-3 py-1 rounded-lg text-xs bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/20 transition-colors">
                          {fmtINR(v)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Wallet Info */}
      <div className="card-hover p-5">
        <h3 className="text-white font-semibold mb-4">Your Wallet — Subsidy Recipient</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/40">
            <p className="text-slate-500 text-[10px] uppercase tracking-wider">Wallet Address</p>
            <p className="text-blue-400 text-xs font-mono mt-1 break-all">{address || "Not connected"}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40">
            <p className="text-slate-500 text-[10px] uppercase tracking-wider">Available Balance</p>
            <p className="text-emerald-400 text-lg font-bold mt-1">{fmtINR(parseFloat(balance?.available || "0"))}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40">
            <p className="text-slate-500 text-[10px] uppercase tracking-wider">Locked (Earmarked)</p>
            <p className="text-amber-400 text-lg font-bold mt-1">{fmtINR(parseFloat(balance?.locked || "0"))}</p>
          </div>
        </div>
      </div>

      {/* Recent Disbursements from real transaction data */}
      {transactions.filter(t => t.type === "mint").length > 0 && (
        <div className="card-hover p-5">
          <h3 className="text-white font-semibold mb-4">Recent Disbursements (Mint Events)</h3>
          <div className="space-y-2">
            {transactions
              .filter(t => t.type === "mint")
              .slice(0, 8)
              .map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                      <FiCheck size={14} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{fmtINR(t.amount)}</p>
                      <p className="text-slate-500 text-[10px] font-mono">{t.txHash.slice(0, 18)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.status === "confirmed" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>{t.status}</span>
                    <p className="text-slate-500 text-[10px] mt-1">{new Date(t.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Smart Contract Info */}
      <div className="card-hover p-5">
        <h3 className="text-white font-semibold mb-3">Programmable Money — Smart Contract Logic</h3>
        <p className="text-slate-400 text-sm mb-3">All subsidy tokens are governed by on-chain smart contracts with enforced restrictions:</p>
        <div className="bg-slate-800/40 rounded-xl p-4 font-mono text-xs text-slate-400 space-y-1 overflow-x-auto">
          <p className="text-emerald-400">// SubsidyDistributor.sol — Programmable Money Rules</p>
          <p><span className="text-blue-400">function</span> <span className="text-white">distributeSubsidy</span>(address beneficiary, uint256 amount) {"{"}</p>
          <p className="pl-4"><span className="text-amber-400">require</span>(kycVerified[beneficiary], <span className="text-emerald-400">&quot;KYC not verified&quot;</span>);</p>
          <p className="pl-4"><span className="text-amber-400">require</span>(isGeoFenced(beneficiary), <span className="text-emerald-400">&quot;Outside geo-fence&quot;</span>);</p>
          <p className="pl-4">eRupee.mint(beneficiary, amount);</p>
          <p className="pl-4">tokenExpiry[beneficiary] = block.timestamp + <span className="text-violet-400">90 days</span>;</p>
          <p className="pl-4">usageRestriction[beneficiary] = schemeCategory;</p>
          <p>{"}"}</p>
        </div>
      </div>
    </div>
  );
}
