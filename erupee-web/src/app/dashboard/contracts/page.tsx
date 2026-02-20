"use client";

import { useState, useMemo } from "react";
import {
  FiCode, FiCheckCircle, FiClock, FiExternalLink,
  FiZap, FiFileText, FiCopy, FiPlay, FiTerminal,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { api } from "@/lib/api";

/*
 * ═══════════════════════════════════════════════════════════════
 *  Smart Contract Management Console
 *  Architecture: Hardhat local chain → eRupeeToken (ERC-20)
 *  Languages: Solidity ^0.8.20 (OpenZeppelin v5)
 *  Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
 * ═══════════════════════════════════════════════════════════════
 */

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
  const [interactFn, setInteractFn] = useState("");
  const [interactArgs, setInteractArgs] = useState("");
  const [callResult, setCallResult] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const [copied, setCopied] = useState(false);

  const address = balance?.address || user?.walletAddress || "";

  // Derive contract events from real transactions
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
        const info = await api.getNetworkInfo();
        if (fn === "name") setCallResult("Result: Digital Rupee");
        else if (fn === "symbol") setCallResult("Result: eINR");
        else if (fn === "decimals") setCallResult("Result: 18");
        else setCallResult(`Result: Query totalSupply via contract at ${info.contractAddress}`);
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
        setCallResult(`Function "${interactFn}" — read-only calls available: balanceOf, name, symbol, decimals. Write calls: mint, transfer, lock.`);
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

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Smart Contracts</h1>
        <p className="text-slate-400 text-sm mt-0.5">Deploy, interact, and monitor on-chain contracts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Contract Info */}
        <div className="card-hover p-5">
          <h3 className="text-white font-semibold mb-4">Deployed Contracts</h3>
          <div className="space-y-2">
            {/* The real deployed contract */}
            <div className="w-full p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white text-sm font-semibold">eRupeeToken</p>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400">ACTIVE</span>
              </div>
              <p className="text-slate-500 text-xs font-mono">{shortAddr(CONTRACT_ADDRESS)}</p>
              <p className="text-slate-600 text-[10px] mt-1">Solidity ^0.8.20 • ERC-20 + Locks</p>
            </div>
            {/* Network Info */}
            {networkInfo && (
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/20 space-y-2 mt-4">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider">Network</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-xs">Chain ID</span>
                    <span className="text-white text-xs font-mono">{networkInfo.chainId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-xs">Block</span>
                    <span className="text-blue-400 text-xs font-mono">#{networkInfo.blockNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-xs">Gas Price</span>
                    <span className="text-white text-xs font-mono">{networkInfo.gasPrice} wei</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contract Detail + Interact */}
        <div className="lg:col-span-2 space-y-4">
          {/* Detail Card */}
          <div className="card-hover p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <FiCode size={18} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">eRupeeToken</h3>
                  <p className="text-slate-500 text-xs">Solidity ^0.8.20 • OpenZeppelin v5.4.0</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400">
                ACTIVE
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Address</span>
                <p className="text-white text-sm font-mono mt-0.5">{shortAddr(CONTRACT_ADDRESS, 10)}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Network</span>
                <p className="text-white text-sm font-mono mt-0.5">{networkInfo?.networkName || "Hardhat"}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Total Calls</span>
                <p className="text-white text-sm font-mono mt-0.5">{transactions.length}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Your Balance</span>
                <p className="text-emerald-400 text-sm font-bold mt-0.5">{fmtINR(parseFloat(balance?.balance || "0"))}</p>
              </div>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase tracking-wider">Contract Address</span>
              <div className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <span className="text-slate-300 text-xs font-mono flex-1 break-all">{CONTRACT_ADDRESS}</span>
                <button onClick={copyAddress} className="text-slate-400 hover:text-white transition-colors">
                  {copied ? <FiCheckCircle size={14} className="text-emerald-400" /> : <FiCopy size={14} />}
                </button>
              </div>
            </div>

            {/* Available Functions */}
            <div className="mt-5">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider">ABI Functions</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CONTRACT_FUNCTIONS.map((fn, j) => (
                  <button
                    key={j}
                    onClick={() => setInteractFn(fn)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${interactFn === fn ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-slate-800/60 text-slate-400 border border-slate-700/20 hover:text-white"}`}
                  >
                    {fn}()
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interact Console */}
          <div className="card-hover p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiTerminal className="text-violet-400" size={16} />
              <h3 className="text-white font-semibold">Contract Console</h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-2">LIVE</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-slate-500 text-xs mb-1 block">Function</label>
                <input
                  value={interactFn}
                  onChange={e => setInteractFn(e.target.value)}
                  placeholder="e.g. balanceOf, mint, transfer"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/30 text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs mb-1 block">Arguments (comma-separated)</label>
                <input
                  value={interactArgs}
                  onChange={e => setInteractArgs(e.target.value)}
                  placeholder="e.g. 0x1234..., 100"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/30 text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <button
                onClick={handleCall}
                disabled={!interactFn || calling}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-40"
              >
                {calling ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Calling...
                  </>
                ) : (
                  <>
                    <FiPlay size={12} />
                    Execute
                  </>
                )}
              </button>
              {callResult && (
                <div className={`p-3 rounded-lg bg-slate-800/80 border ${callResult.startsWith("Error") ? "border-red-500/20" : "border-emerald-500/20"}`}>
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider">Output</span>
                  <p className={`text-sm font-mono mt-1 ${callResult.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>{callResult}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events from real transactions */}
      <div className="card-hover p-5">
        <h3 className="text-white font-semibold mb-4">Contract Events</h3>
        {contractEvents.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No events yet — interact with the contract to generate events</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  {["Event", "Contract", "Amount", "Tx Hash", "Time"].map(h => (
                    <th key={h} className="text-slate-500 text-xs uppercase tracking-wider font-medium pb-3 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contractEvents.map((ev, i) => (
                  <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <FiZap className="text-amber-400" size={12} />
                        <span className="text-white text-sm font-mono">{ev.event}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-sm">{ev.contract}</td>
                    <td className="py-3 px-3 text-emerald-400 text-sm font-mono">{fmtINR(ev.amount)}</td>
                    <td className="py-3 px-3 text-slate-400 text-xs font-mono">{ev.txHash.slice(0, 14)}...</td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{timeAgo(ev.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Source Code Preview */}
      <div className="card-hover p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiFileText className="text-blue-400" size={16} />
            <h3 className="text-white font-semibold">eRupeeToken.sol — Verified Source</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">✓ VERIFIED</span>
        </div>
        <pre className="text-slate-400 text-xs leading-loose bg-slate-900/80 p-4 rounded-xl overflow-x-auto border border-slate-800/60">
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
