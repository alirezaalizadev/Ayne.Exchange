'use client';

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  locations,
  locationById,
  MOBILE_LOCATION_IDS,
  TABLET_LOCATION_IDS,
  type Tier,
  type NetworkLocation,
} from '@/lib/config/network-locations';
import {
  routeById,
  connectionCount,
  routesWithin,
  SCHEDULER_WAVES,
} from '@/lib/config/network-routes';
import { networkGeometry } from '@/lib/config/network-geometry-static';
import { flagEmoji } from '@/lib/config/countries';
import { cn } from '@/lib/utils';

/**
 * Global payment network — SVG rendering over build-time-projected geometry.
 * Route states: INACTIVE (faint, always visible) → ACTIVE (accent arc) →
 * TRANSFER (arc + moving light particle + destination pulse).
 *
 * A scheduler promotes/demotes routes in corridor waves every few seconds
 * (React state changes at multi-second cadence only — never per frame; the
 * continuous motion is CSS transitions + SMIL, off the React render path).
 */

const G = networkGeometry;

/* Responsive viewBox crops (hand-tuned from generated coordinates). */
const VIEWBOX = {
  desktop: { x: 60, y: 25, w: 1120, h: 555 },
  tablet: { x: 260, y: 35, w: 940, h: 500 },
  mobile: { x: 555, y: 65, w: 530, h: 330 },
} as const;

type Breakpoint = keyof typeof VIEWBOX;

const CAPS: Record<Breakpoint, { active: number; transfer: number }> = {
  desktop: { active: 14, transfer: 6 },
  tablet: { active: 10, transfer: 4 },
  mobile: { active: 6, transfer: 3 },
};

const TIER_STYLE: Record<Tier, { r: number; glow: number; label: number }> = {
  1: { r: 5, glow: 24, label: 12.5 },
  2: { r: 3.4, glow: 13, label: 11 },
  3: { r: 2.3, glow: 0, label: 10 },
};

const TIER_ROLE_KEY: Record<Tier, string> = { 1: 'rolePrimary', 2: 'roleSecondary', 3: 'roleStandard' };

