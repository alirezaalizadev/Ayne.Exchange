import { locationById } from './network-locations';

/**
 * Global network — ROUTES config. Corridor groups drive the animation
 * scheduler's rotating waves. `tags` are OPTIONAL service/currency badges shown
 * sparingly on active routes and in route cards — presentation metadata only,
 * never fees/amounts/durations or live-payment claims.
 */
export type RouteGroup =
  | 'EUROPE_TURKIYE'
  | 'TURKIYE_MIDDLE_EAST'
  | 'RUSSIA_TURKIYE'
  | 'CENTRAL_ASIA_TURKIYE'
  | 'EUROPE_UAE'
  | 'UAE_ASIA'
  | 'EUROPE_ASIA'
  | 'ASIA_NORTH_AMERICA'
  | 'TURKIYE_ASIA'
  | 'TURKIYE_NORTH_AMERICA';

export interface NetworkRoute {
  id: string;
  from: string;
  to: string;
  group: RouteGroup;
  tags?: string[];
}

const r = (from: string, to: string, group: RouteGroup, tags?: string[]): NetworkRoute => ({
  id: `${from}-${to}`,
  from,
  to,
  group,
  ...(tags ? { tags } : {}),
});

export const routes: NetworkRoute[] = [
  // İstanbul ↔ Europe (the anchor corridor)
  r('istanbul', 'london', 'EUROPE_TURKIYE', ['SWIFT', 'GBP']),
  r('istanbul', 'frankfurt', 'EUROPE_TURKIYE', ['SWIFT', 'EUR']),
  r('istanbul', 'amsterdam', 'EUROPE_TURKIYE'),
  r('istanbul', 'zurich', 'EUROPE_TURKIYE', ['FX', 'CHF']),
  r('istanbul', 'warsaw', 'EUROPE_TURKIYE'),
  r('istanbul', 'paris', 'EUROPE_TURKIYE', ['SEPA', 'EUR']),
  r('istanbul', 'vienna', 'EUROPE_TURKIYE'),
  r('istanbul', 'milan', 'EUROPE_TURKIYE'),
  r('istanbul', 'prague', 'EUROPE_TURKIYE'),
  r('istanbul', 'budapest', 'EUROPE_TURKIYE'),
  r('istanbul', 'bucharest', 'EUROPE_TURKIYE'),
  r('istanbul', 'brussels', 'EUROPE_TURKIYE'),
  // Türkiye ↔ Middle East
  r('istanbul', 'dubai', 'TURKIYE_MIDDLE_EAST', ['FX', 'AED']),
  r('istanbul', 'abudhabi', 'TURKIYE_MIDDLE_EAST'),
  r('istanbul', 'doha', 'TURKIYE_MIDDLE_EAST'),
  r('istanbul', 'tehran', 'TURKIYE_MIDDLE_EAST', ['FX', 'TRY']),
  r('istanbul', 'riyadh', 'TURKIYE_MIDDLE_EAST'),
  r('istanbul', 'jeddah', 'TURKIYE_MIDDLE_EAST'),
  r('izmir', 'dubai', 'TURKIYE_MIDDLE_EAST'),
  // Russia ↔ Türkiye
  r('moscow', 'istanbul', 'RUSSIA_TURKIYE', ['FX', 'RUB']),
  r('spb', 'istanbul', 'RUSSIA_TURKIYE'),
  r('kazan', 'istanbul', 'RUSSIA_TURKIYE'),
  r('moscow', 'ankara', 'RUSSIA_TURKIYE'),
  // Central Asia / Caucasus ↔ Türkiye
  r('baku', 'istanbul', 'CENTRAL_ASIA_TURKIYE'),
  r('tbilisi', 'istanbul', 'CENTRAL_ASIA_TURKIYE'),
  r('almaty', 'istanbul', 'CENTRAL_ASIA_TURKIYE'),
  r('astana', 'istanbul', 'CENTRAL_ASIA_TURKIYE'),
  r('tashkent', 'istanbul', 'CENTRAL_ASIA_TURKIYE'),
  // Europe ↔ UAE
  r('london', 'dubai', 'EUROPE_UAE', ['SWIFT', 'USD']),
  r('frankfurt', 'dubai', 'EUROPE_UAE'),
  r('zurich', 'dubai', 'EUROPE_UAE'),
  r('paris', 'dubai', 'EUROPE_UAE'),
  r('amsterdam', 'dubai', 'EUROPE_UAE'),
  r('madrid', 'dubai', 'EUROPE_UAE'),
  // UAE / Gulf ↔ Asia
  r('dubai', 'hongkong', 'UAE_ASIA', ['OTC', 'USDT']),
  r('dubai', 'singapore', 'UAE_ASIA'),
  r('dubai', 'shanghai', 'UAE_ASIA', ['FX', 'CNY']),
  r('dubai', 'mumbai', 'UAE_ASIA'),
  r('dubai', 'delhi', 'UAE_ASIA'),
  r('dubai', 'bangkok', 'UAE_ASIA'),
  r('dubai', 'kualalumpur', 'UAE_ASIA'),
  r('abudhabi', 'singapore', 'UAE_ASIA'),
  r('doha', 'hongkong', 'UAE_ASIA'),
  r('riyadh', 'singapore', 'UAE_ASIA'),
  // Europe ↔ Asia
  r('london', 'hongkong', 'EUROPE_ASIA'),
  r('london', 'singapore', 'EUROPE_ASIA'),
  r('frankfurt', 'shanghai', 'EUROPE_ASIA'),
  r('frankfurt', 'beijing', 'EUROPE_ASIA'),
  r('amsterdam', 'singapore', 'EUROPE_ASIA'),
  r('zurich', 'hongkong', 'EUROPE_ASIA'),
  r('moscow', 'shanghai', 'EUROPE_ASIA'),
  // Türkiye ↔ Asia
  r('istanbul', 'hongkong', 'TURKIYE_ASIA'),
  r('istanbul', 'singapore', 'TURKIYE_ASIA'),
  r('istanbul', 'shanghai', 'TURKIYE_ASIA', ['FX', 'CNY']),
  // Asia ↔ North America
  r('hongkong', 'newyork', 'ASIA_NORTH_AMERICA'),
  r('tokyo', 'newyork', 'ASIA_NORTH_AMERICA'),
  r('shanghai', 'losangeles', 'ASIA_NORTH_AMERICA'),
  r('seoul', 'losangeles', 'ASIA_NORTH_AMERICA'),
  r('hongkong', 'toronto', 'ASIA_NORTH_AMERICA'),
  r('singapore', 'chicago', 'ASIA_NORTH_AMERICA'),
  // Türkiye ↔ North America
  r('istanbul', 'newyork', 'TURKIYE_NORTH_AMERICA', ['SWIFT', 'USD']),
];

