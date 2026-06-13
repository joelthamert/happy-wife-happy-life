/**
 * Musicians ↔ followed-artists sync — the connective tissue between
 * Discover/Preferences and the Events tab.
 *
 * Any name saved under preferences.musicians (flashcard answers route
 * through handleSaveAnswer, manual adds through the Preferences page) is
 * resolved against the active event provider's artist search and
 * auto-followed, so their real tour dates surface in Events → Followed
 * and gift suggestions can point at actual concerts.
 *
 * An attempt log in localStorage stops unresolvable names ("indie rock",
 * misspellings) from being re-searched on every load; provider errors are
 * NOT logged so they retry once the API is reachable again.
 */
import type { AppData, FollowedArtist } from "../types";
import { hasAnyKey, searchArtists } from "./eventProvider";

const SYNC_KEY = "hwhl-artist-sync"; // lowercased name → artist id, or null when no confident match

type SyncLog = Record<string, string | null>;

const readLog = (): SyncLog => { try { return JSON.parse(localStorage.getItem(SYNC_KEY) || "{}"); } catch { return {}; } };
const writeLog = (log: SyncLog) => { try { localStorage.setItem(SYNC_KEY, JSON.stringify(log)); } catch {} };

const norm = (s: string): string => s.trim().toLowerCase();

/** Accept a search hit only when it plausibly IS the saved musician. */
export const isConfidentMatch = (query: string, artist: FollowedArtist): boolean => {
  const q = norm(query), a = norm(artist.name);
  return q === a || a.includes(q) || q.includes(a);
};

export const pickArtistMatch = (query: string, results: FollowedArtist[]): FollowedArtist | null => {
  const exact = results.find(r => norm(r.name) === norm(query));
  if (exact) return exact;
  const first = results[0];
  return first && isConfidentMatch(query, first) ? first : null;
};

/** Musicians not yet followed and never attempted (a logged null = no match;
 *  a logged id the user later unfollowed is deliberate — don't re-follow). */
export const pendingMusicians = (d: AppData, log: SyncLog): string[] => {
  const followedNames = new Set((d.followedArtists || []).map(a => norm(a.name)));
  return (d.preferences?.musicians || []).filter(m => {
    const key = norm(m);
    return !!key && !followedNames.has(key) && log[key] === undefined;
  });
};

/**
 * Resolve and follow pending musicians. Returns how many were followed.
 * `searchFn` is injectable for tests; defaults to the live provider facade.
 */
export const syncMusiciansToFollowed = async (
  d: AppData,
  follow: (artist: FollowedArtist) => void,
  searchFn: (keyword: string) => Promise<FollowedArtist[]> = searchArtists,
): Promise<number> => {
  if (!hasAnyKey()) return 0;
  const log = readLog();
  const pending = pendingMusicians(d, log).slice(0, 4); // gentle on free-tier rate limits
  let followedCount = 0;
  for (const name of pending) {
    try {
      const match = pickArtistMatch(name, await searchFn(name));
      log[norm(name)] = match ? match.id : null;
      if (match) { follow(match); followedCount++; }
    } catch {
      // provider unavailable — leave unlogged so it retries next time
    }
  }
  writeLog(log);
  return followedCount;
};
