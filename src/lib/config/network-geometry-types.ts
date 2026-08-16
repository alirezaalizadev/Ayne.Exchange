/** Pure types for the precomputed network geometry (no heavy imports). */
export interface RouteGeom {
  from: string;
  to: string;
  d: string;
  mx: number;
  my: number;
  primary: boolean;
  delay: number;
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
