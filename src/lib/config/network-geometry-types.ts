/** Pure types for the precomputed network geometry (no heavy imports). */
export interface RouteGeom {
  id: string;
  from: string;
  to: string;
  d: string; // curved arc path
  mx: number; // midpoint (route tooltip anchor)
  my: number;
}

export interface NetworkGeometry {
  W: number;
  H: number;
  landPath: string;
  graticulePath: string;
  spherePath: string;
  nodeXY: Record<string, { x: number; y: number }>;
  routeGeom: RouteGeom[];
}
