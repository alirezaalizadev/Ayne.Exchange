import * as React from 'react';
import { currencyMeta } from '@/lib/config/currencies';
import { cn } from '@/lib/utils';

/**
 * Central currency icon: optimized inline-SVG circular flags for fiat,
 * neutral token marks for crypto, and a code-badge fallback for anything
 * unknown — so a newly added admin pair NEVER renders blank/broken.
 *
 * Hook-free and dependency-free: safe in server components (ticker, rate
 * cards) and client components (calculator selector, admin tables) alike.
 * Emoji flags were replaced because they render inconsistently (blank on
 * Windows/Linux Chrome) and the EU flag had no emoji mapping at all.
 */

type FlagRenderer = (id: string) => React.ReactNode;

/* Simplified, recognizable circular flags. viewBox 0 0 24 24, clipped round. */
const FLAGS: Record<string, FlagRenderer> = {
  USD: (id) => (
    <g clipPath={`url(#${id})`}>
      <rect width="24" height="24" fill="#B22234" />
      {[2.15, 5.85, 9.55, 13.25, 16.95, 20.65].map((y) => (
        <rect key={y} y={y} width="24" height="1.85" fill="#fff" />
      ))}
      <rect width="11" height="9.7" fill="#3C3B6E" />
    </g>
  ),
  EUR: (id) => (
    <g clipPath={`url(#${id})`}>
      <rect width="24" height="24" fill="#003399" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={12 + Math.sin(a) * 5.5} cy={12 - Math.cos(a) * 5.5} r="0.95" fill="#FFCC00" />;
      })}
    </g>
  ),
  GBP: (id) => (
    <g clipPath={`url(#${id})`}>
      <rect width="24" height="24" fill="#012169" />
      <path d="M0 0 L24 24 M24 0 L0 24" stroke="#fff" strokeWidth="4.5" />
      <path d="M0 0 L24 24 M24 0 L0 24" stroke="#C8102E" strokeWidth="2" />
      <path d="M12 0 V24 M0 12 H24" stroke="#fff" strokeWidth="7" />
      <path d="M12 0 V24 M0 12 H24" stroke="#C8102E" strokeWidth="4" />
    </g>
  ),
  TRY: (id) => (
    <g clipPath={`url(#${id})`}>
      <rect width="24" height="24" fill="#E30A17" />
      <circle cx="10.5" cy="12" r="5.2" fill="#fff" />
      <circle cx="11.9" cy="12" r="4.2" fill="#E30A17" />
      <path d="M17.6 12 l1.9 .62 -1.17-1.62 0 2 1.17-1.62 z" fill="#fff" />
      <path
        d="M17.2 9.6 l.63 1.93 1.64-1.19 -2.03 0 1.64 1.19 z M17.2 14.4 l.63-1.93 1.64 1.19 -2.03 0 1.64-1.19 z"
        fill="#fff"
      />
    </g>
  ),
  AED: (id) => (
    <g clipPath={`url(#${id})`}>
      <rect width="24" height="8" fill="#00732F" />
      <rect y="8" width="24" height="8" fill="#fff" />
      <rect y="16" width="24" height="8" fill="#000" />
      <rect width="8" height="24" fill="#C8102E" />
    </g>
  ),
  CNY: (id) => (
    <g clipPath={`url(#${id})`}>
      <rect width="24" height="24" fill="#DE2910" />
      <path d="M7 5.5 l1.55 4.77 -4.06-2.95 5.02 0 -4.06 2.95 z" fill="#FFDE00" />
      <circle cx="12.5" cy="4.5" r="0.9" fill="#FFDE00" />
      <circle cx="14" cy="7.5" r="0.9" fill="#FFDE00" />
      <circle cx="14" cy="11" r="0.9" fill="#FFDE00" />
      <circle cx="12.5" cy="14" r="0.9" fill="#FFDE00" />
    </g>
  ),
  RUB: (id) => (
    <g clipPath={`url(#${id})`}>
      <rect width="24" height="8" fill="#fff" />
      <rect y="8" width="24" height="8" fill="#0039A6" />
      <rect y="16" width="24" height="8" fill="#D52B1E" />
    </g>
  ),
  IRR: (id) => (
    <g clipPath={`url(#${id})`}>
      <rect width="24" height="8" fill="#239F40" />
      <rect y="8" width="24" height="8" fill="#fff" />
      <rect y="16" width="24" height="8" fill="#DA0000" />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke="#DA0000" strokeWidth="0.9" />
    </g>
  ),
};
FLAGS.TOMAN = FLAGS.IRR;

/* Neutral crypto token marks. */
const TOKENS: Record<string, { bg: string; glyph: string; fg?: string }> = {
  USDT: { bg: '#26A17B', glyph: '₮' },
  USDC: { bg: '#2775CA', glyph: '$' },
  BTC: { bg: '#F7931A', glyph: '₿' },
  ETH: { bg: '#627EEA', glyph: 'Ξ' },
};

export function CurrencyIcon({
  code,
  size = 20,
  className,
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  const c = (code || '').toUpperCase();
  const meta = currencyMeta(c);
  // Deterministic id (no hooks → safe in server components, no hydration
  // mismatch). Duplicate ids across instances are fine: every clipPath with
  // this id has identical content (a full circle).
  const id = `cflag-${c}`;

  const flag = FLAGS[c];
  const token = TOKENS[c];

  if (flag) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        role="img"
        aria-label={meta?.name ?? c}
        className={cn('shrink-0 rounded-full ring-1 ring-border', className)}
      >
        <defs>
          <clipPath id={id}>
            <circle cx="12" cy="12" r="12" />
          </clipPath>
        </defs>
        {flag(id)}
      </svg>
    );
  }

  if (token) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        role="img"
        aria-label={meta?.name ?? c}
        className={cn('shrink-0 rounded-full ring-1 ring-border', className)}
      >
        <circle cx="12" cy="12" r="12" fill={token.bg} />
        <text
          x="12"
          y="16.5"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill={token.fg ?? '#fff'}
          fontFamily="system-ui, sans-serif"
        >
          {token.glyph}
        </text>
      </svg>
    );
  }

  // Fallback badge — unknown currency never renders blank/broken.
  return (
    <span
      role="img"
      aria-label={c}
      style={{ width: size, height: size, fontSize: Math.max(6, size * 0.34) }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-muted font-bold leading-none text-muted-foreground',
        className,
      )}
    >
      {c.slice(0, 3)}
    </span>
  );
}

/** Overlapping base/quote pair icons for rate rows and the ticker. */
export function CurrencyPairIcons({
  base,
  quote,
  size = 20,
  className,
}: {
  base: string;
  quote: string;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center', className)} dir="ltr">
      <CurrencyIcon code={base} size={size} className="relative z-[1]" />
      <CurrencyIcon code={quote} size={size} className="-ml-1.5 ring-2 ring-background" />
    </span>
  );
}
