/**
 * Event provider facade — the Events page talks only to this module.
 *
 * Ticketmaster is preferred when its key is configured; SeatGeek (free,
 * instant client_id) is the fallback. Followed artists are routed per-id:
 * `sg:`-prefixed ids go to SeatGeek, everything else to Ticketmaster, so a
 * mixed followed list keeps working even after switching providers.
 */
import type { FollowedArtist, LiveEvent } from "../types";
import * as tm from "./ticketmaster";
import { hasSeatGeekKey, sgSearchArtists, sgSearchEvents } from "./seatgeek";

export type ProviderName = "ticketmaster" | "seatgeek" | null;

export const activeProvider = (): ProviderName =>
  tm.hasApiKey() ? "ticketmaster" : hasSeatGeekKey() ? "seatgeek" : null;

export const hasAnyKey = (): boolean => activeProvider() !== null;

const isSgArtist = (a: FollowedArtist): boolean => a.id.startsWith("sg:");

/* haversine miles — used to emulate distance sort where the provider lacks it */
const distMiles = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const sortByDistance = (events: LiveEvent[], latlong: string): LiveEvent[] => {
  const [lat, lon] = latlong.split(",").map(Number);
  return [...events].sort((a, b) => {
    const da = a.lat != null && a.lng != null ? distMiles(lat, lon, a.lat, a.lng) : Infinity;
    const db = b.lat != null && b.lng != null ? distMiles(lat, lon, b.lat, b.lng) : Infinity;
    return da - db;
  });
};

export const searchEvents = async (params: tm.EventSearchParams): Promise<{ events: LiveEvent[]; total: number }> => {
  if (activeProvider() === "ticketmaster") return tm.searchEvents(params);
  // SeatGeek has no distance sort — fetch date-sorted, then sort client-side
  const { events, total } = await sgSearchEvents({
    latlong: params.latlong, radius: params.radius, city: params.city,
    classificationName: params.classificationName, keyword: params.keyword, size: params.size,
  });
  const sorted = params.sort === "distance,asc" && params.latlong ? sortByDistance(events, params.latlong) : events;
  return { events: sorted, total };
};

export const searchArtists = async (keyword: string): Promise<FollowedArtist[]> =>
  activeProvider() === "ticketmaster" ? tm.searchArtists(keyword) : sgSearchArtists(keyword);

/* Merge upcoming events for followed artists across both providers */
export const eventsForFollowed = async (followed: FollowedArtist[]): Promise<LiveEvent[]> => {
  const tmArtists = followed.filter(a => !isSgArtist(a));
  const sgArtists = followed.filter(isSgArtist);
  const jobs: Array<Promise<LiveEvent[]>> = [];
  if (tmArtists.length && tm.hasApiKey()) jobs.push(tm.eventsForFollowed(tmArtists));
  if (sgArtists.length && hasSeatGeekKey()) {
    jobs.push(
      Promise.allSettled(sgArtists.map(a => sgSearchEvents({ performerId: a.id.slice(3), size: 10 })))
        .then(batches => batches.flatMap(b => (b.status === "fulfilled" ? b.value.events : []))),
    );
  }
  if (!jobs.length) throw new tm.TMError("bad_key");
  const all = (await Promise.all(jobs)).flat();
  const seen = new Set<string>();
  return all
    .filter(e => (seen.has(e.id) ? false : (seen.add(e.id), true)))
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
};
