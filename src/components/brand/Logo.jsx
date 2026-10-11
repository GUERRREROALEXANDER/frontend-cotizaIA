import { useId } from "react";

// CotizaIA robot mark, redrawn as SVG from the original raster logo
// (public/brand/logo-original.png) so it stays sharp at any size and works
// on both themes. The mark keeps the logo's own colors in both themes.
export function LogoMark({ size = 40, className = "", title = "CotizaIA" }) {
  const gradientId = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 100 88"
      width={size}
      height={(size * 88) / 100}
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient id={`frame-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--logo-frame-top)" />
          <stop offset="100%" stopColor="var(--logo-frame-bottom)" />
        </linearGradient>
      </defs>
      {/* antenna */}
      <circle cx="50" cy="13" r="5" fill="var(--logo-ink)" />
      <rect x="48.4" y="16" width="3.2" height="9" rx="1.2" fill="var(--logo-ink)" />
      <path d="M44 28 Q44 24.5 47.5 24.5 H52.5 Q56 24.5 56 28 Z" fill="var(--logo-ink)" />
      {/* ears */}
      <rect x="6" y="42" width="14" height="22" rx="7" fill="var(--logo-ear)" />
      <rect x="80" y="42" width="14" height="22" rx="7" fill="var(--logo-ear)" />
      {/* head and face */}
      <rect x="15" y="26" width="70" height="56" rx="26" fill={`url(#frame-${gradientId})`} />
      <rect x="23" y="35" width="54" height="37" rx="15" fill="var(--logo-ink)" />
      {/* happy eyes */}
      <path d="M33.5 56 a5.2 5.2 0 0 1 10.4 0" fill="none" stroke="var(--logo-eye)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M56.1 56 a5.2 5.2 0 0 1 10.4 0" fill="none" stroke="var(--logo-eye)" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

// Full lockup: mark + "CotizaIA" set in Poppins SemiBold, the closest free
// match to the original wordmark. The text follows the theme ink.
export default function Logo({ size = 40, showWordmark = true, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} title={showWordmark ? "" : "CotizaIA"} />
      {showWordmark && (
        <span className="font-logo text-[1.45rem] font-semibold leading-none tracking-[-0.02em] text-[color:var(--logo-text)]">CotizaIA</span>
      )}
    </span>
  );
}
