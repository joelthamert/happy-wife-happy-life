/* Restaurant filtering/sorting + reservation deep links.
 * Reservations have no public APIs (OpenTable/Resy are partner-only), so the
 * buttons deep-link into each platform's search for the restaurant — the
 * booking itself happens there, then "I booked it" records it here. */
import type { Restaurant } from "../data/restaurants";
import { RESTAURANT_DB } from "../data/restaurants";

export const distanceMiles = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const cuisinesIn = (list: Restaurant[]): string[] =>
  [...new Set(list.map(r => r.cuisine))].sort();

export interface RestaurantFilter {
  cuisine?: string;        // "" / undefined = all
  latlong?: string | null; // "28.66,-81.34" — enables distance sort + nearby grouping
  sort: "distance" | "name" | "rating";
}

const DISTINCTION_RANK: Record<Restaurant["distinction"], number> = { "3 stars": 0, "2 stars": 1, "1 star": 2, "Bib Gourmand": 3 };

export const filterRestaurants = (filter: RestaurantFilter, db: Restaurant[] = RESTAURANT_DB): Array<Restaurant & { miles: number | null }> => {
  let list = db.filter(r => !filter.cuisine || r.cuisine === filter.cuisine);
  const coords = filter.latlong ? filter.latlong.split(",").map(Number) : null;
  const withMiles = list.map(r => ({ ...r, miles: coords ? distanceMiles(coords[0], coords[1], r.lat, r.lng) : null }));
  if (filter.sort === "distance" && coords) return withMiles.sort((a, b) => (a.miles ?? Infinity) - (b.miles ?? Infinity));
  if (filter.sort === "rating") return withMiles.sort((a, b) => DISTINCTION_RANK[a.distinction] - DISTINCTION_RANK[b.distinction] || a.name.localeCompare(b.name));
  return withMiles.sort((a, b) => a.name.localeCompare(b.name));
};

/* Reservation + guide deep links (search-scoped to the restaurant) */
export const reserveLinks = (r: Pick<Restaurant, "name" | "city" | "state">) => ({
  opentable: `https://www.opentable.com/s?term=${encodeURIComponent(`${r.name} ${r.city}`)}`,
  resy: `https://resy.com/search?query=${encodeURIComponent(r.name)}`,
  michelin: `https://guide.michelin.com/us/en/search?q=${encodeURIComponent(r.name)}`,
});
