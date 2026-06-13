import { describe, it, expect } from "vitest";
import { toICSDate, generateICS, generateRemindersText } from "./ics";

const event = (over = {}) => ({ id: "abc123", label: "Anniversary", emoji: "💍", date: "2026-06-15", ...over });

describe("toICSDate", () => {
  it("formats ISO dates as compact ICS dates", () => {
    expect(toICSDate("2026-06-15")).toBe("20260615");
  });
  it("pads single-digit months and days", () => {
    expect(toICSDate("2026-01-05")).toBe("20260105");
  });
  it("is immune to timezone shifts (local midnight, not UTC)", () => {
    expect(toICSDate("2026-12-31")).toBe("20261231");
    expect(toICSDate("2026-01-01")).toBe("20260101");
  });
});

describe("generateICS", () => {
  it("wraps events in a VCALENDAR envelope with CRLF line endings", () => {
    const ics = generateICS([event()]);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//HWHL//EN");
  });

  it("emits a yearly RRULE per event", () => {
    const ics = generateICS([event()]);
    expect(ics).toContain("RRULE:FREQ=YEARLY");
  });

  it("emits 7-day and 1-day display alarms", () => {
    const ics = generateICS([event()]);
    expect(ics).toContain("BEGIN:VALARM\r\nTRIGGER:-P7D\r\nACTION:DISPLAY\r\nDESCRIPTION:Anniversary in 7 days\r\nEND:VALARM");
    expect(ics).toContain("BEGIN:VALARM\r\nTRIGGER:-P1D\r\nACTION:DISPLAY\r\nDESCRIPTION:Anniversary tomorrow\r\nEND:VALARM");
  });

  it("sets DTEND to the day after DTSTART (all-day event)", () => {
    const ics = generateICS([event({ date: "2026-06-15" })]);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260615");
    expect(ics).toContain("DTEND;VALUE=DATE:20260616");
  });

  it("rolls DTEND across the year boundary (Dec 31 → Jan 1)", () => {
    const ics = generateICS([event({ date: "2026-12-31" })]);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261231");
    expect(ics).toContain("DTEND;VALUE=DATE:20270101");
  });

  it("rolls DTEND across month boundaries and leap days", () => {
    expect(generateICS([event({ date: "2026-01-31" })])).toContain("DTEND;VALUE=DATE:20260201");
    expect(generateICS([event({ date: "2028-02-28" })])).toContain("DTEND;VALUE=DATE:20280229"); // 2028 is a leap year
    expect(generateICS([event({ date: "2028-02-29" })])).toContain("DTEND;VALUE=DATE:20280301");
  });

  it("includes the emoji and label in SUMMARY and a stable UID", () => {
    const ics = generateICS([event()]);
    expect(ics).toContain("SUMMARY:💍 Anniversary");
    expect(ics).toContain("UID:hwhl-abc123-20260615@hwhl");
  });

  it("falls back to the array index when an event has no id", () => {
    const ics = generateICS([event({ id: undefined })]);
    expect(ics).toContain("UID:hwhl-0-20260615@hwhl");
  });

  it("emits one VEVENT per event", () => {
    const ics = generateICS([event(), event({ id: "x2", label: "Birthday", date: "2026-09-01" })]);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics.match(/END:VEVENT/g)).toHaveLength(2);
  });
});

describe("generateRemindersText", () => {
  it("lists only active reminders with their notes and frequency", () => {
    const txt = generateRemindersText([
      { id: "r1", label: "Buy flowers", emoji: "💐", note: "Her favorites", frequency: "bi-weekly" as const, active: true },
      { id: "r2", label: "Old habit", emoji: "🗑️", note: "Inactive", frequency: "weekly" as const, active: false },
    ], "Lindsay");
    expect(txt).toContain("Reminders for Lindsay");
    expect(txt).toContain("💐 Buy flowers");
    expect(txt).toContain("Her favorites · bi-weekly");
    expect(txt).not.toContain("Old habit");
  });

  it("falls back to 'Partner' when no name is set", () => {
    expect(generateRemindersText([], "")).toContain("Reminders for Partner");
  });
});
