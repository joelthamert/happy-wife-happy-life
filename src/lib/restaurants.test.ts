import { describe, it, expect } from "vitest";
import { filterRestaurants, cuisinesIn, distanceMiles, reserveLinks } from "./restaurants";
import { nextFixed, nextMothersDay, dateSuggestions } from "./dateSuggestions";
import { reservationTip, computeDueNotifications } from "./notifications";
import { migrate, toEnvelope, CURRENT_VERSION, defaultData } from "./migrations";
import type { Restaurant } from "../data/restaurants";
import type { AppData } from "../types";

const db: Restaurant[] = [
  { name: "Soseki", city: "Winter Park", state: "FL", cuisine: "Japanese", distinction: "1 star", price: 4, lat: 28.5912, lng: -81.3640, rating: 4.9 },
  { name: "Ômo by Jônt", city: "Winter Park", state: "FL", cuisine: "Contemporary", distinction: "2 stars", price: 4, lat: 28.5963, lng: -81.3512, rating: 4.8 },
  { name: "Le Bernardin", city: "New York", state: "NY", cuisine: "Seafood", distinction: "3 stars", price: 4, lat: 40.7615, lng: -73.9819, rating: 4.8 },
  { name: "Domu", city: "Orlando", state: "FL", cuisine: "Ramen", distinction: "Bib Gourmand", price: 2, lat: 28.5697, lng: -81.3502, rating: 4.5 },
];

describe("filterRestaurants", () => {
  it("filters by cuisine", () => {
    const out = filterRestaurants({ cuisine: "Japanese", sort: "name" }, db);
    expect(out.map(r => r.name)).toEqual(["Soseki"]);
  });
  it("sorts by distance from latlong (Casselberry → Winter Park first, NYC last)", () => {
    const out = filterRestaurants({ latlong: "28.66,-81.34", sort: "distance" }, db);
    expect(out[0].city).toBe("Winter Park");
    expect(out[out.length - 1].name).toBe("Le Bernardin");
    expect(out[0].miles).toBeLessThan(10);
  });
  it("sorts by distinction rank for rating sort", () => {
    const out = filterRestaurants({ sort: "rating" }, db);
    expect(out[0].distinction).toBe("3 stars");
    expect(out[out.length - 1].distinction).toBe("Bib Gourmand");
  });
  it("leaves miles null without a location", () => {
    expect(filterRestaurants({ sort: "name" }, db)[0].miles).toBeNull();
  });
});

describe("distance + helpers", () => {
  it("computes plausible mileage", () => {
    expect(distanceMiles(28.66, -81.34, 28.5912, -81.364)).toBeGreaterThan(3);
    expect(distanceMiles(28.66, -81.34, 28.5912, -81.364)).toBeLessThan(10);
  });
  it("lists unique cuisines sorted", () => {
    expect(cuisinesIn(db)).toEqual(["Contemporary", "Japanese", "Ramen", "Seafood"]);
  });
  it("builds reservation deep links", () => {
    const links = reserveLinks(db[0]);
    expect(links.opentable).toContain("opentable.com");
    expect(links.opentable).toContain("Soseki%20Winter%20Park");
    expect(links.resy).toContain("resy.com");
    expect(links.michelin).toContain("guide.michelin.com");
  });
});

describe("dateSuggestions", () => {
  it("computes the next Valentine's Day and Mother's Day", () => {
    expect(nextFixed(1, 14, new Date(2026, 5, 11))).toBe("2027-02-14");
    expect(nextFixed(1, 14, new Date(2026, 0, 10))).toBe("2026-02-14");
    expect(nextMothersDay(new Date(2026, 5, 11))).toBe("2027-05-09"); // May 10 2026 passed → second Sunday of May 2027
  });
  it("personalizes labels and hides already-added dates", () => {
    const d = { ...defaultData(), partnerName: "Lindsay" } as AppData;
    const before = dateSuggestions(d);
    expect(before.find(s => s.label === "Lindsay's birthday")).toBeDefined();
    d.dates = [{ id: "x", label: "Lindsay's Birthday", date: "1995-03-02", emoji: "🎂" }];
    expect(dateSuggestions(d).find(s => s.label.includes("birthday") && !s.label.includes("mom"))).toBeUndefined();
  });
});

const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return localIso(d); };

describe("reservation notifications", () => {
  const withResv = (days: number): AppData => ({
    ...defaultData(),
    preferences: { ...defaultData().preferences, flowers: ["Peonies"] },
    reservations: [{ id: "r1", restaurant: "Soseki", city: "Winter Park, FL", date: inDays(days), time: "19:00", note: "" }],
  });

  it("fires the 3-day flower tip using her saved flowers", () => {
    const due = computeDueNotifications(withResv(3), new Date(), {});
    const resv = due.find(n => n.category === "reservations");
    expect(resv?.title).toContain("Soseki in 3 days");
    expect(resv?.body).toContain("peonies");
  });
  it("fires confirm-tomorrow and tonight tips", () => {
    expect(computeDueNotifications(withResv(1), new Date(), {}).find(n => n.category === "reservations")?.body).toContain("Confirm");
    expect(computeDueNotifications(withResv(0), new Date(), {}).find(n => n.category === "reservations")?.body).toContain("Tonight");
  });
  it("respects the reservations toggle and the sent log", () => {
    const d = withResv(3);
    d.settings.notifications.reservations = false;
    expect(computeDueNotifications(d, new Date(), {}).filter(n => n.category === "reservations")).toHaveLength(0);
    const on = withResv(3);
    const first = computeDueNotifications(on, new Date(), {}).find(n => n.category === "reservations");
    expect(computeDueNotifications(on, new Date(), { [first!.key]: "sent" }).filter(n => n.category === "reservations")).toHaveLength(0);
  });
  it("falls back gracefully without saved flowers", () => {
    expect(reservationTip(defaultData(), 3)).toContain("Order flowers");
  });
});

describe("migration v8 → v9", () => {
  it("adds reservations and the notification toggle, preserving the rest", () => {
    const v8data = { ...defaultData() } as Record<string, unknown>;
    delete v8data.reservations;
    (v8data.settings as Record<string, unknown>).notifications = { dates: false, reminders: true, brandSales: true, quietHours: { enabled: false, start: "22:00", end: "08:00" } };
    const { version, data } = migrate({ version: 8, data: v8data as never });
    expect(version).toBe(CURRENT_VERSION);
    expect(data.reservations).toEqual([]);
    expect(data.settings.notifications.reservations).toBe(true);
    expect(data.settings.notifications.dates).toBe(false);
  });
  it("upgrades raw legacy v4 all the way to v9", () => {
    const legacy = { partnerName: "Lindsay", preferences: defaultData().preferences, dates: [], reminders: [], giftIdeas: [], notes: "", discoveredAnswers: {}, trackedBrands: [] };
    const { version, data } = migrate(toEnvelope(legacy));
    expect(version).toBe(CURRENT_VERSION);
    expect(data.reservations).toEqual([]);
    expect(data.settings.notifications.reservations).toBe(true);
  });
});
