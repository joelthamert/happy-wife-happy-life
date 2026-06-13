import { describe, it, expect } from "vitest";
import { CURRENT_VERSION, defaultData, migrate, parseStored, serialize, toEnvelope } from "./migrations";

const legacyV4 = {
  partnerName: "Lindsay",
  preferences: { musicians: ["Taylor Swift"], brands: ["Lululemon"], hobbies: [], clothing: [], foods: [], flowers: [], colors: [], scents: [], misc: [] },
  dates: [{ id: "a1", label: "Anniversary", date: "2026-12-31", emoji: "💍" }],
  reminders: [],
  giftIdeas: [],
  notes: "loves peonies",
  discoveredAnswers: { fav_artist: "Taylor Swift" },
  trackedBrands: [{ name: "Lululemon", domain: "lululemon.com", tags: ["athletic"], addedAt: "2026-01-01T00:00:00.000Z", notify: true }],
};

describe("toEnvelope", () => {
  it("wraps raw legacy v4 payloads as version 4", () => {
    const env = toEnvelope(legacyV4);
    expect(env.version).toBe(4);
    expect(env.data).toBe(legacyV4);
  });
  it("passes through already-enveloped payloads", () => {
    const env = toEnvelope({ version: 5, data: defaultData() });
    expect(env.version).toBe(5);
  });
});

describe("migrate v4 → v5", () => {
  it("adds settings and streak with defaults", () => {
    const { version, data } = migrate(toEnvelope(legacyV4));
    expect(version).toBe(CURRENT_VERSION);
    expect(data.settings.notifications.dates).toBe(true);
    expect(data.settings.notifications.quietHours).toEqual({ enabled: false, start: "22:00", end: "08:00" });
    expect(data.streak).toEqual({ count: 0, lastAnswerDay: null });
  });
  it("never drops existing user data", () => {
    const { data } = migrate(toEnvelope(legacyV4));
    expect(data.partnerName).toBe("Lindsay");
    expect(data.preferences.musicians).toEqual(["Taylor Swift"]);
    expect(data.dates).toHaveLength(1);
    expect(data.notes).toBe("loves peonies");
    expect(data.trackedBrands[0].name).toBe("Lululemon");
    expect(data.discoveredAnswers.fav_artist).toBe("Taylor Swift");
  });
  it("is idempotent for current-version envelopes", () => {
    const once = migrate(toEnvelope(legacyV4));
    const twice = migrate(once);
    expect(twice).toEqual(once);
  });
  it("throws on unknown future-gap versions instead of corrupting data", () => {
    expect(() => migrate({ version: 1, data: legacyV4 as never })).toThrow(/No migration/);
  });
});

describe("migrate v7 → v8", () => {
  it("adds the theme mode defaulting to dark, preserving other settings", () => {
    const v7data = { ...defaultData() } as Record<string, unknown>;
    const settings = { notifications: { dates: false, reminders: true, brandSales: true, quietHours: { enabled: true, start: "21:00", end: "07:00" } } };
    v7data.settings = settings; // no theme key — pre-v8 shape
    const { data } = migrate({ version: 7, data: v7data as never });
    expect(data.settings.theme).toBe("dark");
    expect(data.settings.notifications.dates).toBe(false);
    expect(data.settings.notifications.quietHours.start).toBe("21:00");
  });
});

describe("parseStored / serialize round trip", () => {
  it("upgrades a legacy raw-JSON string", () => {
    const data = parseStored(JSON.stringify(legacyV4));
    expect(data.partnerName).toBe("Lindsay");
    expect(data.settings).toBeDefined();
  });
  it("round-trips current data unchanged", () => {
    const d = { ...defaultData(), partnerName: "Lindsay" };
    expect(parseStored(serialize(d))).toEqual(d);
  });
  it("serializes with the current version stamp", () => {
    expect(JSON.parse(serialize(defaultData())).version).toBe(CURRENT_VERSION);
  });
});
