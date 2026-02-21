export default function BlockchainIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
    >
      <defs>
        <linearGradient id="bi-g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#F7C59F" />
        </linearGradient>
        <linearGradient id="bi-g2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#7B2FBE" />
        </linearGradient>
        <linearGradient id="bi-g3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F5A0" />
          <stop offset="100%" stopColor="#00D9F5" />
        </linearGradient>
        <linearGradient id="bi-g4" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF3CAC" />
          <stop offset="100%" stopColor="#784BA0" />
        </linearGradient>
        <linearGradient id="bi-bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A0E1A" />
          <stop offset="100%" stopColor="#1A0A2E" />
        </linearGradient>
        <linearGradient id="bi-chainLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.6} />
          <stop offset="33%" stopColor="#00D4FF" stopOpacity={0.6} />
          <stop offset="66%" stopColor="#00F5A0" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#FF3CAC" stopOpacity={0.6} />
        </linearGradient>
        <filter id="bi-glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="bi-softGlow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx="100" cy="100" r="96" fill="url(#bi-bgGrad)" stroke="#ffffff10" strokeWidth="1" />

      {/* Outer ring glow */}
      <circle cx="100" cy="100" r="88" fill="none" stroke="url(#bi-g2)" strokeWidth="0.5" opacity="0.4" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="url(#bi-g3)" strokeWidth="0.3" opacity="0.3" />

      {/* Connecting lines between blocks */}
      <line x1="100" y1="42" x2="148" y2="100" stroke="url(#bi-chainLine)" strokeWidth="1.5" opacity="0.7" filter="url(#bi-glow)" />
      <line x1="148" y1="100" x2="100" y2="158" stroke="url(#bi-chainLine)" strokeWidth="1.5" opacity="0.7" filter="url(#bi-glow)" />
      <line x1="100" y1="158" x2="52" y2="100" stroke="url(#bi-chainLine)" strokeWidth="1.5" opacity="0.7" filter="url(#bi-glow)" />
      <line x1="52" y1="100" x2="100" y2="42" stroke="url(#bi-chainLine)" strokeWidth="1.5" opacity="0.7" filter="url(#bi-glow)" />

      {/* Cross connections */}
      <line x1="52" y1="100" x2="148" y2="100" stroke="#ffffff" strokeWidth="0.5" opacity="0.15" />
      <line x1="100" y1="42" x2="100" y2="158" stroke="#ffffff" strokeWidth="0.5" opacity="0.15" />

      {/* Center block (main) */}
      <rect x="76" y="76" width="48" height="48" rx="8" fill="#0A0E1A" stroke="url(#bi-g2)" strokeWidth="2" filter="url(#bi-softGlow)" />
      <rect x="78" y="78" width="44" height="44" rx="7" fill="url(#bi-g2)" opacity="0.15" />
      <text x="100" y="108" fontFamily="Georgia, serif" fontSize="26" fontWeight="bold" fill="url(#bi-g2)" textAnchor="middle" filter="url(#bi-glow)">B</text>

      {/* Top block */}
      <rect x="76" y="18" width="48" height="32" rx="6" fill="#0A0E1A" stroke="url(#bi-g1)" strokeWidth="2" filter="url(#bi-glow)" />
      <rect x="78" y="20" width="44" height="28" rx="5" fill="url(#bi-g1)" opacity="0.12" />
      <line x1="85" y1="30" x2="115" y2="30" stroke="url(#bi-g1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="85" y1="38" x2="108" y2="38" stroke="url(#bi-g1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Right block */}
      <rect x="124" y="76" width="48" height="32" rx="6" fill="#0A0E1A" stroke="url(#bi-g3)" strokeWidth="2" filter="url(#bi-glow)" />
      <rect x="126" y="78" width="44" height="28" rx="5" fill="url(#bi-g3)" opacity="0.12" />
      <line x1="133" y1="88" x2="163" y2="88" stroke="url(#bi-g3)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="133" y1="96" x2="156" y2="96" stroke="url(#bi-g3)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Bottom block */}
      <rect x="76" y="150" width="48" height="32" rx="6" fill="#0A0E1A" stroke="url(#bi-g4)" strokeWidth="2" filter="url(#bi-glow)" />
      <rect x="78" y="152" width="44" height="28" rx="5" fill="url(#bi-g4)" opacity="0.12" />
      <line x1="85" y1="162" x2="115" y2="162" stroke="url(#bi-g4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="85" y1="170" x2="108" y2="170" stroke="url(#bi-g4)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Left block */}
      <rect x="28" y="76" width="48" height="32" rx="6" fill="#0A0E1A" stroke="url(#bi-g1)" strokeWidth="2" filter="url(#bi-glow)" />
      <rect x="30" y="78" width="44" height="28" rx="5" fill="url(#bi-g1)" opacity="0.12" />
      <line x1="37" y1="88" x2="67" y2="88" stroke="url(#bi-g1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="37" y1="96" x2="60" y2="96" stroke="url(#bi-g1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Corner sparkles / nodes */}
      <circle cx="100" cy="34" r="3" fill="#FF6B35" filter="url(#bi-glow)" />
      <circle cx="148" cy="100" r="3" fill="#00F5A0" filter="url(#bi-glow)" />
      <circle cx="100" cy="166" r="3" fill="#FF3CAC" filter="url(#bi-glow)" />
      <circle cx="52" cy="100" r="3" fill="#00D4FF" filter="url(#bi-glow)" />

      {/* Small decorative dots */}
      <circle cx="52" cy="52" r="2" fill="#FF6B35" opacity="0.5" />
      <circle cx="148" cy="52" r="2" fill="#00D4FF" opacity="0.5" />
      <circle cx="148" cy="148" r="2" fill="#00F5A0" opacity="0.5" />
      <circle cx="52" cy="148" r="2" fill="#FF3CAC" opacity="0.5" />
    </svg>
  );
}
