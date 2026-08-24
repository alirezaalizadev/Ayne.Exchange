'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useReducedMotion } from 'framer-motion';

/**
 * Hero 3D mount: lazy-loads the WebGL sculpture with a same-size static
 * placeholder (CLS 0). Serves the static fallback automatically when WebGL
 * is unavailable, the user prefers reduced motion, or the device looks weak.
 * The canvas is decorative (aria-hidden); the wrapper carries the a11y label.
 */

const FinancialCore = dynamic(() => import('./financial-core'), {
  ssr: false,
  loading: () => <SculptureFallback />,
});

function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Static premium fallback — 2D echo of the sculpture from brand tokens. */
export function SculptureFallback() {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="h3d-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="hsl(var(--border))" strokeWidth="1">
        <ellipse cx="200" cy="205" rx="165" ry="52" opacity="0.8" />
        <ellipse cx="200" cy="200" rx="130" ry="86" transform="rotate(-18 200 200)" opacity="0.55" />
        <ellipse cx="200" cy="198" rx="105" ry="34" transform="rotate(10 200 198)" opacity="0.4" />
      </g>
      <g transform="translate(200 196)">
        <path d="M-52 62 L-8 -62 L8 -62 L52 62 L30 62 L0 -24 L-30 62 Z" fill="url(#h3d-a)" />
        <rect x="-38" y="8" width="76" height="12" rx="5" fill="hsl(var(--primary))" opacity="0.9" />
      </g>
      <g fontFamily="inherit" fontWeight="700" fill="hsl(var(--muted-foreground))" fontSize="13" opacity="0.7">
        <text x="70" y="120">€</text>
        <text x="318" y="150">$</text>
        <text x="300" y="290">₺</text>
      </g>
      <circle cx="120" cy="300" r="3" fill="hsl(var(--primary))" opacity="0.5" />
      <circle cx="290" cy="96" r="2.5" fill="hsl(var(--primary))" opacity="0.4" />
      {/* minted crypto coin */}
      <g transform="translate(96 236)">
        <circle r="22" fill="hsl(var(--muted-foreground))" opacity="0.35" />
        <circle r="22" fill="none" stroke="hsl(var(--foreground))" strokeOpacity="0.35" strokeWidth="2" />
        <circle r="16" fill="none" stroke="hsl(var(--foreground))" strokeOpacity="0.2" strokeWidth="1" />
        <text x="0" y="7" textAnchor="middle" fontSize="20" fontWeight="800" fill="hsl(var(--foreground))" opacity="0.7">₿</text>
      </g>
    </svg>
  );
}

export function Hero3D() {
  const { resolvedTheme } = useTheme();
  const reduce = useReducedMotion();
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const pointer = React.useRef({ x: 0, y: 0 });

  const [mode, setMode] = React.useState<'pending' | 'webgl' | 'static'>('pending');
  const [variant, setVariant] = React.useState<'desktop' | 'mobile'>('desktop');
  const [active, setActive] = React.useState(true);

  // Decide once on the client which experience this device gets.
  React.useEffect(() => {
    const mobile = window.matchMedia('(max-width: 1023px)').matches;
    setVariant(mobile ? 'mobile' : 'desktop');
    const mem = (navigator as { deviceMemory?: number }).deviceMemory;
    const weak = mobile && mem != null && mem < 4;
    if (reduce || weak || !supportsWebGL()) setMode('static');
    else setMode('webgl');
  }, [reduce]);

  // Pause the render loop off-viewport / hidden tab.
  React.useEffect(() => {
    const el = wrapRef.current;
    let inView = true;
    let visible = !document.hidden;
    const apply = () => setActive(inView && visible);
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([e]) => {
            inView = e.isIntersecting;
            apply();
          }, { threshold: 0.05 })
        : null;
    if (el && io) io.observe(el);
    const onVis = () => {
      visible = !document.hidden;
      apply();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Parallax input — captured only over the sculpture area itself.
  const onPointerMove = (e: React.PointerEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.current.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  };
  const onPointerLeave = () => {
    pointer.current.x = 0;
    pointer.current.y = 0;
  };

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label="Animated Ayne Exchange financial sculpture representing currency exchange and international payments"
      className="h-full w-full"
      onPointerMove={mode === 'webgl' ? onPointerMove : undefined}
      onPointerLeave={mode === 'webgl' ? onPointerLeave : undefined}
    >
      {mode === 'webgl' ? (
        <FinancialCore
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
          variant={variant}
          active={active}
          pointer={pointer}
        />
      ) : (
        <SculptureFallback />
      )}
    </div>
  );
}
