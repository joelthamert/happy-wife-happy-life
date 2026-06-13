/**
 * Style discovery for tracked brands — "what do I actually buy them?"
 *
 * LTK (LikeToKnow.it) has no public/keyless API — it's creator-affiliate
 * gated, same as the coupon APIs behind `dealLinks`. So the always-works path
 * is a deep link into LTK's universal search, where thousands of creators have
 * styled real outfits with shoppable product links for that exact brand. We
 * bias the query with the partner's favourite colour so the looks feel right,
 * and pair LTK with Pinterest (inspiration) and Google Shopping (buy + price).
 *
 * The partner's sizes / fit notes (preferences.clothing) can't be searched —
 * they'd just be noise in an image search — so the sheet shows them as a
 * "what to look for" reminder while the user browses.
 */
import type { TrackedBrand } from "../types";

export interface StyleLink {
  name: string;
  url: string;
  note: string;
  hero?: boolean; // LTK — the headline source
}

export interface StyleContext {
  colors?: string[];   // preferences.colors — the first one biases the search
  clothing?: string[]; // preferences.clothing — sizes / fit, shown as reminders
}

/** brand + their top colour — what we actually feed the search boxes */
export const styleQuery = (brandName: string, colors: string[] = []): string => {
  const color = colors.find(c => c && c.trim())?.trim();
  return color ? `${brandName} ${color}` : brandName;
};

export const styleLinks = (
  brand: Pick<TrackedBrand, "name">,
  ctx: StyleContext = {},
): StyleLink[] => {
  const q = styleQuery(brand.name, ctx.colors);
  const enc = encodeURIComponent(q);
  return [
    { name: "LTK", url: `https://www.shopltk.com/search?keyword=${enc}`, note: "Creator outfits — shop the exact pieces", hero: true },
    { name: "Pinterest", url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(`${q} outfit`)}`, note: "Outfit inspiration boards" },
    { name: "Google Shopping", url: `https://www.google.com/search?tbm=shop&q=${enc}`, note: "Browse & price the pieces" },
  ];
};

/** Short reminders to keep on hand while shopping — their sizes + any colours
 *  beyond the one already steering the search. Deduped, capped for a tidy row. */
export const styleReminders = (ctx: StyleContext = {}): string[] => {
  const colors = (ctx.colors || []).map(c => c.trim()).filter(Boolean);
  const sizes = (ctx.clothing || []).map(c => c.trim()).filter(Boolean);
  // colors[0] already biases the search query, so only surface the extras here
  return [...sizes, ...colors.slice(1)].slice(0, 6);
};
