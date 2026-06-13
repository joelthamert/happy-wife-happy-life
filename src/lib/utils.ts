export const gid = (): string => Math.random().toString(36).substr(2, 9);
/* Fisher–Yates, non-mutating — deck shuffling for Discover */
export const shuffled = <T,>(arr: readonly T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const daysUntil = (s: string): number => { const n = new Date(), t = new Date(s + "T00:00:00"), y = new Date(n.getFullYear(), t.getMonth(), t.getDate()); if (y < n) y.setFullYear(n.getFullYear() + 1); return Math.ceil((y.getTime() - n.getTime()) / 864e5); };
export const fmtDate = (s: string): string => new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" });
/* US ZIP (with optional +4) — event APIs need postal codes in a separate param from city names */
export const isPostalCode = (s: string): boolean => /^\d{5}(-\d{4})?$/.test(s.trim());
/* Exact countdown for one-time events — no yearly rollover; negative = already passed */
export const daysUntilExact = (s: string): number => { const n = new Date(); const today = new Date(n.getFullYear(), n.getMonth(), n.getDate()); const t = new Date(s + "T00:00:00"); return Math.round((t.getTime() - today.getTime()) / 864e5); };
