/**
 * Gift intelligence — pure client-side rules combining preferences,
 * upcoming-date proximity and an optional budget.
 *
 * "Anniversary in 12 days → bouquet of peonies + dinner at [saved restaurant]"
 *
 * Designed behind a simple function interface so an LLM-powered version
 * can swap in later without touching the UI.
 */
import type { AppData, DateEntry } from "../types";
import { daysUntil } from "./utils";

export interface GiftSuggestion {
  emoji: string;
  title: string;       // "Bouquet of peonies"
  detail: string;      // "her favorite — quick win before the day"
  estCost: number;     // rough planning number, used for budget filtering
  kind: "idea" | "flowers" | "dinner" | "scent" | "brand" | "concert" | "hobby" | "clothing";
}

/* Card ids giftIntel reads directly (beyond aggregated preferences) — the
 * coverage test asserts every card in the deck is consumed somewhere. */
export const GIFT_INTEL_CARD_IDS: ReadonlySet<string> = new Set(["x_grow", "x_craft", "x_spa", "spa_day", "x_color_nope"]);

export interface GiftContext {
  occasion: DateEntry | null;
  daysLeft: number | null;
  headline: string | null; // "Anniversary in 12 days"
}

export const nextOccasion = (d: AppData, horizon = 45): GiftContext => {
  const dates = (d.dates || []).map(x => ({ x, days: daysUntil(x.date) })).filter(e => e.days <= horizon).sort((a, b) => a.days - b.days);
  if (!dates.length) return { occasion: null, daysLeft: null, headline: null };
  const { x, days } = dates[0];
  const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  return { occasion: x, daysLeft: days, headline: `${x.label} ${when}` };
};

export const giftSuggestions = (d: AppData, budget: number | null = d.giftBudget ?? null, now = new Date()): { context: GiftContext; suggestions: GiftSuggestion[] } => {
  void now;
  const p = d.preferences;
  const context = nextOccasion(d);
  const soon = context.daysLeft !== null && context.daysLeft <= 14;
  const out: GiftSuggestion[] = [];

  // saved-but-unpurchased ideas come first — they were saved for a reason
  for (const g of (d.giftIdeas || []).filter(g => !g.purchased).slice(0, 2)) {
    out.push({ emoji: "🎁", title: g.idea, detail: `from your saved ideas${g.price ? ` · ~$${g.price}` : ""}`, estCost: Number(g.price) || 50, kind: "idea" });
  }

  if (p.flowers?.length) out.push({ emoji: "💐", title: `Bouquet of ${p.flowers[0].toLowerCase()}`, detail: soon ? "her favorite — quick win before the day" : "her favorite flowers", estCost: 50, kind: "flowers" });
  if (p.foods?.length) out.push({ emoji: "🍷", title: `Dinner — ${p.foods[0]}`, detail: context.headline ? `book a table for ${context.occasion?.label?.toLowerCase() ?? "the occasion"}` : "the saved date-night pick", estCost: 150, kind: "dinner" });
  if (p.scents?.length) out.push({ emoji: "🕯️", title: `Candle or perfume — ${p.scents[0]}`, detail: "scent she already loves", estCost: 80, kind: "scent" });
  if (d.trackedBrands?.length) out.push({ emoji: "💳", title: `Gift card — ${d.trackedBrands[0].name}`, detail: "her most-tracked brand", estCost: 100, kind: "brand" });
  if (p.musicians?.length) {
    const followed = (d.followedArtists || []).find(a => p.musicians.some(m => m.toLowerCase() === a.name.toLowerCase()));
    out.push({
      emoji: "🎟️",
      title: `Concert tickets — ${followed?.name ?? p.musicians[0]}`,
      detail: followed ? "following — tap for real tour dates →" : soon ? "needs lead time — check dates now" : "check tour dates nearby →",
      estCost: 250, kind: "concert",
    });
  }
  if (p.hobbies?.length) out.push({ emoji: "💫", title: `Something for ${p.hobbies[0].toLowerCase()}`, detail: "feed the hobby she loves", estCost: 75, kind: "hobby" });
  if (p.clothing?.length && !soon) {
    const color = p.colors?.find(c => c.toLowerCase() !== (d.discoveredAnswers?.x_color_nope || "").toLowerCase());
    const avoid = d.discoveredAnswers?.x_color_nope;
    out.push({ emoji: "👗", title: color ? `A piece in ${color.toLowerCase()}, her color` : "A piece in her size", detail: `sizes saved: ${p.clothing[0]}${avoid ? ` · never ${avoid.toLowerCase()}` : ""}`, estCost: 120, kind: "clothing" });
  }
  const growth = d.discoveredAnswers?.x_grow || d.discoveredAnswers?.x_craft;
  if (growth) out.push({ emoji: "🌱", title: `Lessons or a class — ${growth}`, detail: "she said she wants to learn this", estCost: 90, kind: "hobby" });
  if (d.discoveredAnswers?.x_spa || d.discoveredAnswers?.spa_day) out.push({ emoji: "💆", title: "Spa day booking", detail: "she already said yes to this", estCost: 140, kind: "idea" });

  const filtered = budget ? out.filter(s => s.estCost <= budget) : out;
  // when the date is close, cheap-and-fast beats grand-and-slow
  const ranked = soon ? [...filtered].sort((a, b) => a.estCost - b.estCost) : filtered;
  return { context, suggestions: ranked.slice(0, 5) };
};
