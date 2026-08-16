'use client';

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { cities, tierRoleKey, type City, type NodeTier } from '@/lib/config/network';
import { networkGeometry } from '@/lib/config/network-geometry-static';
import { cn } from '@/lib/utils';

/* Fixed SVG canvas — matches the precomputed geometry. No geo libs here: the
   heavy computation ran at build time; only serialized strings/coords ship. */
const W = networkGeometry.W;
const H = networkGeometry.H;

const NODE_SIZE: Record<NodeTier, { dot: number; ring: number; glow: number; label: number }> = {
  primary: { dot: 5, ring: 11, glow: 26, label: 12.5 },
  secondary: { dot: 3.6, ring: 8, glow: 16, label: 11 },
  standard: { dot: 2.5, ring: 0, glow: 0, label: 9.5 },
};

type PlacedCity = City & { x: number; y: number };

// Derived once at module load (geometry is a static constant).
const placed: PlacedCity[] = cities.map((c) => ({
  ...c,
  x: networkGeometry.nodeXY[c.id]?.x ?? 0,
  y: networkGeometry.nodeXY[c.id]?.y ?? 0,
}));
const cityById = Object.fromEntries(placed.map((c) => [c.id, c])) as Record<string, PlacedCity>;
const placedRoutes = networkGeometry.routeGeom.map((r, i) => ({
  i,
  from: cityById[r.from],
  to: cityById[r.to],
  d: r.d,
  mx: r.mx,
  my: r.my,
  primary: r.primary,
  delay: r.delay,
}));

