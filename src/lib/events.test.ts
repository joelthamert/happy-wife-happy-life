import { describe, it, expect } from "vitest";
import { generateEventICS } from "./ics";
import { daysUntilExact, isPostalCode } from "./utils";
import { normalizeEvent } from "./ticketmaster";
import { migrate, toEnvelope, CURRENT_VERSION, defaultData } from "./migrations";

const tmEvent = (over: Record<string, unknown> = {}) => ({
  id: "evt123",
  name: "Taylor Swift | The Eras Tour",
  url: "https://www.ticketmaster.com/event/evt123",
  images: [
    { ratio: "3_2", url: "https://img/3x2.jpg", width: 640 },
    { ratio: "16_9", url: "https://img/16x9-small.jpg", width: 640 },
    { ratio: "16_9", url: "https://img/16x9-big.jpg", width: 2048 },
  ],
  dates: { start: { localDate: "2026-07-04", localTime: "19:30:00" } },
  classifications: [{ segment: { name: "Music" }, genre: { name: "Pop" } }],
  priceRanges: [{ min: 49.5, max: 499, currency: "USD" }],
  _embedded: {
    venues: [{
      name: "Soldier Field",
      city: { name: "Chicago" },
      state: { stateCode: "IL" },
      location: { latitude: "41.8623", longitude: "-87.6167" },
    }],
    attractions: [{ id: "att1", name: "Taylor Swift", images: [{ url: "https://img/ts.jpg" }] }],
  },
  ...over,
});

describe("normalizeEvent", () => {
  it("maps the fields the UI needs", () => {
    const e = normalizeEvent(tmEvent());
    expect(e).toMatchObject({
      id: "evt123", name: "Taylor Swift | The Eras Tour",
      date: "2026-07-04", time: "19:30:00", tba: false,
      venue: "Soldier Field", city: "Chicago, IL",
      genre: "Music · Pop", priceMin: 49.5, priceMax: 499, currency: "USD",
    });
    expect(e.lat).toBeCloseTo(41.8623);
    expect(e.attractions[0]).toEqual({ id: "att1", name: "Taylor Swift", imageUrl: "https://img/ts.jpg" });
  });
  it("prefers the widest 16:9 image", () => {
    expect(normalizeEvent(tmEvent()).image).toBe("https://img/16x9-big.jpg");
  });
  it("survives missing venue, images, prices and dates", () => {
    const e = normalizeEvent({ id: "x", name: "Mystery", images: [], dates: {}, _embedded: {} });
    expect(e.venue).toBe("Venue TBA");
    expect(e.city).toBe("");
    expect(e.image).toBeNull();
    expect(e.date).toBeNull();
    expect(e.priceMin).toBeNull();
  });
});

describe("generateEventICS — one-off, no RRULE", () => {
  const evt = { id: "evt123", name: "Eras Tour", date: "2026-07-04", time: "19:30:00", tba: false, venue: "Soldier Field", city: "Chicago, IL", url: "https://tm.com/e" };

  it("never includes a yearly RRULE", () => {
    expect(generateEventICS(evt)).not.toContain("RRULE");
  });
  it("uses floating local datetime when a time is present", () => {
    expect(generateEventICS(evt)).toContain("DTSTART:20260704T193000");
  });
  it("falls back to all-day for TBA or missing times", () => {
    expect(generateEventICS({ ...evt, tba: true })).toContain("DTSTART;VALUE=DATE:20260704");
    expect(generateEventICS({ ...evt, time: null })).toContain("DTSTART;VALUE=DATE:20260704");
  });
  it("includes location, url and a 1-day alarm only", () => {
    const ics = generateEventICS(evt);
    expect(ics).toContain("LOCATION:Soldier Field, Chicago, IL");
    expect(ics).toContain("https://tm.com/e");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(1);
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).toContain("UID:hwhl-evt-evt123@hwhl");
  });
  it("pads short HH:MM times to six digits", () => {
    expect(generateEventICS({ ...evt, time: "19:30" })).toContain("DTSTART:20260704T193000");
  });
});

describe("daysUntilExact — no yearly rollover", () => {
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  it("is 0 today, positive for the future, negative for the past", () => {
    const now = new Date();
    expect(daysUntilExact(iso(now))).toBe(0);
    expect(daysUntilExact(iso(new Date(now.getTime() + 5 * 864e5)))).toBe(5);
    expect(daysUntilExact(iso(new Date(now.getTime() - 3 * 864e5)))).toBe(-3);
  });
});

describe("isPostalCode", () => {
  it("matches US ZIPs and ZIP+4, not city names or partial digits", () => {
    expect(isPostalCode("32707")).toBe(true);
    expect(isPostalCode(" 32707 ")).toBe(true);
    expect(isPostalCode("32707-1234")).toBe(true);
    expect(isPostalCode("Chicago")).toBe(false);
    expect(isPostalCode("327")).toBe(false);
    expect(isPostalCode("32707 Chicago")).toBe(false);
  });
});

describe("migration v6 → v7", () => {
  it("adds events fields and preserves everything else", () => {
    const v6 = { version: 6, data: { ...defaultData(), partnerName: "Lindsay" } as never };
    delete (v6.data as Record<string, unknown>).followedArtists;
    delete (v6.data as Record<string, unknown>).savedEvents;
    delete (v6.data as Record<string, unknown>).eventPrefs;
    const { version, data } = migrate(toEnvelope(v6));
    expect(version).toBe(CURRENT_VERSION);
    expect(data.partnerName).toBe("Lindsay");
    expect(data.followedArtists).toEqual([]);
    expect(data.savedEvents).toEqual([]);
    expect(data.eventPrefs).toEqual({ city: "", latlong: null, radius: 25, category: "", sort: "date,asc" });
  });
  it("upgrades raw legacy v4 data all the way to v7", () => {
    const legacy = { partnerName: "Lindsay", preferences: { musicians: [], brands: [], hobbies: [], clothing: [], foods: [], flowers: [], colors: [], scents: [], misc: [] }, dates: [], reminders: [], giftIdeas: [], notes: "", discoveredAnswers: {}, trackedBrands: [] };
    const { version, data } = migrate(toEnvelope(legacy));
    expect(version).toBe(CURRENT_VERSION);
    expect(data.settings).toBeDefined();
    expect(data.eventPrefs.radius).toBe(25);
  });
});
