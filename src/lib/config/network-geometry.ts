import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
import landTopo from 'world-atlas/land-110m.json';
import { locations } from './network-locations';
import { routes } from './network-routes';
import type { NetworkGeometry, RouteGeom } from './network-geometry-types';

/**
 * SERVER-ONLY geometry precomputation (runs once, at build, via
 * scripts/gen-geometry.ts). Imports d3-geo/topojson/world-atlas — none of
 * which ship to the browser; the client reads the serialized static module.
 *
 * Projection: Natural Earth, rotated so the network's centre of gravity
 * (Europe – Türkiye – Middle East – Asia) dominates the frame and the
 * Americas sit at the edge.
 */
export const W = 1400;

const projection = geoNaturalEarth1().rotate([-35, 0]);
// Fit the full sphere to the canvas width; height follows the projection.
projection.fitWidth(W, { type: 'Sphere' } as never);

const pathGen = geoPath(projection);
const [[, y0], [, y1]] = pathGen.bounds({ type: 'Sphere' } as never);
export const H = Math.ceil(y1 - y0);

export const landPath = pathGen(feature(landTopo as never, (landTopo as { objects: { land: never } }).objects.land) as never) ?? '';
export const graticulePath = pathGen(geoGraticule10()) ?? '';
export const spherePath = pathGen({ type: 'Sphere' } as never) ?? '';

export const nodeXY: Record<string, { x: number; y: number }> = Object.fromEntries(
  locations.map((l) => {
    const p = projection([l.lng, l.lat]) ?? [0, 0];
    return [l.id, { x: Math.round(p[0] * 100) / 100, y: Math.round(p[1] * 100) / 100 }];
  }),
);

/** Curved arc whose rise scales with distance (long hauls arc visibly higher). */
function arcPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const lift = Math.min(190, 14 + dist * 0.22);
  const mx0 = (a.x + b.x) / 2;
  const my0 = (a.y + b.y) / 2;
  // Perpendicular offset, always bowing "up" (towards smaller y).
  const nx = -dy / dist;
  const ny = dx / dist;
  let cx = mx0 + nx * lift;
  let cy = my0 + ny * lift;
  if (cy > my0) {
    cx = mx0 - nx * lift;
    cy = my0 - ny * lift;
  }
  const round = (v: number) => Math.round(v * 100) / 100;
  return {
    d: `M${round(a.x)},${round(a.y)} Q${round(cx)},${round(cy)} ${round(b.x)},${round(b.y)}`,
    mx: round((mx0 + cx) / 2),
    my: round((my0 + cy) / 2),
  };
}

export const routeGeom: RouteGeom[] = routes
  .map((rt) => {
    const a = nodeXY[rt.from];
    const b = nodeXY[rt.to];
    if (!a || !b) return null;
    const { d, mx, my } = arcPath(a, b);
    return { id: rt.id, from: rt.from, to: rt.to, d, mx, my };
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