export function GlobalNetworkMap({ className }: { className?: string }) {
  const t = useTranslations('network');
  const reduce = useReducedMotion();
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const [paused, setPaused] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [hoverCity, setHoverCity] = React.useState<string | null>(null);
  const [hoverRoute, setHoverRoute] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting), { threshold: 0.04 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const animate = !reduce;
  const showParticles = animate && !isMobile;
  const visibleRoutes = isMobile ? placedRoutes.filter((r) => r.primary) : placedRoutes;

  const connectedToCity = React.useMemo(() => {
    if (!hoverCity) return null;
    const set = new Set<number>();
    placedRoutes.forEach((r) => {
      if (r.from.id === hoverCity || r.to.id === hoverCity) set.add(r.i);
    });
    return set;
  }, [hoverCity, placedRoutes]);

  const activeCity = hoverCity ? cityById[hoverCity] : null;
  const activeRoute = hoverRoute != null ? placedRoutes.find((r) => r.i === hoverRoute) ?? null : null;

  return (
    <div ref={wrapRef} className={cn('relative w-full', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={cn('h-full w-full', paused && 'map-paused')}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={t('title')}
      >
        <defs>
          <radialGradient id="gnm-glow" cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.10" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="gnm-route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="45%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <rect width={W} height={H} fill="url(#gnm-glow)" />

        <path d={networkGeometry.spherePath} fill="none" stroke="hsl(var(--border))" strokeOpacity="0.25" strokeWidth="1" />
        <path
          d={networkGeometry.graticulePath}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeOpacity="0.05"
          strokeWidth="0.6"
        />
        <path
          d={networkGeometry.landPath}
          fill="hsl(var(--foreground))"
          fillOpacity="0.06"
          stroke="hsl(var(--foreground))"
          strokeOpacity="0.12"
          strokeWidth="0.5"
        />

        {/* Routes */}
        <g fill="none" strokeLinecap="round">
          {visibleRoutes.map((r) => {
            const isConnected = connectedToCity?.has(r.i);
            const isHoveredRoute = hoverRoute === r.i;
            const anyHover = !!hoverCity || hoverRoute != null;
            const forced = isConnected || isHoveredRoute;

            let style: React.CSSProperties;
            let clsName = 'transition-opacity duration-300';
            if (reduce) {
              style = { opacity: forced ? 0.9 : anyHover ? 0.08 : 0.4 };
            } else if (anyHover) {
              style = { opacity: forced ? 1 : 0.06, animation: 'none' };
            } else {
              clsName += ' route-cycle';
              style = { animationDelay: `${r.delay}s` };
            }

            return (
              <g
                key={r.i}
                className={clsName}
                style={style}
                onMouseEnter={() => setHoverRoute(r.i)}
                onMouseLeave={() => setHoverRoute((cur) => (cur === r.i ? null : cur))}
              >
                <path d={r.d} stroke="transparent" strokeWidth="10" />
                <path d={r.d} stroke="hsl(var(--primary))" strokeOpacity="0.16" strokeWidth="1" />
                <path
                  d={r.d}
                  stroke="url(#gnm-route)"
                  strokeWidth={forced ? 2 : 1.5}
                  strokeDasharray="3 10"
                  className={animate ? 'animate-dash-flow' : undefined}
                />
                {showParticles && (
                  <circle r={r.primary ? 2.6 : 2} fill="hsl(var(--accent))">
                    <animateMotion
                      dur={`${6 + (r.i % 5)}s`}
                      repeatCount="indefinite"
                      keyPoints="0;1"
                      keyTimes="0;1"
                      path={r.d}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {placed.map((c) => {
            const sz = NODE_SIZE[c.tier];
            const isActive = hoverCity === c.id;
            const relatedToHover =
              hoverCity != null &&
              (isActive ||
                placedRoutes.some(
                  (r) =>
                    (r.from.id === hoverCity && r.to.id === c.id) ||
                    (r.to.id === hoverCity && r.from.id === c.id),
                ));
            const dim = hoverCity != null && !isActive && !relatedToHover;
            const labelVisible = c.tier !== 'standard' || isActive;

            return (
              <g
                key={c.id}
                transform={`translate(${c.x} ${c.y})`}
                className="transition-opacity duration-300"
                style={{ opacity: dim ? 0.35 : 1 }}
                onMouseEnter={() => setHoverCity(c.id)}
                onMouseLeave={() => setHoverCity((cur) => (cur === c.id ? null : cur))}
              >
                {sz.glow > 0 && (
                  <circle
                    r={sz.glow}
                    fill="hsl(var(--primary))"
                    fillOpacity={c.tier === 'primary' ? 0.12 : 0.08}
                    className={c.tier === 'primary' && animate && !isMobile ? 'animate-pulse-soft' : undefined}
                  />
                )}
                {c.tier === 'primary' && animate && !isMobile && (
                  <circle r={sz.ring} fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.5">
                    <animate attributeName="r" values={`${sz.ring};${sz.ring + 12}`} dur="3.2s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.5;0" dur="3.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {sz.ring > 0 && (
                  <circle r={sz.ring} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.25" strokeOpacity="0.55" />
                )}
                <circle
                  r={sz.dot}
                  fill={c.tier === 'standard' ? 'hsl(var(--foreground))' : 'hsl(var(--primary))'}
                  fillOpacity={c.tier === 'standard' ? 0.6 : 1}
                />
                <circle r={sz.dot} fill="none" stroke="hsl(var(--background))" strokeWidth="1" />
                <circle r={Math.max(12, sz.ring + 4)} fill="transparent" style={{ cursor: 'pointer' }} />
                {labelVisible && (
                  <text
                    x="0"
                    y={-(Math.max(sz.ring, sz.dot) + 6)}
                    textAnchor="middle"
                    className={cn(
                      isActive ? 'fill-foreground' : 'fill-muted-foreground',
                      c.tier === 'standard' && 'hidden sm:block',
                    )}
                    style={{ fontSize: sz.label, fontWeight: c.tier === 'primary' ? 600 : 500, pointerEvents: 'none' }}
                  >
                    {c.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {activeCity && (
        <Tooltip x={activeCity.x} y={activeCity.y}>
          <p className="text-sm font-semibold leading-tight">{activeCity.name}</p>
          <p className="text-[0.7rem] text-muted-foreground">{activeCity.country}</p>
          <p className="mt-1 text-[0.7rem] font-medium text-primary">{t(tierRoleKey[activeCity.tier])}</p>
        </Tooltip>
      )}

      {activeRoute && !activeCity && (
        <Tooltip x={activeRoute.mx} y={activeRoute.my}>
          <p className="text-xs font-semibold leading-tight">
            {activeRoute.from.name} <span className="text-primary">→</span> {activeRoute.to.name}
          </p>
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{t('routeType')}</p>
        </Tooltip>
      )}
    </div>
  );
}

function Tooltip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border glass-strong px-3 py-2 shadow-lg"
      style={{ left: `${(x / W) * 100}%`, top: `calc(${(y / H) * 100}% - 14px)` }}
    >
      {children}
    </div>
  );
}