/* ------------------------------------------------------------------ *
 * Derived, memoized once at module load — never per-frame.
 * ------------------------------------------------------------------ */

export const routeById: Record<string, NetworkRoute> = Object.fromEntries(
  routes.map((rt) => [rt.id, rt]),
);

/** Connection count per location id (legitimate visualization metadata). */
export const connectionCount: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  for (const rt of routes) {
    counts[rt.from] = (counts[rt.from] ?? 0) + 1;
    counts[rt.to] = (counts[rt.to] ?? 0) + 1;
  }
  return counts;
})();

/** Scheduler waves: corridor emphasis rotation (each wave = set of groups). */
export const SCHEDULER_WAVES: RouteGroup[][] = [
  ['EUROPE_TURKIYE', 'TURKIYE_MIDDLE_EAST'],
  ['RUSSIA_TURKIYE', 'CENTRAL_ASIA_TURKIYE', 'TURKIYE_MIDDLE_EAST'],
  ['EUROPE_UAE', 'UAE_ASIA'],
  ['EUROPE_ASIA', 'TURKIYE_ASIA', 'ASIA_NORTH_AMERICA', 'TURKIYE_NORTH_AMERICA'],
];

/** Routes usable on small screens (both ends within the mobile node subset). */
export function routesWithin(ids: Set<string>): NetworkRoute[] {
  return routes.filter((rt) => ids.has(rt.from) && ids.has(rt.to));
}

/** Country (ISO alpha-2) → primary network city, for the transaction-link layer. */
export const countryToCity: Record<string, string> = (() => {
  const byCountry: Record<string, string> = {};
  // Highest tier (lowest number) wins per country.
  const sorted = Object.values(locationById).sort((a, b) => a.tier - b.tier);
  for (const l of sorted) if (!byCountry[l.countryCode]) byCountry[l.countryCode] = l.id;
  return byCountry;
})();
