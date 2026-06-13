/* Web Mercator math for the zero-dependency tile map (MapView).
 * World pixel space: the whole world at zoom z is a square of
 * 256 · 2^z pixels; (0,0) is the top-left (lat 85.05…, lng −180). */

export const TILE_SIZE = 256;

export interface LatLng { lat: number; lng: number; }
export interface WorldPx { x: number; y: number; }

export const worldSize = (zoom: number): number => TILE_SIZE * Math.pow(2, zoom);

export const latLngToWorld = ({ lat, lng }: LatLng, zoom: number): WorldPx => {
  const size = worldSize(zoom);
  const x = ((lng + 180) / 360) * size;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  // clamp to mercator's printable range so poles don't blow up
  const clamped = Math.min(Math.max(sinLat, -0.9999), 0.9999);
  const y = (0.5 - Math.log((1 + clamped) / (1 - clamped)) / (4 * Math.PI)) * size;
  return { x, y };
};

export const worldToLatLng = ({ x, y }: WorldPx, zoom: number): LatLng => {
  const size = worldSize(zoom);
  const lng = (x / size) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / size;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
};

export interface TileSpec { tx: number; ty: number; left: number; top: number; key: string; }

/** Tiles covering a w×h viewport centered on `center` (x wraps, y clamps). */
export const visibleTiles = (center: LatLng, zoom: number, w: number, h: number): TileSpec[] => {
  const c = latLngToWorld(center, zoom);
  const tiles: TileSpec[] = [];
  const maxTile = Math.pow(2, zoom);
  const x0 = Math.floor((c.x - w / 2) / TILE_SIZE);
  const x1 = Math.floor((c.x + w / 2) / TILE_SIZE);
  const y0 = Math.floor((c.y - h / 2) / TILE_SIZE);
  const y1 = Math.floor((c.y + h / 2) / TILE_SIZE);
  for (let tx = x0; tx <= x1; tx++) {
    for (let ty = Math.max(y0, 0); ty <= Math.min(y1, maxTile - 1); ty++) {
      const wrapped = ((tx % maxTile) + maxTile) % maxTile;
      tiles.push({ tx: wrapped, ty, left: tx * TILE_SIZE - c.x + w / 2, top: ty * TILE_SIZE - c.y + h / 2, key: `${tx}:${ty}` });
    }
  }
  return tiles;
};

/** Screen position of a marker within a w×h viewport centered on `center`. */
export const markerScreenPos = (marker: LatLng, center: LatLng, zoom: number, w: number, h: number): { x: number; y: number } => {
  const m = latLngToWorld(marker, zoom);
  const c = latLngToWorld(center, zoom);
  return { x: m.x - c.x + w / 2, y: m.y - c.y + h / 2 };
};

/** Center + zoom that fit all points in a w×h viewport (with padding). */
export const fitBounds = (points: LatLng[], w: number, h: number, maxZoom = 15, pad = 48): { center: LatLng; zoom: number } => {
  if (!points.length) return { center: { lat: 28.54, lng: -81.38 }, zoom: 10 };
  if (points.length === 1) return { center: points[0], zoom: Math.min(13, maxZoom) };
  const lats = points.map(p => p.lat), lngs = points.map(p => p.lng);
  const center = { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 };
  for (let z = maxZoom; z >= 2; z--) {
    const pts = points.map(p => latLngToWorld(p, z));
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    if (Math.max(...xs) - Math.min(...xs) <= w - pad * 2 && Math.max(...ys) - Math.min(...ys) <= h - pad * 2) {
      return { center, zoom: z };
    }
  }
  return { center, zoom: 2 };
};
