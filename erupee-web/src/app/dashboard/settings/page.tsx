"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiUser, FiShield, FiKey, FiLock,
  FiSave, FiCheck, FiCopy, FiEye, FiEyeOff, FiLogOut, FiTrash2,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user, balance, logout, setUser } = useWallet();
  const router = useRouter();
  const [tab, setTab] = useState<'profile' | 'security' | 'wallet' | 'danger'>('profile');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Controlled form fields for profile
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    state: user?.state || '',
    pan: (user as any)?.pan || '',
  });

  const updateField = (key: string, value: string) =>
    setProfileForm(f => ({ ...f, [key]: key === 'pan' ? value.toUpperCase() : value }));

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await api.updateProfile(user.id, profileForm);
      if (res.user) {
        setUser({ ...user, name: res.user.name, email: res.user.email, phone: res.user.phone, state: res.user.state || user.state });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const address = balance?.address || user?.walletAddress || "";
  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  const tabs = [
    { key: 'profile' as const, label: 'Profile', icon: <FiUser size={14} /> },
    { key: 'security' as const, label: 'Security', icon: <FiShield size={14} /> },
    { key: 'wallet' as const, label: 'Wallet', icon: <FiKey size={14} /> },
    { key: 'danger' as const, label: 'Danger Zone', icon: <FiTrash2 size={14} /> },
  ];

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your account and security preferences</p>
      </div>

      <div className="flex gap-1 p-0.5 bg-slate-800/40 border border-slate-700/30 rounded-lg w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === 'profile' && (
        <div className="card-hover p-6 space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
            <div>
              <h3 className="text-white text-lg font-bold">{user?.name || 'Unknown User'}</h3>
              <p className="text-slate-400 text-sm">{user?.email || '—'}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400">
                ID: {user?.id || '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-500 text-xs mb-1.5 block">Full Name</label>
              <input value={profileForm.name} onChange={e => updateField('name', e.target.value)} type="text"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/30 text-white text-sm focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="text-slate-500 text-xs mb-1.5 block">Email</label>
              <input value={profileForm.email} onChange={e => updateField('email', e.target.value)} type="email"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/30 text-white text-sm focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="text-slate-500 text-xs mb-1.5 block">Phone</label>
              <input value={profileForm.phone} onChange={e => updateField('phone', e.target.value)} type="tel"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/30 text-white text-sm focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="text-slate-500 text-xs mb-1.5 block">PAN Number</label>
              <input value={profileForm.pan} onChange={e => updateField('pan', e.target.value)} type="text" placeholder="ABCDE1234F" maxLength={10}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/30 text-white text-sm focus:outline-none focus:border-blue-500/50 uppercase" />
            </div>
          </div>

          {saveError && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{saveError}</div>
          )}

          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : saved ? (
              <><FiCheck size={14} /> Saved!</>
            ) : (
              <><FiSave size={14} /> Save Changes</>
            )}
          </button>
        </div>
      )}

      {/* Security */}
      {tab === 'security' && (
        <div className="space-y-4">
          <div className="card-hover p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiLock className="text-blue-400" size={16} />
              <h3 className="text-white font-semibold">Change Password</h3>
            </div>
            <div className="space-y-3 max-w-md">
              <div>
                <label className="text-slate-500 text-xs mb-1.5 block">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/30 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-slate-500 text-xs mb-1.5 block">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/30 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-slate-500 text-xs mb-1.5 block">Confirm Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/30 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
              </div>
              <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all">Update Password</button>
            </div>
          </div>

          <div className="card-hover p-6">
            <h3 className="text-white font-semibold mb-3">Security Status</h3>
            <div className="space-y-3">
              {[
                { label: 'Account Verified', status: true },
                { label: 'Email Verified', status: !!user?.email },
                { label: 'KYC Completed', status: !!user?.aadhaar },
                { label: 'Wallet Linked', status: !!address },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40">
                  <span className="text-slate-300 text-sm">{item.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {item.status ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Info */}
      {tab === 'wallet' && (
        <div className="space-y-4">
          <div className="card-hover p-6">
            <h3 className="text-white font-semibold mb-4">Wallet Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Wallet Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 text-xs font-mono">{address ? `${address.slice(0,10)}...${address.slice(-6)}` : '—'}</span>
                  {address && <button onClick={() => copyText(address, 'addr')} className="text-slate-400 hover:text-white">
                    {copied === 'addr' ? <FiCheck size={12} /> : <FiCopy size={12} />}
                  </button>}
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
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Network</span>
                <span className="text-white text-sm">Hardhat Local (Chain 31337)</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 text-sm">Contract</span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 text-xs font-mono">0x5FbD...aa3</span>
                  <button onClick={() => copyText('0x5FbDB2315678afecb367f032d93F642f64180aa3', 'contract')} className="text-slate-400 hover:text-white">
                    {copied === 'contract' ? <FiCheck size={12} /> : <FiCopy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {address && (
            <div className="card-hover p-6">
              <h3 className="text-white font-semibold mb-3">Full Wallet Address</h3>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/30">
                <p className="text-blue-400 text-sm font-mono break-all">{address}</p>
              </div>
              <button onClick={() => copyText(address, 'full')} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700/30 text-slate-300 text-sm hover:text-white transition-all">
                {copied === 'full' ? <><FiCheck size={12} /> Copied</> : <><FiCopy size={12} /> Copy Full Address</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Danger Zone */}
      {tab === 'danger' && (
        <div className="space-y-4">
          <div className="card-hover p-6 border-l-4 border-amber-500">
            <h3 className="text-white font-semibold mb-2">Logout</h3>
            <p className="text-slate-400 text-sm mb-4">Sign out from this session. Your wallet data will be cleared from this browser.</p>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-all">
              <FiLogOut size={14} /> Logout
            </button>
          </div>

          <div className="card-hover p-6 border-l-4 border-red-500">
            <h3 className="text-white font-semibold mb-2">Clear Local Data</h3>
            <p className="text-slate-400 text-sm mb-4">Remove all cached data from this browser. You will need to login again.</p>
            <button onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all">
              <FiTrash2 size={14} /> Clear All Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
