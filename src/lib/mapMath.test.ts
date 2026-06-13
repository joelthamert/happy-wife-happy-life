import { describe, it, expect } from "vitest";
import { latLngToWorld, worldToLatLng, visibleTiles, markerScreenPos, fitBounds, worldSize, TILE_SIZE } from "./mapMath";

describe("mercator projection", () => {
  it("puts (0,0) at the center of the world square", () => {
    const z = 3;
    const p = latLngToWorld({ lat: 0, lng: 0 }, z);
    expect(p.x).toBeCloseTo(worldSize(z) / 2);
    expect(p.y).toBeCloseTo(worldSize(z) / 2);
  });
  it("round-trips Orlando coordinates", () => {
    const orl = { lat: 28.5384, lng: -81.3789 };
    const back = worldToLatLng(latLngToWorld(orl, 12), 12);
    expect(back.lat).toBeCloseTo(orl.lat, 4);
    expect(back.lng).toBeCloseTo(orl.lng, 4);
  });
  it("clamps polar latitudes instead of exploding", () => {
    expect(Number.isFinite(latLngToWorld({ lat: 90, lng: 0 }, 4).y)).toBe(true);
  });
});

describe("visibleTiles", () => {
  it("covers a 320×240 viewport with the right tile count", () => {
    const tiles = visibleTiles({ lat: 28.54, lng: -81.38 }, 12, 320, 240);
    // 320px spans 2-3 tile columns, 240px spans 1-2 rows
    expect(tiles.length).toBeGreaterThanOrEqual(4);
    expect(tiles.length).toBeLessThanOrEqual(9);
    // every tile must intersect the viewport
    for (const t of tiles) {
      expect(t.left).toBeGreaterThan(-TILE_SIZE);
      expect(t.left).toBeLessThan(320);
      expect(t.top).toBeGreaterThan(-TILE_SIZE);
      expect(t.top).toBeLessThan(240);
    }
  });
  it("wraps x across the antimeridian", () => {
    const tiles = visibleTiles({ lat: 0, lng: 179.9 }, 3, 512, 256);
    const max = Math.pow(2, 3);
    expect(tiles.every(t => t.tx >= 0 && t.tx < max)).toBe(true);
  });
});

describe("markerScreenPos", () => {
  it("places the center marker mid-viewport", () => {
    const c = { lat: 28.54, lng: -81.38 };
    const pos = markerScreenPos(c, c, 12, 320, 240);
    expect(pos.x).toBeCloseTo(160);
    expect(pos.y).toBeCloseTo(120);
  });
  it("places a point west of center to the left", () => {
    const pos = markerScreenPos({ lat: 28.54, lng: -81.5 }, { lat: 28.54, lng: -81.38 }, 12, 320, 240);
    expect(pos.x).toBeLessThan(160);
  });
});

describe("fitBounds", () => {
  it("centers a single point at a friendly zoom", () => {
    const { center, zoom } = fitBounds([{ lat: 28.59, lng: -81.36 }], 320, 240);
    expect(center.lat).toBeCloseTo(28.59);
    expect(zoom).toBe(13);
  });
  it("zooms out to fit Orlando and Miami together", () => {
    const fit = fitBounds([{ lat: 28.54, lng: -81.38 }, { lat: 25.76, lng: -80.19 }], 320, 240);
    const a = markerScreenPos({ lat: 28.54, lng: -81.38 }, fit.center, fit.zoom, 320, 240);
    const b = markerScreenPos({ lat: 25.76, lng: -80.19 }, fit.center, fit.zoom, 320, 240);
    for (const p of [a, b]) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(320);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(240);
    }
  });
});
