/* Suggested dates for the Dates tab — tap to prefill the add sheet.
 * Fixed holidays compute their next occurrence; personal ones leave the
 * date blank for the user to fill in. Suggestions already in d.dates
 * (matched loosely by label) are hidden. */
import type { AppData } from "../types";

export interface DateSuggestion {
  label: string;
  emoji: string;
  date: string | null; // YYYY-MM-DD when known (holidays), null = user fills in
  hint: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Next occurrence of a fixed month/day (month 0-indexed). */
export const nextFixed = (month: number, day: number, now = new Date()): string => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let d = new Date(now.getFullYear(), month, day);
  if (d < today) d = new Date(now.getFullYear() + 1, month, day);
  return iso(d);
};

/** Next Mother's Day (second Sunday of May). */
export const nextMothersDay = (now = new Date()): string => {
  const calc = (year: number) => {
    const may1 = new Date(year, 4, 1);
    const firstSunday = 1 + ((7 - may1.getDay()) % 7);
    return new Date(year, 4, firstSunday + 7);
  };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let d = calc(now.getFullYear());
  if (d < today) d = calc(now.getFullYear() + 1);
  return iso(d);
};

export const dateSuggestions = (d: AppData, now = new Date()): DateSuggestion[] => {
  const name = d.partnerName || "Their";
  const possessive = d.partnerName ? `${d.partnerName}'s` : "Their";
  const all: DateSuggestion[] = [
    { label: `${possessive} birthday`, emoji: "🎂", date: null, hint: "the one not to miss" },
    { label: "Anniversary", emoji: "💍", date: null, hint: "wedding or dating — your call" },
    { label: "First date", emoji: "❤️", date: null, hint: "where it all began" },
    { label: "Valentine's Day", emoji: "🌹", date: nextFixed(1, 14, now), hint: "auto-filled" },
    { label: "Mother's Day", emoji: "💐", date: nextMothersDay(now), hint: "auto-filled" },
    { label: `${name === "Their" ? "Their" : possessive} mom's birthday`, emoji: "🌷", date: null, hint: "bonus points" },
  ];
  const existing = (d.dates || []).map(x => x.label.toLowerCase());
  // hide a suggestion once something similar exists ("birthday" covers "Lindsay's birthday")
  const keyWords: Record<string, string[]> = {};
  all.forEach(s => { keyWords[s.label] = s.label.toLowerCase().split(" ").filter(w => w.length > 3); });
  return all.filter(s => !existing.some(e => keyWords[s.label].every(w => e.includes(w)) || e === s.label.toLowerCase()));
};
