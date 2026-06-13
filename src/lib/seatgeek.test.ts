import { describe, it, expect } from "vitest";
import { normalizeSgEvent } from "./seatgeek";
import { sortByDistance } from "./eventProvider";
import type { LiveEvent } from "../types";

const sgEvent = (over: Record<string, unknown> = {}) => ({
  id: 6377482,
  title: "Morgan Wallen with Miranda Lambert",
  short_title: "Morgan Wallen",
  url: "https://seatgeek.com/morgan-wallen-tickets/6377482",
  datetime_local: "2026-07-18T19:00:00",
  datetime_tbd: false,
  venue: {
    name: "Camping World Stadium",
    city: "Orlando",
    state: "FL",
    location: { lat: 28.539, lon: -81.403 },
  },
  performers: [
    { id: 35, name: "Morgan Wallen", image: "https://img/sg-mw.jpg" },
    { id: 77, name: "Miranda Lambert", image: null },
  ],
  taxonomies: [{ name: "country_music" }],
  stats: { lowest_price: 79, highest_price: 410 },
  ...over,
});

describe("normalizeSgEvent", () => {
  it("maps SeatGeek fields into the shared LiveEvent shape with sg- prefixed ids", () => {
    const e = normalizeSgEvent(sgEvent());
    expect(e).toMatchObject({
      id: "sg-6377482",
      name: "Morgan Wallen with Miranda Lambert",
      date: "2026-07-18", time: "19:00:00", tba: false,
      venue: "Camping World Stadium", city: "Orlando, FL",
      genre: "Country Music", priceMin: 79, priceMax: 410, currency: "USD",
      image: "https://img/sg-mw.jpg",
    });
    expect(e.lat).toBeCloseTo(28.539);
    expect(e.attractions[0]).toEqual({ id: "sg:35", name: "Morgan Wallen", imageUrl: "https://img/sg-mw.jpg" });
  });
  it("treats datetime_tbd as an all-day TBA event", () => {
    const e = normalizeSgEvent(sgEvent({ datetime_tbd: true }));
    expect(e.tba).toBe(true);
    expect(e.time).toBeNull();
    expect(e.date).toBe("2026-07-18");
  });
  it("survives missing venue, performers, stats", () => {
    const e = normalizeSgEvent({ id: 1, title: "Mystery", datetime_local: "" });
    expect(e.venue).toBe("Venue TBA");
    expect(e.city).toBe("");
    expect(e.date).toBeNull();
    expect(e.priceMin).toBeNull();
    expect(e.image).toBeNull();
  });
});

describe("sortByDistance", () => {
  const ev = (id: string, lat: number | null, lng: number | null): LiveEvent => ({
    id, name: id, url: null, image: null, date: "2026-07-01", time: null, tba: false,
    venue: "", city: "", lat, lng, genre: "", priceMin: null, priceMax: null, currency: "USD", attractions: [],
  });
  it("orders by haversine distance from the given latlong, unknown coords last", () => {
    const orlando = "28.54,-81.38";
    const sorted = sortByDistance([ev("nyc", 40.71, -74.0), ev("tampa", 27.95, -82.46), ev("unknown", null, null), ev("orlando", 28.54, -81.38)], orlando);
    expect(sorted.map(e => e.id)).toEqual(["orlando", "tampa", "nyc", "unknown"]);
  });
});
