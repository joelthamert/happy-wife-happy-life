/**
 * SeatGeek Platform API client — the free fallback event provider.
 *
 * Key: VITE_SEATGEEK_CLIENT_ID in `.env.local` (gitignored). Unlike
 * Ticketmaster's key there is no approval wait: sign up at seatgeek.com,
 * then seatgeek.com/account/develop issues a client_id instantly.
 *
 * Everything is normalized into the same LiveEvent/FollowedArtist shapes
 * Ticketmaster uses; ids are prefixed (`sg-` events, `sg:` performers) so
 * saves and follows from both providers can coexist in one list.
 */
import type { FollowedArtist, LiveEvent } from "../types";
import { TMError } from "./ticketmaster";
import { isPostalCode } from "./utils";

export const SG_CLIENT_ID: string = (import.meta.env?.VITE_SEATGEEK_CLIENT_ID as string | undefined) ?? "";
const SG_BASE = "https://api.seatgeek.com/2";

export const hasSeatGeekKey = (): boolean => !!SG_CLIENT_ID && SG_CLIENT_ID !== "PASTE_YOUR_CLIENT_ID_HERE";

const sgCache = new Map<string, unknown>();

const sgFetch = async (path: string, params: Record<string, string | number>): Promise<unknown> => {
  if (!hasSeatGeekKey()) throw new TMError("bad_key");
  const qs = new URLSearchParams({ client_id: SG_CLIENT_ID, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) }).toString();
  const url = `${SG_BASE}${path}?${qs}`;
  if (sgCache.has(url)) return sgCache.get(url);
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new TMError("network");
  }
  if (res.status === 429) throw new TMError("rate_limit");
  if (res.status === 401 || res.status === 403) throw new TMError("bad_key");
  if (!res.ok) throw new TMError("http");
  const json = await res.json();
  sgCache.set(url, json);
  return json;
};

const prettyTaxonomy = (name?: string): string =>
  (name || "").split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

/* Normalize a SeatGeek event into the shared LiveEvent shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeSgEvent = (ev: any): LiveEvent => {
  const dt: string = ev.datetime_local || "";
  return {
    id: `sg-${ev.id}`,
    name: ev.title || ev.short_title || "Untitled event",
    url: ev.url || null,
    image: ev.performers?.find((p: any) => p.image)?.image || null,
    date: dt ? dt.slice(0, 10) : null,
    time: ev.datetime_tbd ? null : dt ? dt.slice(11, 19) : null,
    tba: !!ev.datetime_tbd || !!ev.date_tbd,
    venue: ev.venue?.name || "Venue TBA",
    city: [ev.venue?.city, ev.venue?.state || ev.venue?.country].filter(Boolean).join(", "),
    lat: ev.venue?.location?.lat ?? null,
    lng: ev.venue?.location?.lon ?? null,
    genre: prettyTaxonomy(ev.taxonomies?.[0]?.name),
    priceMin: ev.stats?.lowest_price ?? null,
    priceMax: ev.stats?.highest_price ?? null,
    currency: "USD",
    attractions: (ev.performers || []).map((p: any) => ({
      id: `sg:${p.id}`, name: p.name, imageUrl: p.image || null,
    })),
  };
};

/* Map the app's category keys (Ticketmaster classificationNames) to SeatGeek taxonomies */
const SG_TAXONOMY: Record<string, string> = {
  music: "concert",
  comedy: "comedy",
  theatre: "theater",
  sports: "sports",
  family: "family",
  arts: "classical",
};

export interface SgSearchParams {
  latlong?: string | null;
  radius?: number;
  city?: string;
  classificationName?: string;
  keyword?: string;
  performerId?: string; // numeric SeatGeek performer id (no prefix)
  size?: number;
}

export const sgSearchEvents = async ({
  latlong, radius = 25, city, classificationName, keyword, performerId, size = 40,
}: SgSearchParams): Promise<{ events: LiveEvent[]; total: number }> => {
  const params: Record<string, string | number> = { per_page: size, sort: "datetime_local.asc" };
  if (latlong) {
    const [lat, lon] = latlong.split(",");
    params.lat = lat; params.lon = lon; params.range = `${radius}mi`;
  } else if (city) {
    if (isPostalCode(city)) { params.postal_code = city.trim(); params.range = `${radius}mi`; }
    else params["venue.city"] = city;
  }
  if (classificationName && SG_TAXONOMY[classificationName]) params["taxonomies.name"] = SG_TAXONOMY[classificationName];
  if (keyword) params.q = keyword;
  if (performerId) params["performers.id"] = performerId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await sgFetch("/events", params)) as any;
  return {
    events: (json.events || []).map(normalizeSgEvent),
    total: json.meta?.total || 0,
  };
};

export const sgSearchArtists = async (keyword: string): Promise<FollowedArtist[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await sgFetch("/performers", { q: keyword, per_page: 8 })) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (json.performers || []).map((p: any) => ({
    id: `sg:${p.id}`,
    name: p.name,
    imageUrl: p.image || null,
    genre: prettyTaxonomy(p.taxonomies?.[0]?.name),
  }));
};
