import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * AYNE EXCHANGE temporary brand mark (SVG, themeable).
 * Concept: an abstract "A" built from two ascending payment routes meeting at
 * a connection node, crossed by a bidirectional exchange bar — movement,
 * global transfer, interconnection. Deliberately NOT a coin.
 *
 * Strokes use currentColor by default (inherits text color → theme-aware).
 * Pass `gradient` for the primary→accent brand gradient; `idSuffix` must be
 * unique per instance on a page when gradient is used.
 */
export function LogoMark({
  className,
  gradient = false,
  idSuffix = 'mark',
  ...props
}: React.SVGProps<SVGSVGElement> & { gradient?: boolean; idSuffix?: string }) {
  const gid = `ayne-grad-${idSuffix}`;
  const stroke = gradient ? `url(#${gid})` : 'currentColor';
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Ayne Exchange"
      className={cn('h-8 w-8', className)}
      {...props}
    >
      {gradient && (
        <defs>
          <linearGradient id={gid} x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(var(--primary))" />
            <stop offset="1" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      )}
      {/* Left + right ascending routes forming the "A" */}
      <path
        d="M6 27 L16 5 L26 27"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bidirectional exchange crossbar */}
      <path
        d="M10.5 19 H21.5"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M12.3 17.2 L10 19 L12.3 20.8"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.7 17.2 L22 19 L19.7 20.8"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Connection node at apex */}
      <circle cx="16" cy="5" r="2.1" fill={stroke} />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  showWordmark = true,
  gradient = true,
  idSuffix = 'nav',
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  gradient?: boolean;
  idSuffix?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark
        gradient={gradient}
        idSuffix={idSuffix}
        className={cn('h-8 w-8', markClassName)}
      />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-semibold tracking-tight">
            AYNE
          </span>
          <span className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Exchange
          </span>
        </span>
      )}
    </span>
  );
}
