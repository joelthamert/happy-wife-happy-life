import { useCallback, useEffect, useRef, useState } from "react";
import { storage } from "../storage";
import { daysUntil, daysUntilExact } from "../lib/utils";
import { reservationTip } from "../lib/notifications";
import { findBrand } from "../data/brands";
import { defaultData, defaultStreak, parseStored, serialize } from "../lib/migrations";
import { bumpStreak } from "../lib/weekly";
import { syncMusiciansToFollowed } from "../lib/artistSync";
import type { AppData, PreferenceKey } from "../types";

const SK = "hwhl-v4";

export { defaultData };
export const load = async (): Promise<AppData> => {
  const r = await storage.get(SK).catch(() => null);
  if (!r) return defaultData();
  try {
    return parseStored(r.value);
  } catch (e) {
    // Never let a parse/migration failure silently become an autosaved wipe —
    // preserve the raw payload under a recovery key before falling back.
    console.error("HWHL: stored data failed to parse/migrate; raw payload preserved under recovery key", e);
    try { await storage.set(`${SK}-recovery`, r.value); } catch {}
    return defaultData();
  }
};
export const save = async (d: AppData): Promise<void> => { try { await storage.set(SK, serialize(d)); } catch {} };

export interface Notif {
  id: string;
  urgency: "urgent" | "soon" | "upcoming" | "tip";
  emoji: string;
  title: string;
  msg: string;
}

export const genNotifs = (d: AppData): Notif[] => {
  const ns: Notif[] = [], now = new Date();
  (d.dates || []).forEach(x => { const days = daysUntil(x.date); if (days <= 30) ns.push({ id: x.id, urgency: days <= 3 ? "urgent" : days <= 7 ? "soon" : "upcoming", emoji: x.emoji || "📅", title: x.label, msg: days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days` }); });
  (d.reservations || []).forEach(r => { const days = daysUntilExact(r.date); if (days >= 0 && days <= 7) ns.push({ id: `resv-${r.id}`, urgency: days <= 1 ? "urgent" : "soon", emoji: "🍽️", title: `Dinner at ${r.restaurant}`, msg: `${days === 0 ? "Tonight" : days === 1 ? "Tomorrow" : `In ${days} days`} · ${reservationTip(d, days >= 3 ? 3 : days)}` }); });
  if ((d.preferences?.flowers || []).length > 0 && now.getDate() % 14 < 2) ns.push({ id: "fl", urgency: "tip", emoji: "💐", title: "Flowers", msg: `Pick up ${d.preferences.flowers[0]}` });
  if ([10, 11, 0, 5, 6].includes(now.getMonth()) && (d.preferences?.brands || []).length > 0) ns.push({ id: "sale", urgency: "tip", emoji: "🏷️", title: "Sale season", msg: `Deals at ${d.preferences.brands.slice(0, 2).join(" & ")}` });
  if ([3, 4, 5, 6, 7, 8].includes(now.getMonth()) && (d.preferences?.musicians || []).length > 0) ns.push({ id: "conc", urgency: "tip", emoji: "🎶", title: "Concert season", msg: `Check tour dates for ${d.preferences.musicians[0]}` });
  const rank = { urgent: 0, soon: 1, upcoming: 2, tip: 3 } as const;
  return ns.sort((a, b) => (rank[a.urgency] ?? 4) - (rank[b.urgency] ?? 4));
};

/* The single source of truth: `d` state, persistence, immutable updater, derived notifs */
export default function useAppData() {
  const [d, setD] = useState<AppData>(defaultData());
  const [ok, setOk] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);

  useEffect(() => { load().then(x => { setD(x); setOk(true); }); }, []);
  useEffect(() => { if (ok) { save(d); setNotifs(genNotifs(d)); } }, [d, ok]);
  const up = useCallback((fn: (draft: AppData) => void) => setD(p => { const n = JSON.parse(JSON.stringify(p)) as AppData; fn(n); return n; }), []);

  // saved musicians auto-resolve to followed artists so Events/Gifts can
  // surface their real tour dates — debounced so a flashcard save settles first
  const dRef = useRef(d);
  dRef.current = d;
  const musiciansKey = (d.preferences?.musicians || []).join("|");
  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => {
      syncMusiciansToFollowed(dRef.current, artist => up(x => {
        if (!x.followedArtists) x.followedArtists = [];
        if (!x.followedArtists.find(a => a.id === artist.id)) x.followedArtists.push(artist);
      })).catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, musiciansKey, up]);

  const addBrandTracked = useCallback((name: string) => {
    const found = findBrand(name);
    up(x => {
      if (!x.trackedBrands) x.trackedBrands = [];
      if (!x.trackedBrands.find(b => b.name.toLowerCase() === name.toLowerCase())) {
        x.trackedBrands.push({ name: found ? found.name : name, domain: found?.domain || null, tags: found?.tags || [], addedAt: new Date().toISOString(), notify: true });
      }
      const finalName = found ? found.name : name;
      if (!x.preferences.brands.includes(finalName)) x.preferences.brands.push(finalName);
    });
  }, [up]);

  const handleSaveAnswer = useCallback((cardId: string, answer: string, mapTo: PreferenceKey) => {
    up(x => {
      if (!x.discoveredAnswers) x.discoveredAnswers = {};
      const isNewAnswer = !x.discoveredAnswers[cardId];
      x.discoveredAnswers[cardId] = answer;
      if (isNewAnswer) x.streak = bumpStreak(x.streak ?? defaultStreak());
      answer.split(",").map(s => s.trim()).filter(Boolean).forEach(item => {
        if (x.preferences[mapTo] && !x.preferences[mapTo].includes(item)) x.preferences[mapTo].push(item);
        if (mapTo === "brands") {
          const found = findBrand(item);
          if (!x.trackedBrands) x.trackedBrands = [];
          if (found && !x.trackedBrands.find(b => b.name === found.name)) {
            x.trackedBrands.push({ name: found.name, domain: found.domain, tags: found.tags, addedAt: new Date().toISOString(), notify: true });
          }
        }
      });
    });
  }, [up]);

  return { d, ok, up, notifs, addBrandTracked, handleSaveAnswer };
}
