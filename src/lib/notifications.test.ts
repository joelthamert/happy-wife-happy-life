import { describe, it, expect } from "vitest";
import { computeDueNotifications, inQuietHours } from "./notifications";
import { defaultData } from "./migrations";
import type { AppData, NotificationSettings } from "../types";

const settings = (over: Partial<NotificationSettings> = {}): NotificationSettings => ({
  dates: true, reminders: true, brandSales: true, reservations: true,
  quietHours: { enabled: false, start: "22:00", end: "08:00" },
  ...over,
});

const at = (h: number, m = 0) => new Date(2026, 5, 11, h, m); // June 11 2026, local

describe("inQuietHours", () => {
  it("is always false when disabled", () => {
    expect(inQuietHours(settings(), at(23))).toBe(false);
  });
  it("handles overnight ranges (22:00 → 08:00)", () => {
    const s = settings({ quietHours: { enabled: true, start: "22:00", end: "08:00" } });
    expect(inQuietHours(s, at(23))).toBe(true);
    expect(inQuietHours(s, at(3))).toBe(true);
    expect(inQuietHours(s, at(7, 59))).toBe(true);
    expect(inQuietHours(s, at(8))).toBe(false);
    expect(inQuietHours(s, at(12))).toBe(false);
    expect(inQuietHours(s, at(21, 59))).toBe(false);
  });
  it("handles same-day ranges (13:00 → 15:00)", () => {
    const s = settings({ quietHours: { enabled: true, start: "13:00", end: "15:00" } });
    expect(inQuietHours(s, at(14))).toBe(true);
    expect(inQuietHours(s, at(12))).toBe(false);
    expect(inQuietHours(s, at(15))).toBe(false);
  });
});

const dataWith = (over: Partial<AppData>): AppData => ({ ...defaultData(), ...over });
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; // local, not UTC — daysUntil counts from local midnight
const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };

describe("computeDueNotifications — dates", () => {
  it("fires at the 7-day mark and not before or after", () => {
    const d = dataWith({ dates: [{ id: "a", label: "Anniversary", emoji: "💍", date: daysFromNow(7) }] });
    const due = computeDueNotifications(d, new Date(), {});
    expect(due).toHaveLength(1);
    expect(due[0].body).toContain("a week away");
    const d8 = dataWith({ dates: [{ id: "a", label: "Anniversary", emoji: "💍", date: daysFromNow(8) }] });
    expect(computeDueNotifications(d8, new Date(), {})).toHaveLength(0);
  });
  it("fires tomorrow and today marks", () => {
    const d = dataWith({ dates: [{ id: "a", label: "Birthday", emoji: "🎂", date: daysFromNow(1) }] });
    expect(computeDueNotifications(d, new Date(), {})[0].body).toContain("tomorrow");
  });
  it("does not refire something already in the sent log", () => {
    const d = dataWith({ dates: [{ id: "a", label: "Anniversary", emoji: "💍", date: daysFromNow(7) }] });
    const first = computeDueNotifications(d, new Date(), {});
    const log = { [first[0].key]: new Date().toISOString() };
    expect(computeDueNotifications(d, new Date(), log)).toHaveLength(0);
  });
  it("respects the dates toggle", () => {
    const d = dataWith({ dates: [{ id: "a", label: "Anniversary", emoji: "💍", date: daysFromNow(7) }] });
    d.settings.notifications.dates = false;
    expect(computeDueNotifications(d, new Date(), {})).toHaveLength(0);
  });
});

describe("computeDueNotifications — reminders", () => {
  const reminder = { id: "r1", label: "Buy flowers", emoji: "💐", note: "Her favorites", frequency: "weekly" as const, active: true };

  it("fires immediately when never sent", () => {
    const due = computeDueNotifications(dataWith({ reminders: [reminder] }), new Date(), {});
    expect(due).toHaveLength(1);
    expect(due[0].title).toContain("Buy flowers");
  });
  it("does not refire inside the frequency window", () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 864e5);
    const log = { [`rem-r1-${iso(threeDaysAgo)}`]: threeDaysAgo.toISOString() };
    expect(computeDueNotifications(dataWith({ reminders: [reminder] }), now, log)).toHaveLength(0);
  });
  it("refires after the frequency window elapses", () => {
    const now = new Date();
    const eightDaysAgo = new Date(now.getTime() - 8 * 864e5);
    const log = { [`rem-r1-${iso(eightDaysAgo)}`]: eightDaysAgo.toISOString() };
    expect(computeDueNotifications(dataWith({ reminders: [reminder] }), now, log)).toHaveLength(1);
  });
  it("skips inactive reminders and respects the toggle", () => {
    expect(computeDueNotifications(dataWith({ reminders: [{ ...reminder, active: false }] }), new Date(), {})).toHaveLength(0);
    const d = dataWith({ reminders: [reminder] });
    d.settings.notifications.reminders = false;
    expect(computeDueNotifications(d, new Date(), {})).toHaveLength(0);
  });
});
