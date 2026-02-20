"use client";

import { useState } from "react";
import {
  FiBox, FiCpu, FiCheckCircle, FiClock,
  FiLayers, FiShield, FiServer, FiRefreshCw,
  FiCopy, FiCheck,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";

export default function BlockchainPage() {
  const { networkInfo, balance, transactions, refreshNetwork, loading } = useWallet();
  const [tab, setTab] = useState<'overview' | 'contract' | 'network'>('overview');
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blockchain Explorer</h1>
          <p className="text-slate-400 text-sm mt-0.5">Live network data from Hardhat blockchain</p>
        </div>
        <button onClick={() => refreshNetwork()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-300 text-sm hover:border-blue-500/40 transition-all">
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Live Network Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Block Height', value: networkInfo ? `#${networkInfo.blockNumber}` : '—', icon: <FiLayers size={16} />, color: 'text-blue-400' },
          { label: 'Chain ID', value: networkInfo ? networkInfo.chainId.toString() : '—', icon: <FiShield size={16} />, color: 'text-emerald-400' },
          { label: 'Gas Price', value: networkInfo ? `${networkInfo.gasPrice} Gwei` : '—', icon: <FiCpu size={16} />, color: 'text-violet-400' },
          { label: 'Transactions', value: transactions.length.toString(), icon: <FiClock size={16} />, color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="card-hover p-4 stat-glow">
            <div className="flex items-center gap-2 mb-2">
              <span className={s.color}>{s.icon}</span>
              <span className="text-slate-500 text-xs uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-white text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-0.5 bg-slate-800/40 border border-slate-700/30 rounded-lg w-fit">
        {(['overview', 'contract', 'network'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab - Wallet & Transaction data */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Wallet On-Chain Data */}
          <div className="card-hover p-5">
            <h3 className="text-white font-semibold mb-4">Your On-Chain Account</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Wallet Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 text-sm font-mono">{balance?.address ? `${balance.address.slice(0,10)}...${balance.address.slice(-6)}` : '—'}</span>
                  {balance?.address && (
                    <button onClick={() => copyText(balance.address!, 'addr')} className="text-slate-400 hover:text-white">
                      {copied === 'addr' ? <FiCheck size={12} /> : <FiCopy size={12} />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Total Balance</span>
                <span className="text-white font-semibold">₹{(balance?.total ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Available</span>
                <span className="text-emerald-400 font-semibold">₹{(balance?.available ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Locked</span>
                <span className="text-amber-400 font-semibold">₹{(balance?.locked ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Recent On-Chain Transactions */}
          <div className="card-hover p-5">
            <h3 className="text-white font-semibold mb-4">Recent On-Chain Transactions</h3>
            {transactions.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No transactions recorded</p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 8).map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'MINT' ? 'bg-emerald-500/15 text-emerald-400' :
                        tx.type === 'TRANSFER' ? 'bg-blue-500/15 text-blue-400' :
                        tx.type === 'LOCK' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-slate-500/15 text-slate-400'
                      }`}>{tx.type}</span>
                      <span className="text-white text-sm">₹{tx.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {tx.txHash && (
                        <span className="text-slate-500 text-xs font-mono">{tx.txHash.slice(0,10)}...</span>
                      )}
                      <span className="text-slate-600 text-xs">{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract Tab - Real contract info */}
      {tab === 'contract' && (
        <div className="space-y-4">
          <div className="card-hover p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">eRupeeToken Contract</h3>
              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">DEPLOYED</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 text-xs font-mono">{contractAddress.slice(0,10)}...{contractAddress.slice(-6)}</span>
                  <button onClick={() => copyText(contractAddress, 'contract')} className="text-slate-400 hover:text-white">
                    {copied === 'contract' ? <FiCheck size={12} /> : <FiCopy size={12} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Standard</span>
                <span className="text-white text-sm">ERC-20</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Name</span>
                <span className="text-white text-sm">eRupee</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Symbol</span>
                <span className="text-white text-sm">eINR</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Decimals</span>
                <span className="text-white text-sm">18</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Solidity</span>
                <span className="text-white text-sm">^0.8.20</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">OpenZeppelin</span>
                <span className="text-white text-sm">v5.4.0</span>
              </div>
            </div>
          </div>

          <div className="card-hover p-5">
            <h3 className="text-white font-semibold mb-4">Contract Functions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { name: 'mint(address, uint256)', type: 'write', desc: 'Issue new eINR tokens' },
                { name: 'transfer(address, uint256)', type: 'write', desc: 'Transfer tokens' },
                { name: 'lockTokens(uint256, uint256)', type: 'write', desc: 'Time-lock tokens' },
                { name: 'releaseExpiredLocks()', type: 'write', desc: 'Release expired locks' },
                { name: 'balanceOf(address)', type: 'read', desc: 'Check total balance' },
                { name: 'availableBalanceOf(address)', type: 'read', desc: 'Check available balance' },
                { name: 'lockedBalanceOf(address)', type: 'read', desc: 'Check locked balance' },
                { name: 'locksOf(address)', type: 'read', desc: 'View all locks' },
              ].map((fn, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${fn.type === 'write' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>{fn.type.toUpperCase()}</span>
                    <span className="text-white text-xs font-mono">{fn.name}</span>
                  </div>
                  <p className="text-slate-500 text-[10px]">{fn.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Network Tab */}
      {tab === 'network' && (
        <div className="space-y-4">
          <div className="card-hover p-5">
            <h3 className="text-white font-semibold mb-4">Network Configuration</h3>
            <div className="space-y-3">
              {[
                { k: 'Network', v: 'Hardhat Local Node' },
                { k: 'RPC URL', v: 'http://127.0.0.1:8545' },
                { k: 'Chain ID', v: networkInfo ? networkInfo.chainId.toString() : '31337' },
                { k: 'Block Number', v: networkInfo ? `#${networkInfo.blockNumber}` : '—' },
                { k: 'Gas Price', v: networkInfo ? `${networkInfo.gasPrice} Gwei` : '—' },
                { k: 'Consensus', v: 'Proof of Authority (Hardhat)' },
                { k: 'Block Time', v: 'Instant (on-demand)' },
                { k: 'Backend API', v: 'http://localhost:8000' },
              ].map((r, j) => (
                <div key={j} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/40">
                  <span className="text-slate-400 text-sm">{r.k}</span>
                  <span className="text-slate-200 text-sm font-mono">{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-hover p-5">
            <h3 className="text-white font-semibold mb-4">Hardhat Accounts</h3>
            <p className="text-slate-500 text-xs mb-3">Pre-funded test accounts with 10,000 ETH each</p>
            <div className="space-y-2">
              {[
                { label: 'Admin (Deployer)', addr: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
                { label: 'Account #1', addr: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
                { label: 'Account #2', addr: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
              ].map((acc, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div>
                    <p className="text-white text-sm font-medium">{acc.label}</p>
                    <p className="text-blue-400 text-xs font-mono">{acc.addr.slice(0,14)}...{acc.addr.slice(-6)}</p>
                  </div>
                  <button onClick={() => copyText(acc.addr, `acc${i}`)} className="text-slate-400 hover:text-white">
                    {copied === `acc${i}` ? <FiCheck size={12} /> : <FiCopy size={12} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
