/**
 * Couples mode — accounts + partner sync via Supabase.
 *
 * Free project at supabase.com (instant): paste the project URL and anon key
 * into `.env.local` (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) and run
 * `supabase/schema.sql` once in the SQL editor. Until then the Account
 * section in Settings shows setup instructions and the app stays 100% local.
 *
 * Model: localStorage remains the offline source of truth; sync is additive.
 * Each couple is one row holding the shared AppData envelope (last-write-wins
 * by updated_at). Partners link by entering each other's 6-letter invite code.
 * Google sign-in works once Google is enabled under Supabase Auth providers.
 */
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { AppData } from "../types";

const URL_ = (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ?? "";
const KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

export const hasSupabase = (): boolean =>
  !!URL_ && !!KEY && !URL_.includes("PASTE_") && !KEY.includes("PASTE_");

let client: SupabaseClient | null = null;
export const supabase = (): SupabaseClient => {
  if (!client) client = createClient(URL_, KEY);
  return client;
};

/* ── auth ── */

export const signUpEmail = (email: string, password: string) =>
  supabase().auth.signUp({ email, password });

export const signInEmail = (email: string, password: string) =>
  supabase().auth.signInWithPassword({ email, password });

export const signInGoogle = () =>
  supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });

export const signOut = () => supabase().auth.signOut();

export const currentUser = async (): Promise<User | null> => {
  const { data } = await supabase().auth.getUser();
  return data.user ?? null;
};

export const onAuthChange = (cb: (user: User | null) => void): (() => void) => {
  const { data } = supabase().auth.onAuthStateChange((_evt, session) => cb(session?.user ?? null));
  return () => data.subscription.unsubscribe();
};

/* ── couple linking ── */

export interface Couple {
  id: string;
  code: string;
  data: { version: number; data: AppData } | null;
  updated_at: string;
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L lookalikes
export const makeInviteCode = (rand: () => number = Math.random): string =>
  Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)]).join("");

/** The signed-in user's couple — created on first call. */
export const ensureCouple = async (): Promise<Couple> => {
  const sb = supabase();
  const { data: existing, error: selErr } = await sb.from("couples").select("*").limit(1).maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing as Couple;
  const { data: created, error: insErr } = await sb
    .from("couples").insert({ code: makeInviteCode() }).select().single();
  if (insErr) throw insErr;
  const me = await currentUser();
  if (me) await sb.from("couple_members").insert({ couple_id: (created as Couple).id, user_id: me.id });
  return created as Couple;
};

/** Join the partner's couple by invite code (via SECURITY DEFINER function —
 *  RLS hides other couples, so a plain select can't find the row). */
export const joinCoupleByCode = async (code: string): Promise<Couple> => {
  const sb = supabase();
  const { data, error } = await sb.rpc("join_couple", { invite_code: code.trim().toUpperCase() });
  if (error) throw new Error(error.message.includes("not found") ? "No couple with that code" : error.message);
  return data as Couple;
};

/** Roughly how much lived-in content a profile has — used once at link time
 *  to decide whether the local or remote copy becomes the shared doc. */
export const richness = (d: AppData | null | undefined): number => {
  if (!d) return 0;
  return (
    (d.partnerName ? 1 : 0) +
    Object.values(d.preferences || {}).reduce((n, arr) => n + (arr?.length || 0), 0) +
    (d.dates?.length || 0) + (d.reminders?.length || 0) + (d.giftIdeas?.length || 0) +
    (d.trackedBrands?.length || 0) + (d.followedArtists?.length || 0) +
    (d.savedEvents?.length || 0) + (d.reservations?.length || 0) +
    Object.keys(d.discoveredAnswers || {}).length
  );
};

/* ── data sync (last-write-wins whole document) ── */

export const pushCoupleData = async (coupleId: string, envelope: { version: number; data: AppData }): Promise<void> => {
  const { error } = await supabase()
    .from("couples")
    .update({ data: envelope, updated_at: new Date().toISOString() })
    .eq("id", coupleId);
  if (error) throw error;
};

export const pullCoupleData = async (coupleId: string): Promise<Couple | null> => {
  const { data, error } = await supabase().from("couples").select("*").eq("id", coupleId).maybeSingle();
  if (error) throw error;
  return data as Couple | null;
};

/** Realtime: partner edits arrive as the fresh couple row. Returns cleanup. */
export const subscribeCouple = (coupleId: string, cb: (c: Couple) => void): (() => void) => {
  const channel = supabase()
    .channel(`couple-${coupleId}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "couples", filter: `id=eq.${coupleId}` },
      payload => cb(payload.new as Couple))
    .subscribe();
  return () => { supabase().removeChannel(channel); };
};
