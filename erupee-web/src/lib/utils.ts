/*
 * ═══════════════════════════════════════════════════════════════
 *  eRupeeX — Utility Functions
 *  Formatting, helpers, and common operations
 * ═══════════════════════════════════════════════════════════════
 */

export function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

export function formatPercent(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

export function shortHash(hash: string): string {
  if (!hash) return '—';
  if (hash.length <= 14) return hash;
  return hash.slice(0, 8) + '...' + hash.slice(-6);
}

export function shortAddress(addr: string): string {
  if (!addr) return '—';
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function severityColor(s: string): string {
  switch (s) {
    case 'critical': return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'high':     return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'medium':   return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'low':      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    default:         return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  }
}

export function statusColor(s: string): string {
  switch (s) {
    case 'completed': case 'active': case 'deployed': case 'resolved': case 'approved': case 'processed': case 'success':
      return 'bg-emerald-500/15 text-emerald-400';
    case 'pending': case 'syncing': case 'processing': case 'investigating':
      return 'bg-amber-500/15 text-amber-400';
    case 'failed': case 'inactive': case 'suspended': case 'deprecated': case 'rejected': case 'failure':
      return 'bg-red-500/15 text-red-400';
    case 'flagged': case 'open':
      return 'bg-orange-500/15 text-orange-400';
    case 'false_positive': case 'paused':
      return 'bg-slate-500/15 text-slate-400';
    default:
      return 'bg-slate-500/15 text-slate-400';
  }
}

export function txTypeColor(t: string): string {
  switch (t) {
    case 'P2P':     return 'bg-blue-500/15 text-blue-400';
    case 'P2M':     return 'bg-violet-500/15 text-violet-400';
    case 'SUBSIDY': return 'bg-emerald-500/15 text-emerald-400';
    case 'REFUND':  return 'bg-cyan-500/15 text-cyan-400';
    case 'MINT':    return 'bg-green-500/15 text-green-400';
    case 'LOCK':    return 'bg-amber-500/15 text-amber-400';
    case 'RELEASE': return 'bg-teal-500/15 text-teal-400';
    case 'QR':      return 'bg-pink-500/15 text-pink-400';
    case 'NFC':     return 'bg-indigo-500/15 text-indigo-400';
    case 'OFFLINE': return 'bg-gray-500/15 text-gray-400';
    case 'BURN':    return 'bg-red-500/15 text-red-400';
    default:        return 'bg-slate-500/15 text-slate-400';
  }
}

export function generateQRData(amount: number, address: string, note: string): string {
  return `erupee://pay?to=${address}&amount=${amount}&note=${encodeURIComponent(note)}&ts=${Date.now()}`;
}

export function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
}
