import type { LonLat } from './types';

/**
 * Equirectangular projection centred on South Florida, scaled so that
 * east–west and north–south distances match at the reference latitude.
 */
export interface Projection {
  width: number;
  height: number;
  project(p: LonLat): [number, number];
  /** Pixels per kilometre. */
  pxPerKm: number;
}

const KM_PER_DEG_LAT = 111.32;

export function makeProjection(
  bounds: { west: number; east: number; south: number; north: number },
  width: number
): Projection {
  const lat0 = ((bounds.north + bounds.south) / 2) * (Math.PI / 180);
  const kx = Math.cos(lat0);
  const scale = width / ((bounds.east - bounds.west) * kx);
  const height = (bounds.north - bounds.south) * scale;
  return {
    width,
    height,
    project: ([lon, lat]) => [(lon - bounds.west) * kx * scale, (bounds.north - lat) * scale],
    pxPerKm: scale / KM_PER_DEG_LAT
  };
}

export function ringToPath(ring: LonLat[], proj: Projection): string {
  return ring.map((p, i) => {
    const [x, y] = proj.project(p);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join('') + 'Z';
}

/** Area-weighted centroid of a ring in lon/lat (fine for small regions). */
export function centroid(ring: LonLat[]): LonLat {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  if (Math.abs(a) < 1e-12) return ring[0];
  return [cx / (3 * a), cy / (3 * a)];
}

export const SOUTH_FLORIDA_BOUNDS = { west: -82.2, east: -79.8, south: 24.4, north: 27.2 };
