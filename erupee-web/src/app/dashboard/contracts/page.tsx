"use client";

import { useState, useMemo } from "react";
import {
  FiCode, FiCheckCircle, FiClock, FiZap, FiFileText, FiCopy, FiPlay, FiTerminal,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const CONTRACT_FUNCTIONS = [
  "balanceOf", "totalSupply", "name", "symbol", "decimals",
  "mint", "transfer", "lockTokens", "releaseTokens",
  "availableBalanceOf", "lockedBalanceOf", "locksOf",
  "approve", "allowance", "transferFrom",
];

function shortAddr(a: string, n = 6) {
  if (!a || a.length < 12) return a;
  return `${a.slice(0, n + 2)}...${a.slice(-n)}`;
}

function fmtINR(v: number) {
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ContractsPage() {
  const { user, balance, transactions, networkInfo, refreshAll } = useWallet();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [interactFn, setInteractFn] = useState("");
  const [interactArgs, setInteractArgs] = useState("");
  const [callResult, setCallResult] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const [copied, setCopied] = useState(false);

  const address = balance?.address || user?.walletAddress || "";

  const contractEvents = useMemo(() => {
    return transactions.slice(0, 15).map(tx => ({
      event: tx.type === "mint" ? "TokensMinted" : tx.type === "lock" ? "TokensLocked" : tx.type === "release" ? "TokensReleased" : "Transfer",
      contract: "eRupeeToken",
      txHash: tx.txHash,
      amount: tx.amount,
      timestamp: tx.createdAt,
    }));
  }, [transactions]);

  const handleCall = async () => {
    if (!interactFn || !user) return;
    setCalling(true);
    setCallResult(null);
    try {
      const fn = interactFn.trim().toLowerCase();
      if (fn === "balanceof" || fn === "balance") {
        const res = await api.getBalance(user.id);
        setCallResult(`Result: ${res.balance} eINR (available: ${res.available}, locked: ${res.locked})`);
      } else if (fn === "totalsupply" || fn === "name" || fn === "symbol" || fn === "decimals") {
        if (fn === "name") setCallResult("Result: Digital Rupee");
        else if (fn === "symbol") setCallResult("Result: eINR");
        else if (fn === "decimals") setCallResult("Result: 18");
        else { const info = await api.getNetworkInfo(); setCallResult(`Result: Query totalSupply via contract at ${info.contractAddress}`); }
      } else if (fn === "mint") {
        const amt = interactArgs.trim() || "100";
        const res = await api.mint(user.id, amt);
        setCallResult(`✓ Minted ${amt} eINR — TX: ${res.tx}`);
        refreshAll();
      } else if (fn === "transfer") {
        const parts = interactArgs.split(",").map(s => s.trim());
        if (parts.length < 2) {
          setCallResult("Error: transfer requires args: <toAddress>, <amount>");
        } else {
          const res = await api.transfer(user.id, parts[0], parts[1]);
          setCallResult(`✓ Transferred ${parts[1]} eINR → ${shortAddr(parts[0])} — TX: ${res.tx}`);
          refreshAll();
        }
      } else if (fn === "locktokens" || fn === "lock") {
        const parts = interactArgs.split(",").map(s => s.trim());
        const amt = parts[0] || "100";
        const dur = parseInt(parts[1] || "86400");
        const res = await api.lock(user.id, amt, Math.floor(Date.now() / 1000) + dur);
        setCallResult(`✓ Locked ${amt} eINR for ${dur}s — TX: ${res.tx}`);
        refreshAll();
      } else if (fn === "getnetworkinfo" || fn === "info") {
        const info = await api.getNetworkInfo();
        setCallResult(`Block: ${info.blockNumber} | Chain: ${info.chainId} | Gas: ${info.gasPrice} wei | Contract: ${shortAddr(info.contractAddress)}`);
      } else {
        setCallResult(`Function "${interactFn}" — read-only: balanceOf, name, symbol, decimals. Write: mint, transfer, lock.`);
      }
    } catch (e: unknown) {
      setCallResult(`Error: ${e instanceof Error ? e.message : "Call failed"}`);
    } finally {
      setCalling(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const labelCls = `text-xs mb-1 block ${isDark ? "text-slate-500" : "text-slate-400"}`;
  const inputCls = `w-full px-3 py-2 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50 border transition-all ${isDark
      ? "bg-slate-800/80 border-slate-700/30 text-white placeholder:text-slate-600"
      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
    }`;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Smart Contracts</h1>
        <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Deploy, interact, and monitor on-chain contracts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Contract Info Sidebar */}
        <div className="card-hover p-5">
          <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Deployed Contracts</h3>
          <div className="space-y-2">
            <div className="w-full p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>eRupeeToken</p>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-500">ACTIVE</span>
              </div>
              <p className={`text-xs font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>{shortAddr(CONTRACT_ADDRESS)}</p>
              <p className={`text-[10px] mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>Solidity ^0.8.20 • ERC-20 + Locks</p>
            </div>

            {networkInfo && (
              <div className={`p-3 rounded-xl border space-y-2 mt-4 ${isDark ? "bg-slate-800/40 border-slate-700/20" : "bg-slate-50 border-slate-200"}`}>
                <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Network</p>
                {[
                  { label: "Chain ID", value: networkInfo.chainId, cls: isDark ? "text-white" : "text-slate-900" },
                  { label: "Block", value: `#${networkInfo.blockNumber}`, cls: "text-blue-500" },
                  { label: "Gas Price", value: `${networkInfo.gasPrice} wei`, cls: isDark ? "text-white" : "text-slate-900" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{row.label}</span>
                    <span className={`text-xs font-mono ${row.cls}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contract Detail + Console */}
        <div className="lg:col-span-2 space-y-4">
          {/* Detail Card */}
          <div className="card-hover p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                  <FiCode size={18} />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>eRupeeToken</h3>
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Solidity ^0.8.20 • OpenZeppelin v5.4.0</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500">ACTIVE</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                { label: "Address", value: shortAddr(CONTRACT_ADDRESS, 10), cls: isDark ? "text-white" : "text-slate-900" },
                { label: "Network", value: networkInfo?.networkName || "Hardhat", cls: isDark ? "text-white" : "text-slate-900" },
                { label: "Total Calls", value: transactions.length.toString(), cls: isDark ? "text-white" : "text-slate-900" },
                { label: "Your Balance", value: fmtINR(parseFloat(balance?.balance || "0")), cls: "text-emerald-500 font-bold" },
              ].map(item => (
                <div key={item.label}>
                  <span className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.label}</span>
                  <p className={`text-sm font-mono mt-0.5 ${item.cls}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div>
              <span className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Contract Address</span>
              <div className={`flex items-center gap-2 mt-1 p-2 rounded-lg border ${isDark ? "bg-slate-800/60 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}>
                <span className={`text-xs font-mono flex-1 break-all ${isDark ? "text-slate-300" : "text-slate-700"}`}>{CONTRACT_ADDRESS}</span>
                <button onClick={copyAddress} className={`transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>
                  {copied ? <FiCheckCircle size={14} className="text-emerald-500" /> : <FiCopy size={14} />}
                </button>
              </div>
            </div>

            {/* ABI Functions */}
            <div className="mt-5">
              <span className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>ABI Functions</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CONTRACT_FUNCTIONS.map((fn, j) => (
                  <button
                    key={j}
                    onClick={() => setInteractFn(fn)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${interactFn === fn
                        ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                        : isDark
                          ? "bg-slate-800/60 text-slate-400 border-slate-700/20 hover:text-white"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-900"
                      }`}
                  >
                    {fn}()
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contract Console */}
          <div className="card-hover p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiTerminal className="text-violet-500" size={16} />
              <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Contract Console</h3>
              <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-2">LIVE</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Function</label>
                <input value={interactFn} onChange={e => setInteractFn(e.target.value)} placeholder="e.g. balanceOf, mint, transfer" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Arguments (comma-separated)</label>
                <input value={interactArgs} onChange={e => setInteractArgs(e.target.value)} placeholder="e.g. 0x1234..., 100" className={inputCls} />
              </div>
              <button onClick={handleCall} disabled={!interactFn || calling} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-40">
                {calling ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Calling...</>
                ) : (
                  <><FiPlay size={12} /> Execute</>
                )}
              </button>
              {callResult && (
                <div className={`p-3 rounded-lg border ${isDark ? "bg-slate-800/80" : "bg-slate-50"} ${callResult.startsWith("Error") ? "border-red-500/20" : "border-emerald-500/20"}`}>
                  <span className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Output</span>
                  <p className={`text-sm font-mono mt-1 ${callResult.startsWith("Error") ? "text-red-500" : "text-emerald-500"}`}>{callResult}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contract Events Table */}
      <div className="card-hover p-5">
        <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Contract Events</h3>
        {contractEvents.length === 0 ? (
          <p className={`text-sm text-center py-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>No events yet — interact with the contract to generate events</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  {["Event", "Contract", "Amount", "Tx Hash", "Time"].map(h => (
                    <th key={h} className={`text-xs uppercase tracking-wider font-medium pb-3 px-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contractEvents.map((ev, i) => (
                  <tr key={i} className={`transition-colors ${isDark ? "hover:bg-slate-800/20" : "hover:bg-slate-50"}`}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <FiZap className="text-amber-500" size={12} />
                        <span className={`text-sm font-mono ${isDark ? "text-white" : "text-slate-900"}`}>{ev.event}</span>
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{ev.contract}</td>
                    <td className="py-3 px-3 text-emerald-500 text-sm font-mono">{fmtINR(ev.amount)}</td>
                    <td className={`py-3 px-3 text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>{ev.txHash.slice(0, 14)}...</td>
                    <td className={`py-3 px-3 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{timeAgo(ev.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Source Code */}
      <div className="card-hover p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiFileText className="text-blue-500" size={16} />
            <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>eRupeeToken.sol — Verified Source</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">✓ VERIFIED</span>
        </div>
        <pre className={`text-xs leading-loose p-4 rounded-xl overflow-x-auto border ${isDark ? "bg-slate-900/80 border-slate-800/60 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
          {`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract eRupeeToken is ERC20, Ownable {
    struct Lock {
        uint256 amount;
        uint256 releaseTime;
        string  reason;
        bool    released;
    }

    mapping(address => Lock[]) public locks;

    event TokensMinted(address indexed to, uint256 amount);
    event TokensLocked(address indexed user, uint256 amount, uint256 until);
    event TokensReleased(address indexed user, uint256 lockIndex);

    constructor() ERC20("Digital Rupee", "eINR") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function lockTokens(address user, uint256 amount, uint256 duration,
                        string calldata reason) external onlyOwner {
        require(balanceOf(user) >= amount, "Insufficient balance");
        _transfer(user, address(this), amount);
        locks[user].push(Lock(amount, block.timestamp + duration, reason, false));
        emit TokensLocked(user, amount, block.timestamp + duration);
    }

    function releaseTokens(address user, uint256 idx) external onlyOwner {
        Lock storage l = locks[user][idx];
        require(!l.released, "Already released");
        require(block.timestamp >= l.releaseTime, "Lock active");
        l.released = true;
        _transfer(address(this), user, l.amount);
        emit TokensReleased(user, idx);
    }
}`}
        </pre>
      </div>
    </div>
  );
}
