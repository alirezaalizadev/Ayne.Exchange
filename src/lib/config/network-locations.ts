/**
 * Global network — LOCATIONS config. Pure data: rendering projects lat/lng at
 * build time (scripts/gen-geometry.ts). Adding a city = adding one object.
 *
 * tier 1 = Global Hub (largest, double pulse, always labelled)
 * tier 2 = Regional Hub (medium, label where space allows)
 * tier 3 = Network Location (small point, label on interaction)
 */
export type Tier = 1 | 2 | 3;

export type Region =
  | 'TURKIYE'
  | 'EUROPE'
  | 'RUSSIA'
  | 'CENTRAL_ASIA'
  | 'MIDDLE_EAST'
  | 'ASIA'
  | 'NORTH_AMERICA';

export interface NetworkLocation {
  id: string;
  city: string;
  country: string;
  countryCode: string; // ISO alpha-2 (for the existing flag system in tooltips)
  lat: number;
  lng: number;
  tier: Tier;
  region: Region;
  /** Label placement hint for dense clusters (SVG units, text-anchor). */
  label?: { dx?: number; dy?: number; anchor?: 'start' | 'middle' | 'end' };
}

export const locations: NetworkLocation[] = [
  // Türkiye
  { id: 'istanbul', city: 'İstanbul', country: 'Türkiye', countryCode: 'TR', lat: 41.01, lng: 28.98, tier: 1, region: 'TURKIYE' , label: { anchor: 'end', dx: -10, dy: -2 } },
  { id: 'ankara', city: 'Ankara', country: 'Türkiye', countryCode: 'TR', lat: 39.93, lng: 32.85, tier: 3, region: 'TURKIYE' },
  { id: 'izmir', city: 'İzmir', country: 'Türkiye', countryCode: 'TR', lat: 38.42, lng: 27.14, tier: 3, region: 'TURKIYE' },
  // Europe
  { id: 'london', city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.51, lng: -0.13, tier: 1, region: 'EUROPE' , label: { anchor: 'end', dx: -9, dy: 3 } },
  { id: 'frankfurt', city: 'Frankfurt', country: 'Germany', countryCode: 'DE', lat: 50.11, lng: 8.68, tier: 1, region: 'EUROPE' , label: { anchor: 'start', dx: 9, dy: 12 } },
  { id: 'paris', city: 'Paris', country: 'France', countryCode: 'FR', lat: 48.86, lng: 2.35, tier: 2, region: 'EUROPE' , label: { anchor: 'end', dx: -8, dy: 12 } },
  { id: 'amsterdam', city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', lat: 52.37, lng: 4.9, tier: 2, region: 'EUROPE' , label: { anchor: 'start', dx: 8, dy: -4 } },
  { id: 'zurich', city: 'Zurich', country: 'Switzerland', countryCode: 'CH', lat: 47.37, lng: 8.54, tier: 2, region: 'EUROPE' , label: { anchor: 'start', dx: 8, dy: 16 } },
  { id: 'vienna', city: 'Vienna', country: 'Austria', countryCode: 'AT', lat: 48.21, lng: 16.37, tier: 3, region: 'EUROPE' },
  { id: 'milan', city: 'Milan', country: 'Italy', countryCode: 'IT', lat: 45.46, lng: 9.19, tier: 3, region: 'EUROPE' },
  { id: 'madrid', city: 'Madrid', country: 'Spain', countryCode: 'ES', lat: 40.42, lng: -3.7, tier: 3, region: 'EUROPE' },
  { id: 'barcelona', city: 'Barcelona', country: 'Spain', countryCode: 'ES', lat: 41.39, lng: 2.17, tier: 3, region: 'EUROPE' },
  { id: 'warsaw', city: 'Warsaw', country: 'Poland', countryCode: 'PL', lat: 52.23, lng: 21.01, tier: 2, region: 'EUROPE' , label: { anchor: 'start', dx: 8, dy: 2 } },
  { id: 'prague', city: 'Prague', country: 'Czechia', countryCode: 'CZ', lat: 50.08, lng: 14.44, tier: 3, region: 'EUROPE' },
  { id: 'budapest', city: 'Budapest', country: 'Hungary', countryCode: 'HU', lat: 47.5, lng: 19.04, tier: 3, region: 'EUROPE' },
  { id: 'bucharest', city: 'Bucharest', country: 'Romania', countryCode: 'RO', lat: 44.43, lng: 26.1, tier: 3, region: 'EUROPE' },
  { id: 'brussels', city: 'Brussels', country: 'Belgium', countryCode: 'BE', lat: 50.85, lng: 4.35, tier: 3, region: 'EUROPE' },
  // Russia / Eurasia
  { id: 'moscow', city: 'Moscow', country: 'Russia', countryCode: 'RU', lat: 55.75, lng: 37.62, tier: 1, region: 'RUSSIA' , label: { anchor: 'start', dx: 10, dy: 3 } },
  { id: 'spb', city: 'Saint Petersburg', country: 'Russia', countryCode: 'RU', lat: 59.93, lng: 30.36, tier: 3, region: 'RUSSIA' },
  { id: 'kazan', city: 'Kazan', country: 'Russia', countryCode: 'RU', lat: 55.79, lng: 49.11, tier: 3, region: 'RUSSIA' },
  // Central Asia / Caucasus
  { id: 'baku', city: 'Baku', country: 'Azerbaijan', countryCode: 'AZ', lat: 40.41, lng: 49.87, tier: 2, region: 'CENTRAL_ASIA' , label: { anchor: 'start', dx: 8, dy: -2 } },
  { id: 'tbilisi', city: 'Tbilisi', country: 'Georgia', countryCode: 'GE', lat: 41.72, lng: 44.79, tier: 3, region: 'CENTRAL_ASIA' },
  { id: 'almaty', city: 'Almaty', country: 'Kazakhstan', countryCode: 'KZ', lat: 43.24, lng: 76.89, tier: 2, region: 'CENTRAL_ASIA' , label: { anchor: 'start', dx: 8, dy: 0 } },
  { id: 'astana', city: 'Astana', country: 'Kazakhstan', countryCode: 'KZ', lat: 51.13, lng: 71.43, tier: 3, region: 'CENTRAL_ASIA' },
  { id: 'tashkent', city: 'Tashkent', country: 'Uzbekistan', countryCode: 'UZ', lat: 41.3, lng: 69.24, tier: 3, region: 'CENTRAL_ASIA' },
  // Middle East
  { id: 'dubai', city: 'Dubai', country: 'UAE', countryCode: 'AE', lat: 25.2, lng: 55.27, tier: 1, region: 'MIDDLE_EAST' , label: { anchor: 'end', dx: -9, dy: 2 } },
  { id: 'abudhabi', city: 'Abu Dhabi', country: 'UAE', countryCode: 'AE', lat: 24.45, lng: 54.38, tier: 2, region: 'MIDDLE_EAST' , label: { anchor: 'start', dx: 8, dy: 12 } },
  { id: 'doha', city: 'Doha', country: 'Qatar', countryCode: 'QA', lat: 25.29, lng: 51.53, tier: 2, region: 'MIDDLE_EAST' , label: { anchor: 'end', dx: -8, dy: 10 } },
  { id: 'riyadh', city: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA', lat: 24.71, lng: 46.68, tier: 3, region: 'MIDDLE_EAST' },
  { id: 'jeddah', city: 'Jeddah', country: 'Saudi Arabia', countryCode: 'SA', lat: 21.49, lng: 39.19, tier: 3, region: 'MIDDLE_EAST' },
  { id: 'tehran', city: 'Tehran', country: 'Iran', countryCode: 'IR', lat: 35.69, lng: 51.39, tier: 2, region: 'MIDDLE_EAST' , label: { anchor: 'start', dx: 8, dy: 10 } },
  // Asia
  { id: 'hongkong', city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', lat: 22.32, lng: 114.17, tier: 1, region: 'ASIA' , label: { anchor: 'start', dx: 9, dy: 6 } },
  { id: 'singapore', city: 'Singapore', country: 'Singapore', countryCode: 'SG', lat: 1.35, lng: 103.82, tier: 1, region: 'ASIA' , label: { anchor: 'start', dx: 9, dy: 4 } },
  { id: 'shanghai', city: 'Shanghai', country: 'China', countryCode: 'CN', lat: 31.23, lng: 121.47, tier: 2, region: 'ASIA' , label: { anchor: 'start', dx: 8, dy: 0 } },
  { id: 'shenzhen', city: 'Shenzhen', country: 'China', countryCode: 'CN', lat: 22.54, lng: 114.06, tier: 3, region: 'ASIA' },
  { id: 'beijing', city: 'Beijing', country: 'China', countryCode: 'CN', lat: 39.9, lng: 116.41, tier: 3, region: 'ASIA' },
  { id: 'guangzhou', city: 'Guangzhou', country: 'China', countryCode: 'CN', lat: 23.13, lng: 113.26, tier: 3, region: 'ASIA' },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.68, lng: 139.69, tier: 3, region: 'ASIA' },
  { id: 'seoul', city: 'Seoul', country: 'South Korea', countryCode: 'KR', lat: 37.57, lng: 126.98, tier: 3, region: 'ASIA' },
  { id: 'bangkok', city: 'Bangkok', country: 'Thailand', countryCode: 'TH', lat: 13.76, lng: 100.5, tier: 3, region: 'ASIA' },
  { id: 'kualalumpur', city: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY', lat: 3.14, lng: 101.69, tier: 3, region: 'ASIA' },
  { id: 'mumbai', city: 'Mumbai', country: 'India', countryCode: 'IN', lat: 19.08, lng: 72.88, tier: 3, region: 'ASIA' },
  { id: 'delhi', city: 'New Delhi', country: 'India', countryCode: 'IN', lat: 28.61, lng: 77.21, tier: 3, region: 'ASIA' },
  // North America
  { id: 'newyork', city: 'New York', country: 'United States', countryCode: 'US', lat: 40.71, lng: -74.01, tier: 2, region: 'NORTH_AMERICA' , label: { anchor: 'end', dx: -8, dy: 2 } },
  { id: 'chicago', city: 'Chicago', country: 'United States', countryCode: 'US', lat: 41.88, lng: -87.63, tier: 3, region: 'NORTH_AMERICA' },
  { id: 'toronto', city: 'Toronto', country: 'Canada', countryCode: 'CA', lat: 43.65, lng: -79.38, tier: 3, region: 'NORTH_AMERICA' },
  { id: 'losangeles', city: 'Los Angeles', country: 'United States', countryCode: 'US', lat: 34.05, lng: -118.24, tier: 3, region: 'NORTH_AMERICA' },
];

export const locationById: Record<string, NetworkLocation> = Object.fromEntries(
  locations.map((l) => [l.id, l]),
);

export const REGION_COUNT = new Set(locations.map((l) => l.region)).size;

/** Subset of node ids shown on small screens (must stay within the mobile crop). */
export const MOBILE_LOCATION_IDS = new Set([
  'istanbul', 'dubai', 'london', 'frankfurt', 'moscow', 'baku', 'tehran',
  'hongkong', 'singapore', 'shanghai', 'warsaw', 'almaty', 'doha', 'zurich', 'tashkent',
]);

/** Tablet adds most tier-2 context around the core. */
export const TABLET_LOCATION_IDS = new Set([
  ...MOBILE_LOCATION_IDS,
  'paris', 'amsterdam', 'abudhabi', 'newyork', 'ankara', 'tbilisi', 'astana',
  'riyadh', 'mumbai', 'beijing', 'spb', 'vienna', 'milan', 'bucharest',
]);
