/**
 * Weekly 3 — a deterministic rotation of three flashcards per ISO week.
 * Unanswered cards come first; the pick is seeded by year+week so everyone
 * sees a stable trio all week and a fresh one each Monday.
 */
import type { Flashcard } from "../types";

export const isoWeek = (date: Date): { year: number; week: number } => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day); // shift to the Thursday of this week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
};

/* mulberry32 — tiny seeded PRNG, deterministic across sessions */
const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
  const rnd = mulberry32(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export const weeklyThree = (cards: Flashcard[], answers: Record<string, string>, now = new Date()): Flashcard[] => {
  const { year, week } = isoWeek(now);
  const seed = year * 100 + week;
  const unanswered = cards.filter(c => !answers?.[c.id]);
  const answered = cards.filter(c => answers?.[c.id]);
  // unanswered first, then answered as filler if fewer than 3 remain
  return [...seededShuffle(unanswered, seed), ...seededShuffle(answered, seed)].slice(0, 3);
};

/** Update a day-streak given the previous state and today's date. */
export const bumpStreak = (streak: { count: number; lastAnswerDay: string | null }, now = new Date()): { count: number; lastAnswerDay: string } => {
  const day = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = day(now);
  if (streak.lastAnswerDay === today) return { count: streak.count, lastAnswerDay: today };
  const yesterday = day(new Date(now.getTime() - 864e5));
  return { count: streak.lastAnswerDay === yesterday ? streak.count + 1 : 1, lastAnswerDay: today };
};

/** A streak only counts as alive if the last answer was today or yesterday. */
export const liveStreak = (streak: { count: number; lastAnswerDay: string | null }, now = new Date()): number => {
  if (!streak?.lastAnswerDay) return 0;
  const day = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = day(now), yesterday = day(new Date(now.getTime() - 864e5));
  return streak.lastAnswerDay === today || streak.lastAnswerDay === yesterday ? streak.count : 0;
};
