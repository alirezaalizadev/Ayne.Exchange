/**
 * Global network data for the Global Network map.
 * Tiers drive visual hierarchy: primary hubs (largest, glowing, most routes),
 * secondary hubs (medium), and standard financial centres (small).
 * Coordinates are real [lon, lat] so geography stays recognizable.
 */
export type NodeTier = 'primary' | 'secondary' | 'standard';

export interface City {
  id: string;
  name: string;
  country: string;
  lon: number;
  lat: number;
  tier: NodeTier;
}

export const cities: City[] = [
  // Primary hubs
  { id: 'istanbul', name: 'İstanbul', country: 'Türkiye', lon: 28.98, lat: 41.01, tier: 'primary' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', lon: 55.27, lat: 25.2, tier: 'primary' },
  { id: 'frankfurt', name: 'Frankfurt', country: 'Germany', lon: 8.68, lat: 50.11, tier: 'primary' },
  { id: 'london', name: 'London', country: 'United Kingdom', lon: -0.13, lat: 51.51, tier: 'primary' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', lon: 103.82, lat: 1.35, tier: 'primary' },
  { id: 'hongkong', name: 'Hong Kong', country: 'Hong Kong', lon: 114.17, lat: 22.32, tier: 'primary' },

  // Secondary hubs
  { id: 'moscow', name: 'Moscow', country: 'Russia', lon: 37.62, lat: 55.75, tier: 'secondary' },
  { id: 'zurich', name: 'Zurich', country: 'Switzerland', lon: 8.54, lat: 47.37, tier: 'secondary' },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', lon: 4.9, lat: 52.37, tier: 'secondary' },
  { id: 'shanghai', name: 'Shanghai', country: 'China', lon: 121.47, lat: 31.23, tier: 'secondary' },
  { id: 'newyork', name: 'New York', country: 'United States', lon: -74.01, lat: 40.71, tier: 'secondary' },
  { id: 'warsaw', name: 'Warsaw', country: 'Poland', lon: 21.01, lat: 52.23, tier: 'secondary' },
  { id: 'doha', name: 'Doha', country: 'Qatar', lon: 51.53, lat: 25.29, tier: 'secondary' },
  { id: 'baku', name: 'Baku', country: 'Azerbaijan', lon: 49.87, lat: 40.41, tier: 'secondary' },
  { id: 'tehran', name: 'Tehran', country: 'Iran', lon: 51.39, lat: 35.69, tier: 'secondary' },

  // Standard financial centres
  { id: 'paris', name: 'Paris', country: 'France', lon: 2.35, lat: 48.86, tier: 'standard' },
  { id: 'vienna', name: 'Vienna', country: 'Austria', lon: 16.37, lat: 48.21, tier: 'standard' },
  { id: 'milan', name: 'Milan', country: 'Italy', lon: 9.19, lat: 45.46, tier: 'standard' },
  { id: 'madrid', name: 'Madrid', country: 'Spain', lon: -3.7, lat: 40.42, tier: 'standard' },
  { id: 'prague', name: 'Prague', country: 'Czechia', lon: 14.44, lat: 50.08, tier: 'standard' },
  { id: 'abudhabi', name: 'Abu Dhabi', country: 'UAE', lon: 54.38, lat: 24.45, tier: 'standard' },
  { id: 'riyadh', name: 'Riyadh', country: 'Saudi Arabia', lon: 46.68, lat: 24.71, tier: 'standard' },
  { id: 'beijing', name: 'Beijing', country: 'China', lon: 116.41, lat: 39.9, tier: 'standard' },
  { id: 'shenzhen', name: 'Shenzhen', country: 'China', lon: 114.06, lat: 22.54, tier: 'standard' },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', lon: 126.98, lat: 37.57, tier: 'standard' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', lon: 139.69, lat: 35.68, tier: 'standard' },
  { id: 'kualalumpur', name: 'Kuala Lumpur', country: 'Malaysia', lon: 101.69, lat: 3.14, tier: 'standard' },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', lon: 100.5, lat: 13.76, tier: 'standard' },
  { id: 'almaty', name: 'Almaty', country: 'Kazakhstan', lon: 76.89, lat: 43.24, tier: 'standard' },
  { id: 'tashkent', name: 'Tashkent', country: 'Uzbekistan', lon: 69.24, lat: 41.3, tier: 'standard' },
  { id: 'tbilisi', name: 'Tbilisi', country: 'Georgia', lon: 44.79, lat: 41.72, tier: 'standard' },
  { id: 'toronto', name: 'Toronto', country: 'Canada', lon: -79.38, lat: 43.65, tier: 'standard' },
  { id: 'losangeles', name: 'Los Angeles', country: 'United States', lon: -118.24, lat: 34.05, tier: 'standard' },
  { id: 'chicago', name: 'Chicago', country: 'United States', lon: -87.63, lat: 41.88, tier: 'standard' },
];

/** Potential corridors. `primary: true` ones stay active on mobile too. */
export interface Route {
  from: string;
  to: string;
  primary?: boolean;
}

export const routes: Route[] = [
  { from: 'istanbul', to: 'frankfurt', primary: true },
  { from: 'istanbul', to: 'london', primary: true },
  { from: 'istanbul', to: 'dubai', primary: true },
  { from: 'istanbul', to: 'moscow', primary: true },
  { from: 'istanbul', to: 'hongkong', primary: true },
  { from: 'istanbul', to: 'warsaw' },
  { from: 'istanbul', to: 'zurich' },
  { from: 'istanbul', to: 'baku' },
  { from: 'dubai', to: 'singapore', primary: true },
  { from: 'dubai', to: 'london', primary: true },
  { from: 'dubai', to: 'shanghai' },
  { from: 'dubai', to: 'hongkong', primary: true },
  { from: 'dubai', to: 'zurich' },
  { from: 'dubai', to: 'riyadh' },
  { from: 'frankfurt', to: 'newyork', primary: true },
  { from: 'frankfurt', to: 'warsaw' },
  { from: 'frankfurt', to: 'amsterdam' },
  { from: 'frankfurt', to: 'paris' },
  { from: 'moscow', to: 'dubai' },
  { from: 'moscow', to: 'almaty' },
  { from: 'moscow', to: 'baku' },
  { from: 'hongkong', to: 'singapore', primary: true },
  { from: 'hongkong', to: 'shanghai' },
  { from: 'singapore', to: 'london', primary: true },
  { from: 'singapore', to: 'tokyo' },
  { from: 'tehran', to: 'istanbul' },
  { from: 'tehran', to: 'dubai' },
  { from: 'baku', to: 'istanbul' },
  { from: 'almaty', to: 'istanbul' },
  { from: 'shanghai', to: 'dubai' },
  { from: 'london', to: 'newyork', primary: true },
  { from: 'newyork', to: 'toronto' },
  { from: 'seoul', to: 'hongkong' },
  { from: 'bangkok', to: 'singapore' },
];

/** Tier → tooltip role label key (resolved against the `network` namespace). */
export const tierRoleKey: Record<NodeTier, string> = {
  primary: 'rolePrimary',
  secondary: 'roleSecondary',
  standard: 'roleStandard',
};
