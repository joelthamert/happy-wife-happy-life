/**
 * Couples sync — glues Supabase auth + the couple row to local app state.
 * localStorage stays the offline source of truth; this pushes the envelope
 * (debounced) and applies partner edits arriving over realtime.
 */
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { AppData } from "../types";
import { CURRENT_VERSION, migrate, toEnvelope } from "../lib/migrations";
import {
  hasSupabase, currentUser, onAuthChange, ensureCouple, pushCoupleData,
  subscribeCouple, richness, type Couple,
} from "../lib/couple";

export type SyncState = "off" | "signedout" | "linking" | "synced" | "error";

export default function useCoupleSync(d: AppData, ok: boolean, up: (fn: (draft: AppData) => void) => void) {
  const [user, setUser] = useState<User | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [state, setState] = useState<SyncState>(hasSupabase() ? "signedout" : "off");
  const lastPushRef = useRef<string>("");
  const dRef = useRef(d);
  dRef.current = d;

  const applyRemote = (remote: Couple) => {
    if (!remote.data) return;
    if (lastPushRef.current && remote.updated_at <= lastPushRef.current) return; // our own echo
    try {
      const incoming = migrate(toEnvelope(remote.data)).data;
      up(x => Object.assign(x, incoming));
    } catch (e) {
      console.error("HWHL sync: could not apply partner update", e);
    }
  };

  // auth lifecycle
  useEffect(() => {
    if (!hasSupabase()) return;
    currentUser().then(setUser).catch(() => {});
    return onAuthChange(setUser);
  }, []);

  // couple bootstrap after sign-in: adopt whichever copy is richer
  useEffect(() => {
    if (!hasSupabase() || !ok || !user) { if (hasSupabase() && !user) { setCouple(null); setState("signedout"); } return; }
    let alive = true;
    setState("linking");
    ensureCouple()
      .then(c => {
        if (!alive) return;
        setCouple(c);
        const remote = c.data ? migrate(toEnvelope(c.data)).data : null;
        if (remote && richness(remote) > richness(dRef.current)) {
          up(x => Object.assign(x, remote));
        } else {
          const stamp = new Date().toISOString();
          lastPushRef.current = stamp;
          pushCoupleData(c.id, { version: CURRENT_VERSION, data: dRef.current }).catch(() => {});
        }
        setState("synced");
      })
      .catch(e => { console.error("HWHL sync:", e); if (alive) setState("error"); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, user?.id]);

  // partner edits arrive live
  useEffect(() => {
    if (!couple) return;
    return subscribeCouple(couple.id, applyRemote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id]);

  // debounced push on local change
  useEffect(() => {
    if (!couple || state !== "synced") return;
    const t = setTimeout(() => {
      const stamp = new Date().toISOString();
      lastPushRef.current = stamp;
      pushCoupleData(couple.id, { version: CURRENT_VERSION, data: d }).catch(e => { console.error("HWHL sync push:", e); setState("error"); });
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, couple?.id, state]);

  const adoptCouple = (c: Couple) => { setCouple(c); applyRemote(c); setState("synced"); };

  return { user, couple, state, adoptCouple };
}
