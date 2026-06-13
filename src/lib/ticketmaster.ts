/**
 * Ticketmaster Discovery API v2 client.
 *
 * Key: VITE_TM_API_KEY in `.env.local` (gitignored — never commit a real key;
 * copy `.env.example` and paste yours). Free key at developer.ticketmaster.com.
 *
 * Free-tier care (5 req/s, 5000/day): callers debounce input ≥400ms, and every
 * response is cached in memory keyed by the full query URL, so repeat
 * searches and tab switches cost nothing. Deployed-public builds should move
 * this behind a tiny proxy so the key never ships to the browser.
 */
import type { FollowedArtist, LiveEvent } from "../types";
import { isPostalCode } from "./utils";

export const TM_API_KEY: string = (import.meta.env?.VITE_TM_API_KEY as string | undefined) ?? "";
const TM_BASE = "https://app.ticketmaster.com/discovery/v2";

export const hasApiKey = (): boolean => !!TM_API_KEY && TM_API_KEY !== "PASTE_YOUR_KEY_HERE";

export class TMError extends Error {
  constructor(public kind: "bad_key" | "rate_limit" | "network" | "http") {
    super(kind);
  }
}

const tmCache = new Map<string, unknown>();

const tmFetch = async (path: string, params: Record<string, string | number>): Promise<unknown> => {
  if (!hasApiKey()) throw new TMError("bad_key");
  const qs = new URLSearchParams({ apikey: TM_API_KEY, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) }).toString();
  const url = `${TM_BASE}${path}?${qs}`;
  if (tmCache.has(url)) return tmCache.get(url);
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
  tmCache.set(url, json);
  return json;
};

/* Normalize a raw Ticketmaster event into the shape the UI and storage use */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeEvent = (ev: any): LiveEvent => {
  const venue = ev._embedded?.venues?.[0];
  const img = (ev.images || [])
    .filter((i: any) => i.ratio === "16_9")
    .sort((a: any, b: any) => (b.width || 0) - (a.width || 0))[0] || ev.images?.[0];
  const cls = ev.classifications?.[0];
  const price = ev.priceRanges?.[0];
  return {
    id: ev.id,
    name: ev.name,
    url: ev.url || null,
    image: img?.url || null,
    date: ev.dates?.start?.localDate || null,
    time: ev.dates?.start?.localTime || null,
    tba: !!ev.dates?.start?.dateTBA,
    venue: venue?.name || "Venue TBA",
    city: [venue?.city?.name, venue?.state?.stateCode || venue?.country?.countryCode].filter(Boolean).join(", "),
    lat: venue?.location?.latitude ? +venue.location.latitude : null,
    lng: venue?.location?.longitude ? +venue.location.longitude : null,
    genre: [cls?.segment?.name, cls?.genre?.name].filter(Boolean).join(" · "),
    priceMin: price?.min ?? null,
    priceMax: price?.max ?? null,
    currency: price?.currency || "USD",
    attractions: (ev._embedded?.attractions || []).map((a: any) => ({
      id: a.id, name: a.name,
      imageUrl: a.images?.[0]?.url || null,
    })),
  };
};

export interface EventSearchParams {
  latlong?: string | null;       // "41.88,-87.62"
  radius?: number;               // miles
  city?: string;                 // "Chicago"
  classificationName?: string;   // music | comedy | sports | theatre | family | arts
  keyword?: string;
  attractionId?: string;         // exact artist id — best for followed artists
  sort?: string;                 // "date,asc" | "distance,asc" (needs latlong)
  size?: number;
  page?: number;
}

/* Search events. Pass EITHER {latlong, radius} OR {city}. All filters optional. */
export const searchEvents = async ({
  latlong, radius = 25, city, classificationName, keyword, attractionId,
  sort = "date,asc", size = 40, page = 0,
}: EventSearchParams): Promise<{ events: LiveEvent[]; total: number; pages: number }> => {
  const params: Record<string, string | number> = { sort, size, page };
  if (latlong) { params.latlong = latlong; params.radius = radius; params.unit = "miles"; }
  else if (city) {
    if (isPostalCode(city)) { params.postalCode = city.trim(); params.radius = radius; params.unit = "miles"; }
    else params.city = city;
  }
  if (classificationName) params.classificationName = classificationName;
  if (keyword) params.keyword = keyword;
  if (attractionId) params.attractionId = attractionId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await tmFetch("/events.json", params)) as any;
  return {
    events: (json._embedded?.events || []).map(normalizeEvent),
    total: json.page?.totalElements || 0,
    pages: json.page?.totalPages || 0,
  };
};

/* Artist/attraction lookup for the follow feature */
export const searchArtists = async (keyword: string): Promise<FollowedArtist[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await tmFetch("/attractions.json", { keyword, size: 8 })) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (json._embedded?.attractions || []).map((a: any) => ({
    id: a.id,
    name: a.name,
    imageUrl: a.images?.find((i: any) => i.ratio === "1_1")?.url || a.images?.[0]?.url || null,
    genre: a.classifications?.[0]?.genre?.name || "",
  }));
};

/* Upcoming events for all followed artists, merged, deduped, date-sorted */
export const eventsForFollowed = async (
  followedArtists: FollowedArtist[],
  locationParams: Pick<EventSearchParams, "latlong" | "radius" | "city"> = {},
): Promise<LiveEvent[]> => {
  const batches = await Promise.allSettled(
    followedArtists.map(a => searchEvents({ attractionId: a.id, size: 10, ...locationParams })),
  );
  const all = batches.flatMap(b => (b.status === "fulfilled" ? b.value.events : []));
  const seen = new Set<string>();
  return all
    .filter(e => (seen.has(e.id) ? false : (seen.add(e.id), true)))
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
};