/** Deterministic-enough shuffle for wave variety. */
function pickShuffled<T>(arr: T[], n: number, salt: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (i * 2654435761 + salt * 97) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export interface TransferInfo {
  id: string;
  from: NetworkLocation;
  to: NetworkLocation;
}

export function GlobalNetworkMap({
  className,
  onTransfersChange,
}: {
  className?: string;
  /** Step-4 hook: side panel subscribes to the current TRANSFER list. */
  onTransfersChange?: (transfers: TransferInfo[]) => void;
}) {
  const t = useTranslations('network');
  const reduce = useReducedMotion();
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const [paused, setPaused] = React.useState(false);
  const [bp, setBp] = React.useState<Breakpoint>('desktop');
  const [hoverCity, setHoverCity] = React.useState<string | null>(null);
  const [hoverRoute, setHoverRoute] = React.useState<string | null>(null);
  const [tip, setTip] = React.useState<{ x: number; y: number } | null>(null);
  const [activeIds, setActiveIds] = React.useState<Set<string>>(new Set());
  const [transferIds, setTransferIds] = React.useState<Set<string>>(new Set());

  /* ---------- responsive breakpoint ---------- */
  React.useEffect(() => {
    const mqMobile = window.matchMedia('(max-width: 767px)');
    const mqTablet = window.matchMedia('(max-width: 1023px)');
    const update = () => setBp(mqMobile.matches ? 'mobile' : mqTablet.matches ? 'tablet' : 'desktop');
    update();
    mqMobile.addEventListener('change', update);
    mqTablet.addEventListener('change', update);
    return () => {
      mqMobile.removeEventListener('change', update);
      mqTablet.removeEventListener('change', update);
    };
  }, []);

  /* ---------- pause off-viewport and when tab hidden ---------- */
  React.useEffect(() => {
    const el = wrapRef.current;
    let inView = true;
    let visible = !document.hidden;
    const apply = () => setPaused(!(inView && visible));
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

  /* ---------- visible subsets (memoized) ---------- */
  const visibleLocations = React.useMemo(() => {
    if (bp === 'mobile') return locations.filter((l) => MOBILE_LOCATION_IDS.has(l.id));
    if (bp === 'tablet') return locations.filter((l) => TABLET_LOCATION_IDS.has(l.id));
    return locations;
  }, [bp]);

  const visibleRoutes = React.useMemo(() => {
    const ids = new Set(visibleLocations.map((l) => l.id));
    const usable = routesWithin(ids);
    const geomById = new Map(G.routeGeom.map((g) => [g.id, g]));
    return usable
      .map((rt) => ({ config: rt, geom: geomById.get(rt.id) }))
      .filter((x): x is { config: (typeof usable)[number]; geom: NonNullable<typeof x.geom> } => !!x.geom);
  }, [visibleLocations]);

  /* ---------- corridor-wave scheduler (multi-second cadence) ---------- */
  const waveRef = React.useRef(0);
  React.useEffect(() => {
    if (reduce) {
      // Static composed state: a fixed spread of active arcs, no transfers.
      const fixed = pickShuffled(visibleRoutes, CAPS[bp].active, 7).map((r) => r.config.id);
      setActiveIds(new Set(fixed));
      setTransferIds(new Set());
      return;
    }
    if (paused) return;

    const caps = CAPS[bp];
    const tick = () => {
      const salt = waveRef.current++;
      const wave = SCHEDULER_WAVES[salt % SCHEDULER_WAVES.length];
      const inWave = visibleRoutes.filter((r) => (wave as string[]).includes(r.config.group));
      const others = visibleRoutes.filter((r) => !(wave as string[]).includes(r.config.group));
      // İstanbul stays alive: always keep a few of its routes in the mix.
      const istanbul = visibleRoutes.filter(
        (r) => r.config.from === 'istanbul' || r.config.to === 'istanbul',
      );
      const picked = [
        ...pickShuffled(istanbul, Math.min(3, istanbul.length), salt),
        ...pickShuffled(inWave, caps.active, salt + 1),
        ...pickShuffled(others, 3, salt + 2),
      ];
      const active: string[] = [];
      for (const p of picked) if (!active.includes(p.config.id)) active.push(p.config.id);
      const finalActive = active.slice(0, caps.active);
      const transfer = finalActive.slice(0, caps.transfer);
      setActiveIds(new Set(finalActive));
      setTransferIds(new Set(transfer));
      onTransfersChange?.(
        transfer.map((id) => ({
          id,
          from: locationById[routeById[id].from],
          to: locationById[routeById[id].to],
        })),
      );
    };
    tick();
    const iv = setInterval(tick, 6500);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bp, paused, reduce, visibleRoutes]);

  /* ---------- hover helpers (tooltip anchored via measured rects) ---------- */
  const anchorTip = (e: React.MouseEvent) => {
    const wrap = wrapRef.current?.getBoundingClientRect();
    const el = (e.currentTarget as Element).getBoundingClientRect();
    if (!wrap) return;
    setTip({ x: el.left + el.width / 2 - wrap.left, y: el.top - wrap.top });
  };

  const connectedTo = React.useMemo(() => {
    if (!hoverCity) return null;
    const set = new Set<string>();
    for (const r of visibleRoutes) {
      if (r.config.from === hoverCity || r.config.to === hoverCity) set.add(r.config.id);
    }
    return set;
  }, [hoverCity, visibleRoutes]);

  const vb = VIEWBOX[bp];
  const anyHover = !!hoverCity || !!hoverRoute;
  const hoverCityData = hoverCity ? locationById[hoverCity] : null;
  const hoverRouteData = hoverRoute ? routeById[hoverRoute] : null;

  return (
    <div
      ref={wrapRef}
      className={cn('relative w-full', className)}
      style={{ aspectRatio: `${vb.w} / ${vb.h}` }}
    >
      <svg
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className={cn('h-full w-full', paused && 'map-paused')}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={t('title')}
      >
        <defs>
          <linearGradient id="gnm-route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="55%" stopColor="hsl(var(--primary))" stopOpacity="0.95" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.55" />
          </linearGradient>
          <filter id="gnm-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        {/* graticule + landmass */}
        <path d={G.graticulePath} fill="none" stroke="hsl(var(--foreground))" strokeOpacity="0.045" strokeWidth="0.6" />
        <path
          d={G.landPath}
          fill="hsl(var(--foreground))"
          fillOpacity="0.055"
          stroke="hsl(var(--foreground))"
          strokeOpacity="0.14"
          strokeWidth="0.6"
        />

        {/* ROUTES — inactive layer (always), active overlay (state-driven) */}
        <g fill="none" strokeLinecap="round">
          {visibleRoutes.map(({ config, geom }) => {
            const isActive = activeIds.has(config.id);
            const isTransfer = transferIds.has(config.id);
            const isHovered = hoverRoute === config.id || connectedTo?.has(config.id);
            const dimmed = anyHover && !isHovered;

            return (
              <g
                key={config.id}
                className="transition-opacity duration-500"
                style={{ opacity: dimmed ? 0.25 : 1 }}
                onMouseEnter={(e) => {
                  setHoverRoute(config.id);
                  anchorTip(e);
                }}
                onMouseLeave={() => setHoverRoute((c) => (c === config.id ? null : c))}
              >
                {/* hit area */}
                <path d={geom.d} stroke="transparent" strokeWidth="12" />
                {/* INACTIVE — the "network exists" layer */}
                <path d={geom.d} stroke="hsl(var(--primary))" strokeOpacity={0.09} strokeWidth="1" />
                {/* ACTIVE — fades in/out via CSS (never hard-swapped) */}
                <path
                  d={geom.d}
                  stroke="url(#gnm-route)"
                  strokeWidth={isHovered ? 2.2 : 1.6}
                  className="transition-opacity ease-premium"
                  style={{ opacity: isActive || isHovered ? 1 : 0, transitionDuration: '1400ms' }}
                />
                {/* TRANSFER — moving light with soft trail */}
                {isTransfer && !reduce && (
                  <>
                    <circle r="4.5" fill="hsl(var(--primary))" opacity="0.35" filter="url(#gnm-soft)">
                      <animateMotion dur="5.2s" repeatCount="indefinite" path={geom.d} />
                    </circle>
                    <circle r="2.1" fill="hsl(var(--primary))">
                      <animateMotion dur="5.2s" repeatCount="indefinite" path={geom.d} />
                    </circle>
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* NODES */}
        <g>
          {visibleLocations.map((l) => {
            const p = G.nodeXY[l.id];
            if (!p) return null;
            const s = TIER_STYLE[l.tier];
            const isHovered = hoverCity === l.id;
            const isTransferEnd =
              !reduce &&
              [...transferIds].some((id) => routeById[id]?.to === l.id || routeById[id]?.from === l.id);
            const dimmed = anyHover && !isHovered && !(hoverRoute && (routeById[hoverRoute]?.from === l.id || routeById[hoverRoute]?.to === l.id));
            const showLabel =
              isHovered ||
              (l.tier === 1) ||
              (l.tier === 2 && bp === 'desktop');

            return (
              <g
                key={l.id}
                transform={`translate(${p.x} ${p.y})`}
                className="transition-opacity duration-500"
                style={{ opacity: dimmed ? 0.35 : 1 }}
                onMouseEnter={(e) => {
                  setHoverCity(l.id);
                  anchorTip(e);
                }}
                onMouseLeave={() => setHoverCity((c) => (c === l.id ? null : c))}
              >
                {s.glow > 0 && (
                  <circle r={s.glow} fill="hsl(var(--primary))" fillOpacity={l.tier === 1 ? 0.1 : 0.07} />
                )}
                {/* Tier-1: double pulse rings */}
                {l.tier === 1 && !reduce && bp !== 'mobile' && (
                  <>
                    <circle r={s.r + 4} fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.5">
                      <animate attributeName="r" values={`${s.r + 4};${s.r + 16}`} dur="3.6s" repeatCount="indefinite" />
                      <animate attributeName="stroke-opacity" values="0.5;0" dur="3.6s" repeatCount="indefinite" />
                    </circle>
                    <circle r={s.r + 4} fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.5">
                      <animate attributeName="r" values={`${s.r + 4};${s.r + 16}`} dur="3.6s" begin="1.8s" repeatCount="indefinite" />
                      <animate attributeName="stroke-opacity" values="0.5;0" dur="3.6s" begin="1.8s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
                {/* Destination pulse while part of a transfer */}
                {isTransferEnd && l.tier !== 1 && (
                  <circle r={s.r + 2} fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.6">
                    <animate attributeName="r" values={`${s.r + 2};${s.r + 10}`} dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.6;0" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  r={s.r}
                  fill={l.tier === 3 ? 'hsl(var(--foreground))' : 'hsl(var(--primary))'}
                  fillOpacity={l.tier === 3 ? 0.55 : 1}
                  stroke="hsl(var(--background))"
                  strokeWidth="1.2"
                />
                {l.tier === 1 && <circle r={s.r - 3} fill="hsl(var(--background))" fillOpacity="0.9" />}
                {/* generous hit target */}
                <circle r={Math.max(13, s.glow)} fill="transparent" style={{ cursor: 'pointer' }} />
                {showLabel && (
                  <text
                    x={l.label?.dx ?? 0}
                    y={l.label?.dy != null ? l.label.dy : -(s.r + (l.tier === 1 ? 10 : 7))}
                    textAnchor={l.label?.anchor ?? 'middle'}
                    className={cn(isHovered ? 'fill-foreground' : 'fill-muted-foreground')}
                    style={{
                      fontSize: s.label,
                      fontWeight: l.tier === 1 ? 700 : 500,
                      pointerEvents: 'none',
                      letterSpacing: '0.01em',
                      paintOrder: 'stroke',
                      stroke: 'hsl(var(--surface))',
                      strokeWidth: 3,
                      strokeLinejoin: 'round',
                    }}
                  >
                    {l.city}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* City tooltip */}
      {hoverCityData && tip && (
        <MapTip x={tip.x} y={tip.y}>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-sm leading-none">
              {flagEmoji(hoverCityData.countryCode) || hoverCityData.countryCode}
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">{hoverCityData.city}</p>
              <p className="text-[0.7rem] text-muted-foreground">{hoverCityData.country}</p>
            </div>
          </div>
          <p className="mt-1.5 text-[0.7rem] font-semibold text-primary">
            {t(TIER_ROLE_KEY[hoverCityData.tier])} · {t('connections', { count: connectionCount[hoverCityData.id] ?? 0 })}
          </p>
        </MapTip>
      )}

      {/* Route tooltip */}
      {hoverRouteData && !hoverCityData && tip && (
        <MapTip x={tip.x} y={tip.y}>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span>{flagEmoji(locationById[hoverRouteData.from].countryCode)}</span>
            {locationById[hoverRouteData.from].city}
            <span className="text-primary">→</span>
            <span>{flagEmoji(locationById[hoverRouteData.to].countryCode)}</span>
            {locationById[hoverRouteData.to].city}
          </div>
          <p className="mt-1 text-[0.7rem] text-muted-foreground">
            {hoverRouteData.tags ? hoverRouteData.tags.join(' · ') : t('routeType')}
          </p>
        </MapTip>
      )}
    </div>
  );
}

function MapTip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-md"
      style={{ left: x, top: y - 10 }}
      dir="ltr"
    >
      {children}
    </div>
  );
}
