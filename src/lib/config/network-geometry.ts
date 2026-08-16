import { geoEqualEarth, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
import landTopo from 'world-atlas/land-110m.json';
import { cities, routes } from './network';
import type { NetworkGeometry, RouteGeom } from './network-geometry-types';

/**
 * SERVER-ONLY geometry precomputation. This module imports d3-geo,
 * topojson-client and the world-atlas dataset. It is imported ONLY by the
 * server component (NetworkSection), which passes the resulting plain,
 * serializable geometry to the client map as props — so none of these heavy
 * libraries (or the ~100KB world map JSON) are shipped to the browser.
 *
 * Because the homepage is statically generated, this runs once at build time.
 */
export const W = 1000;
export const H = 600;

const projection = geoEqualEarth()
  .rotate([-12, 0])
  .fitExtent(
    [
      [26, 24],
      [W - 26, H - 46],
    ],
    { type: 'Sphere' },
  );

const pathGen = geoPath(projection);

export const landPath =
  pathGen(feature(landTopo as any, (landTopo as any).objects.land) as any) ?? '';
export const graticulePath = pathGen(geoGraticule10()) ?? '';
export const spherePath = pathGen({ type: 'Sphere' } as any) ?? '';

export const nodeXY: Record<string, { x: number; y: number }> = Object.fromEntries(
  cities.map((c) => {
    const p = projection([c.lon, c.lat]) ?? [0, 0];
    return [c.id, { x: p[0], y: p[1] }];
  }),
);

function arcPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const curve = Math.min(120, dist * 0.24);
  const nx = -dy / dist;
  const ny = dx / dist;
  const my0 = (a.y + b.y) / 2;
  let cx = (a.x + b.x) / 2 + nx * curve;
  let cy = my0 + ny * curve;
  if (cy > my0) {
    cx = (a.x + b.x) / 2 - nx * curve;
    cy = my0 - ny * curve;
  }
  return { d: `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`, mx: (a.x + b.x) / 2, my: cy };
}

export const routeGeom: RouteGeom[] = routes
  .map((r, i) => {
    const a = nodeXY[r.from];
    const b = nodeXY[r.to];
    if (!a || !b) return null;
    const { d, mx, my } = arcPath(a, b);
    return { from: r.from, to: r.to, d, mx, my, primary: !!r.primary, delay: -(i / routes.length) * 15 };
  })
  .filter(Boolean) as RouteGeom[];

export const networkGeometry: NetworkGeometry = {
  W,
  H,
  landPath,
  graticulePath,
  spherePath,
  nodeXY,
  routeGeom,
};
