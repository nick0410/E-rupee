"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiUser, FiShield, FiKey, FiLock,
  FiSave, FiCheck, FiCopy, FiLogOut, FiTrash2,
} from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user, balance, logout, setUser } = useWallet();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const [tab, setTab] = useState<'profile' | 'security' | 'wallet' | 'danger'>('profile');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

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

  const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500/50 transition-all border ${isDark
      ? "bg-slate-800/60 border-slate-700/30 text-white placeholder:text-slate-600"
      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
    }`;

  const rowCls = `flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-slate-800/40" : "bg-slate-50"
    }`;

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Settings</h1>
        <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Manage your account and security preferences</p>
      </div>

      <div className={`flex gap-1 p-0.5 border rounded-lg w-fit ${isDark ? "bg-slate-800/40 border-slate-700/30" : "bg-slate-100 border-slate-200"
        }`}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key
                ? 'bg-blue-500/20 text-blue-500'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
          >
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
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{user?.name || 'Unknown User'}</h3>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{user?.email || '—'}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-500">
                ID: {user?.id || '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Phone', key: 'phone', type: 'tel' },
              { label: 'PAN Number', key: 'pan', type: 'text', placeholder: 'ABCDE1234F', maxLength: 10 },
            ].map(field => (
              <div key={field.key}>
                <label className={`text-xs mb-1.5 block ${isDark ? "text-slate-500" : "text-slate-400"}`}>{field.label}</label>
                <input
                  value={(profileForm as any)[field.key]}
                  onChange={e => updateField(field.key, e.target.value)}
                  type={field.type}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  className={inputCls + (field.key === 'pan' ? ' uppercase' : '')}
                />
              </div>
            ))}
          </div>

          {saveError && (
            <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{saveError}</div>
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
              <FiLock className="text-blue-500" size={16} />
              <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Change Password</h3>
            </div>
            <div className="space-y-3 max-w-md">
              {['Current Password', 'New Password', 'Confirm Password'].map(label => (
                <div key={label}>
                  <label className={`text-xs mb-1.5 block ${isDark ? "text-slate-500" : "text-slate-400"}`}>{label}</label>
                  <input type="password" placeholder="••••••••" className={inputCls} />
                </div>
              ))}
              <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all">Update Password</button>
            </div>
          </div>

          <div className="card-hover p-6">
            <h3 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>Security Status</h3>
            <div className="space-y-3">
              {[
                { label: 'Account Verified', status: true },
                { label: 'Email Verified', status: !!user?.email },
                { label: 'KYC Completed', status: !!user?.aadhaar },
                { label: 'Wallet Linked', status: !!address },
              ].map((item, i) => (
                <div key={i} className={rowCls}>
                  <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{item.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
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
            <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Wallet Information</h3>
            <div className="space-y-3">
              <div className={rowCls}>
                <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Wallet Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500 text-xs font-mono">{address ? `${address.slice(0, 10)}...${address.slice(-6)}` : '—'}</span>
                  {address && <button onClick={() => copyText(address, 'addr')} className={`${isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>
                    {copied === 'addr' ? <FiCheck size={12} /> : <FiCopy size={12} />}
                  </button>}
                </div>
              </div>
              {[
                { label: 'Total Balance', value: `₹${(balance?.total ?? 0).toLocaleString()}`, cls: isDark ? 'text-white font-semibold' : 'text-slate-900 font-semibold' },
                { label: 'Available', value: `₹${(balance?.available ?? 0).toLocaleString()}`, cls: 'text-emerald-500 font-semibold' },
                { label: 'Locked', value: `₹${(balance?.locked ?? 0).toLocaleString()}`, cls: 'text-amber-500 font-semibold' },
                { label: 'Network', value: 'Hardhat Local (Chain 31337)', cls: isDark ? 'text-white text-sm' : 'text-slate-900 text-sm' },
              ].map(item => (
                <div key={item.label} className={rowCls}>
                  <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.label}</span>
                  <span className={item.cls}>{item.value}</span>
                </div>
              ))}
              <div className={rowCls}>
                <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Contract</span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500 text-xs font-mono">0x5FbD...aa3</span>
                  <button onClick={() => copyText('0x5FbDB2315678afecb367f032d93F642f64180aa3', 'contract')} className={`${isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>
                    {copied === 'contract' ? <FiCheck size={12} /> : <FiCopy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {address && (
            <div className="card-hover p-6">
              <h3 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>Full Wallet Address</h3>
              <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/60 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}>
                <p className="text-blue-500 text-sm font-mono break-all">{address}</p>
              </div>
              <button onClick={() => copyText(address, 'full')} className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${isDark ? "border-slate-700/30 text-slate-300 hover:text-white" : "border-slate-200 text-slate-500 hover:text-slate-900"}`}>
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
            <h3 className={`font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Logout</h3>
            <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Sign out from this session. Your wallet data will be cleared from this browser.</p>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-all">
              <FiLogOut size={14} /> Logout
            </button>
          </div>

          <div className="card-hover p-6 border-l-4 border-red-500">
            <h3 className={`font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Clear Local Data</h3>
            <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Remove all cached data from this browser. You will need to login again.</p>
            <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all">
              <FiTrash2 size={14} /> Clear All Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
