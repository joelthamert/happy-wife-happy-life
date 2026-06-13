import { describe, it, expect } from "vitest";
import { bumpStreak, isoWeek, liveStreak, weeklyThree } from "./weekly";
import { FLASHCARDS } from "../data/flashcards";

describe("isoWeek", () => {
  it("computes known ISO weeks", () => {
    expect(isoWeek(new Date(2026, 0, 1))).toEqual({ year: 2026, week: 1 });   // Thu Jan 1 2026
    expect(isoWeek(new Date(2026, 5, 11))).toEqual({ year: 2026, week: 24 }); // Thu Jun 11 2026
    expect(isoWeek(new Date(2027, 0, 1))).toEqual({ year: 2026, week: 53 });  // Fri Jan 1 2027 → ISO year 2026
  });
});

describe("weeklyThree", () => {
  it("returns exactly three cards, stable within a week", () => {
    const monday = new Date(2026, 5, 8), friday = new Date(2026, 5, 12);
    const a = weeklyThree(FLASHCARDS, {}, monday);
    const b = weeklyThree(FLASHCARDS, {}, friday);
    expect(a).toHaveLength(3);
    expect(a.map(c => c.id)).toEqual(b.map(c => c.id));
  });
  it("rotates between weeks", () => {
    const w1 = weeklyThree(FLASHCARDS, {}, new Date(2026, 5, 8));
    const w2 = weeklyThree(FLASHCARDS, {}, new Date(2026, 5, 15));
    expect(w1.map(c => c.id)).not.toEqual(w2.map(c => c.id));
  });
  it("prefers unanswered cards", () => {
    const answers = Object.fromEntries(FLASHCARDS.slice(0, FLASHCARDS.length - 3).map(c => [c.id, "x"]));
    const picks = weeklyThree(FLASHCARDS, answers, new Date(2026, 5, 8));
    const unansweredIds = FLASHCARDS.slice(FLASHCARDS.length - 3).map(c => c.id);
    expect(picks.map(c => c.id).sort()).toEqual(unansweredIds.sort());
  });
  it("fills from answered cards when fewer than three remain", () => {
    const answers = Object.fromEntries(FLASHCARDS.map(c => [c.id, "x"]));
    expect(weeklyThree(FLASHCARDS, answers, new Date())).toHaveLength(3);
  });
});

describe("bumpStreak / liveStreak", () => {
  const now = new Date(2026, 5, 11);
  it("starts a streak at 1", () => {
    expect(bumpStreak({ count: 0, lastAnswerDay: null }, now)).toEqual({ count: 1, lastAnswerDay: "2026-06-11" });
  });
  it("increments on consecutive days", () => {
    expect(bumpStreak({ count: 3, lastAnswerDay: "2026-06-10" }, now).count).toBe(4);
  });
  it("does not double-count the same day", () => {
    expect(bumpStreak({ count: 3, lastAnswerDay: "2026-06-11" }, now).count).toBe(3);
  });
  it("resets after a gap", () => {
    expect(bumpStreak({ count: 9, lastAnswerDay: "2026-06-08" }, now).count).toBe(1);
  });
  it("liveStreak reports 0 once the streak has lapsed", () => {
    expect(liveStreak({ count: 5, lastAnswerDay: "2026-06-10" }, now)).toBe(5);
    expect(liveStreak({ count: 5, lastAnswerDay: "2026-06-08" }, now)).toBe(0);
    expect(liveStreak({ count: 0, lastAnswerDay: null }, now)).toBe(0);
  });
});
