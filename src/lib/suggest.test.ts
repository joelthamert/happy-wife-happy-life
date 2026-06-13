import { describe, it, expect } from "vitest";
import { suggestRestaurants, rankEventSuggestions, categorySuggestions, bouquetIdeas } from "./suggest";
import { defaultData } from "./migrations";
import type { AppData, LiveEvent } from "../types";

const casselberry = (): AppData => {
  const d = defaultData();
  d.eventPrefs.latlong = "28.6611,-81.3414";
  return d;
};

describe("suggestRestaurants", () => {
  it("returns 3 picks led by proximity when a location is set", () => {
    const picks = suggestRestaurants(casselberry());
    expect(picks).toHaveLength(3);
    expect(picks.every(p => p.miles !== null && p.miles < 30)).toBe(true); // Orlando metro
    expect(picks[0].why).toBeTruthy();
  });
  it("boosts her cuisine answers into the top 3", () => {
    const d = casselberry();
    d.discoveredAnswers = { x_cuisine: "Japanese" };
    const picks = suggestRestaurants(d);
    expect(picks.some(p => p.cuisine === "Japanese" && p.why.includes("her pick"))).toBe(true);
  });
  it("falls back to star power without a location", () => {
    const picks = suggestRestaurants(defaultData());
    expect(picks).toHaveLength(3);
    expect(picks.every(p => p.miles === null)).toBe(true);
    expect(picks[0].distinction).toBe("3 stars");
  });
});

const evt = (id: string, name: string, daysOut: number, genre = "Music · Pop", attractions: Array<{ id: string; name: string }> = []): LiveEvent => {
  const d = new Date(); d.setDate(d.getDate() + daysOut);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { id, name, url: null, image: null, date: iso, time: null, tba: false, venue: "", city: "", lat: null, lng: null, genre, priceMin: null, priceMax: null, currency: "USD", attractions: attractions.map(a => ({ ...a, imageUrl: null })) };
};

describe("rankEventSuggestions", () => {
  it("puts followed artists first even when later, then soonest", () => {
    const d = defaultData();
    d.followedArtists = [{ id: "sg:1", name: "Gorillaz", imageUrl: null }];
    const ranked = rankEventSuggestions([
      evt("a", "Random show", 2),
      evt("b", "Gorillaz live", 60, "Music · Rock", [{ id: "sg:1", name: "Gorillaz" }]),
      evt("c", "Comedy night", 5, "Comedy"),
    ], d, 3);
    expect(ranked[0].id).toBe("b");
    expect(ranked[1].id).toBe("a");
  });
  it("leans toward music when she has saved musicians", () => {
    const d = defaultData();
    d.preferences.musicians = ["gorillaz"];
    const ranked = rankEventSuggestions([evt("m", "Concert", 30), evt("c", "Comedy night", 10, "Comedy")], d, 2);
    expect(ranked[0].id).toBe("m"); // music boost beats the 20-day gap
  });
});

describe("categorySuggestions", () => {
  it("offers chips and hides ones already saved", () => {
    const d = defaultData();
    d.preferences.flowers = ["Peonies"];
    const sugg = categorySuggestions(d, "flowers");
    expect(sugg.length).toBeGreaterThan(0);
    expect(sugg).not.toContain("Peonies");
  });
  it("offers nothing for misc", () => {
    expect(categorySuggestions(defaultData(), "misc")).toEqual([]);
  });
});

describe("bouquetIdeas", () => {
  it("pairs each saved flower with a buyable bouquet", () => {
    const d = defaultData();
    d.preferences.flowers = ["Peonies", "Tulips"];
    const ideas = bouquetIdeas(d);
    expect(ideas).toHaveLength(2);
    expect(ideas[0]).toContain("Peonies");
    expect(ideas[1]).toContain("Tulips");
  });
  it("handles unknown flowers and the flashcard answer fallback", () => {
    const d = defaultData();
    d.preferences.flowers = ["Protea"];
    expect(bouquetIdeas(d)[0]).toContain("protea");
    const e = defaultData();
    e.discoveredAnswers = { x_flower2: "Sunflowers" };
    expect(bouquetIdeas(e)[0].toLowerCase()).toContain("sunflower");
  });
});
