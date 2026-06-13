/**
 * Suggestion engine — turns the saved location + her preferences into
 * ready-made picks on every planning surface:
 *   - top-3 restaurants near the saved location (cuisine answers boost matches)
 *   - top event picks (followed artists first, then her music lean, then soonest)
 *   - tap-to-add chips inside each Preferences category
 *   - bouquet pairings built from her saved flowers
 */
import type { AppData, LiveEvent, PreferenceKey } from "../types";
import type { Restaurant } from "../data/restaurants";
import { RESTAURANT_DB } from "../data/restaurants";
import { distanceMiles } from "./restaurants";
import { daysUntilExact } from "./utils";

/* ── restaurants: 3 near the saved location ── */

export const suggestRestaurants = (d: AppData, n = 3, db: Restaurant[] = RESTAURANT_DB): Array<Restaurant & { miles: number | null; why: string }> => {
  const latlong = d.eventPrefs?.latlong;
  const coords = latlong ? latlong.split(",").map(Number) : null;
  const likedCuisines = new Set(
    [d.discoveredAnswers?.x_cuisine, ...(d.preferences.foods || [])]
      .filter(Boolean).map(s => (s as string).toLowerCase()),
  );
  const scored = db.map(r => {
    const miles = coords ? distanceMiles(coords[0], coords[1], r.lat, r.lng) : null;
    const cuisineMatch = [...likedCuisines].some(c => r.cuisine.toLowerCase().includes(c) || c.includes(r.cuisine.toLowerCase()));
    const starRank = { "3 stars": 3, "2 stars": 2, "1 star": 1, "Bib Gourmand": 0.5 }[r.distinction] ?? 0;
    // distance dominates; cuisine match is worth ~15 miles; stars break ties
    const score = (miles ?? 3000) - (cuisineMatch ? 15 : 0) - starRank * 2;
    const why = cuisineMatch ? `${r.cuisine} — her pick` : miles != null && miles < 30 ? "close to you" : `MICHELIN ${r.distinction}`;
    return { ...r, miles, why, score };
  });
  return scored.sort((a, b) => a.score - b.score).slice(0, n).map(({ score: _s, ...rest }) => rest);
};

/* ── events: rank fetched results into top picks ── */

export const rankEventSuggestions = (events: LiveEvent[], d: AppData, n = 3): LiveEvent[] => {
  const followedIds = new Set((d.followedArtists || []).map(a => a.id));
  const followedNames = new Set((d.followedArtists || []).map(a => a.name.toLowerCase()));
  const musicLean = (d.preferences.musicians || []).length > 0;
  const scored = events.filter(e => e.date).map(e => {
    const days = daysUntilExact(e.date as string);
    const followed = e.attractions.some(a => followedIds.has(a.id) || followedNames.has(a.name.toLowerCase()));
    const music = /music|concert/i.test(e.genre);
    // followed artist trumps everything; her music lean helps; sooner is better
    const score = (followed ? -1000 : 0) + (musicLean && music ? -50 : 0) + Math.max(days, 0);
    return { e, score };
  });
  return scored.sort((a, b) => a.score - b.score).slice(0, n).map(x => x.e);
};

/* ── preferences: tap-to-add chips per category ── */

export const CATEGORY_SUGGESTIONS: Record<PreferenceKey, string[]> = {
  musicians: ["Taylor Swift", "Zach Bryan", "Beyoncé", "Morgan Wallen", "Hozier", "SZA", "Chris Stapleton", "Billie Eilish"],
  brands: ["Lululemon", "Sephora", "Anthropologie", "Free People", "Aritzia", "Kendra Scott", "Madewell", "Abercrombie & Fitch"],
  hobbies: ["Pilates", "Reading", "Baking", "Gardening", "Hiking", "Pottery", "Photography", "Yoga"],
  clothing: ["Top: M", "Dress: 8", "Shoes: 8.5", "Ring: 6", "Jeans: 28", "Gold jewelry", "Silver jewelry"],
  foods: ["Italian", "Sushi", "Thai", "Mexican", "Mediterranean", "Steakhouse", "Ramen", "Brunch spots"],
  flowers: ["Peonies", "Roses", "Tulips", "Ranunculus", "Sunflowers", "Wildflowers", "Hydrangeas", "Lilies"],
  colors: ["Sage green", "Blush pink", "Navy", "Lavender", "Cream", "Burgundy", "Black"],
  scents: ["Vanilla", "Sandalwood", "Fresh linen", "Citrus", "Jasmine", "Santal", "Lavender", "Baccarat Rouge"],
  misc: [],
};

export const categorySuggestions = (d: AppData, key: PreferenceKey, n = 8): string[] => {
  const have = new Set((d.preferences[key] || []).map(s => s.toLowerCase()));
  return (CATEGORY_SUGGESTIONS[key] || []).filter(s => !have.has(s.toLowerCase())).slice(0, n);
};

/* ── flowers: bouquet pairings from what she loves ── */

const BOUQUET_PAIRINGS: Record<string, string> = {
  peonies: "Peonies with white ranunculus and eucalyptus — the spring stunner",
  roses: "Garden roses with lisianthus — softer than a dozen red",
  tulips: "Tulips massed in one color, wrapped simply — Dutch-market style",
  ranunculus: "Ranunculus with sweet peas — delicate and unexpected",
  sunflowers: "Sunflowers with solidago and craspedia — sunshine in a vase",
  wildflowers: "A loose wildflower mix with Queen Anne's lace — farmers-market romance",
  hydrangeas: "White hydrangeas with trailing greenery — instant abundance",
  lilies: "Stargazer lilies with wax flower — fragrant and dramatic",
};

export const bouquetIdeas = (d: AppData): string[] => {
  const flowers = d.preferences.flowers || [];
  const ideas = flowers
    .map(f => BOUQUET_PAIRINGS[f.toLowerCase().replace(/s?$/, "s")] || BOUQUET_PAIRINGS[f.toLowerCase()] || `A hand-tied bouquet built around ${f.toLowerCase()}`)
    .slice(0, 3);
  if (!ideas.length && d.discoveredAnswers?.x_flower2) {
    const a = d.discoveredAnswers.x_flower2;
    return [BOUQUET_PAIRINGS[a.toLowerCase()] || `A hand-tied bouquet built around ${a.toLowerCase()}`];
  }
  return [...new Set(ideas)];
};
