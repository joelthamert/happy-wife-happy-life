/**
 * Date-idea engine — the consumer for every "vibe" answer that isn't a
 * shoppable preference. Each rule turns specific flashcard answers into a
 * concrete, personalized date plan, so no question is a dead end:
 * shoppable answers feed giftIntel/Events/Brands, everything else feeds this.
 *
 * Surfaced on the Dine tab next to restaurants; a coverage test asserts the
 * union of consumers touches every card in the deck.
 */
import type { AppData } from "../types";

export interface DateIdea {
  emoji: string;
  title: string;
  detail: string;
  sources: string[]; // card ids that fed it — kept for the linkage audit
}

type Answers = Record<string, string>;
type Rule = { ids: string[]; make: (a: Answers, d: AppData) => Omit<DateIdea, "sources"> | null };

const has = (a: Answers, id: string) => !!a[id]?.trim();

/* Every rule lists the card ids it consumes; ids may appear in several rules. */
export const DATE_IDEA_RULES: Rule[] = [
  {
    ids: ["x_karaoke"],
    make: a => has(a, "x_karaoke") ? { emoji: "🎤", title: "Karaoke night", detail: `their go-to is “${a.x_karaoke}” — be ready with a duet` } : null,
  },
  {
    ids: ["x_slowdance", "first_dance", "x_us_song", "x_dance"],
    make: a => {
      const song = a.x_slowdance || a.first_dance || a.x_us_song || a.x_dance;
      return song ? { emoji: "🕯️", title: "Slow dance in the kitchen", detail: `dim the lights and queue “${song}”` } : null;
    },
  },
  {
    ids: ["x_live_vibe", "x_genre", "x_throwback", "x_guilty_song", "x_soundtrack", "x_first_concert", "concert_memory"],
    make: (a, d) => {
      const artist = d.followedArtists?.[0]?.name || d.preferences.musicians?.[0];
      if (artist) return { emoji: "🎶", title: `Live music night — ${artist}`, detail: a.x_live_vibe ? `they love a ${a.x_live_vibe.toLowerCase()} — check Events for dates` : "tour dates are waiting in Events" };
      const flavor = a.x_genre || a.x_throwback || a.x_soundtrack || a.x_guilty_song;
      return flavor ? { emoji: "🎶", title: "Playlist date drive", detail: `build a ${flavor} mix and take the scenic route` } : null;
    },
  },
  {
    ids: ["x_outdoors", "x_beach_mtn", "x_water"],
    make: a => {
      const spot = a.x_outdoors || (a.x_beach_mtn ? a.x_beach_mtn.replace(" person", "") : "") || a.x_water;
      return spot ? { emoji: "🏞️", title: `${spot.replace(/ actually| please/i, "")} day together`, detail: "pack the picnic from their favorite foods" } : null;
    },
  },
  {
    ids: ["x_winter", "x_hotel", "x_city", "dream_trip", "x_drive", "x_bucket"],
    make: a => {
      const trip = a.x_city || a.dream_trip || a.x_bucket || a.x_winter || a.x_drive;
      return trip ? { emoji: "✈️", title: "Plan-the-trip date", detail: `wine, a map, and “${trip}”${a.x_hotel ? ` — they'd stay: ${a.x_hotel.toLowerCase()}` : ""}` } : null;
    },
  },
  {
    ids: ["x_rainy", "cozy_setup", "x_lighting", "x_show_rewatch", "x_pet"],
    make: a => {
      const bits = [a.x_show_rewatch && `rewatch ${a.x_show_rewatch}`, a.x_lighting && a.x_lighting.toLowerCase(), a.cozy_setup, a.x_rainy].filter(Boolean);
      return bits.length ? { emoji: "🌧️", title: "Cozy night in, done right", detail: bits.join(" · ") } : null;
    },
  },
  {
    ids: ["x_date_morning", "x_perfect_morning", "perfect_sunday", "x_morning_person"],
    make: a => {
      const plan = a.x_date_morning || a.x_perfect_morning || a.perfect_sunday;
      return plan ? { emoji: "🌅", title: a.x_morning_person === "Night owl" ? "Late-morning date (they're a night owl)" : "Morning date", detail: plan } : null;
    },
  },
  {
    ids: ["x_competitive"],
    make: a => has(a, "x_competitive") ? { emoji: "🏆", title: "Game night rematch", detail: `${a.x_competitive} — let them win. or don't.` } : null,
  },
  {
    ids: ["x_spa", "spa_day"],
    make: a => (has(a, "x_spa") || has(a, "spa_day")) ? { emoji: "💆", title: "Couples spa morning", detail: a.x_spa || a.spa_day || "" } : null,
  },
  {
    ids: ["x_comfort", "stress_relief"],
    make: a => {
      const c = a.x_comfort || a.stress_relief;
      return c ? { emoji: "🫂", title: "Bad-day rescue kit", detail: `for the next hard week: ${c}` } : null;
    },
  },
  {
    ids: ["x_celebrate", "celebrate_win"],
    make: a => {
      const c = a.x_celebrate || a.celebrate_win;
      return c ? { emoji: "🎉", title: "Celebrate the next win their way", detail: c } : null;
    },
  },
  {
    ids: ["x_tradition"],
    make: a => has(a, "x_tradition") ? { emoji: "🕰️", title: "Start the tradition", detail: a.x_tradition } : null,
  },
  {
    ids: ["x_anniversary", "perf_date", "love_lang", "x_love_lang2", "x_recharge", "x_surprise", "small_gesture", "x_appreciate"],
    make: a => {
      const blueprint = a.perf_date || a.x_anniversary;
      if (blueprint) return { emoji: "💞", title: "The blueprint date", detail: `their words: “${blueprint}”${a.x_surprise ? ` · surprises: ${a.x_surprise.toLowerCase()}` : ""}` };
      const lang = a.x_love_lang2 || a.love_lang;
      return lang ? { emoji: "💕", title: `Lead with ${lang.toLowerCase()}`, detail: a.small_gesture || a.x_appreciate || a.x_recharge || "their love language, acted on" } : null;
    },
  },
  {
    ids: ["x_kid_dream", "x_hero", "x_grow", "x_proud", "x_five_years", "x_one_thing"],
    make: a => {
      const topic = a.x_five_years ? "the five-year dream" : a.x_grow ? `learning ${a.x_grow}` : a.x_kid_dream ? "kid dreams" : a.x_hero ? `why they admire ${a.x_hero}` : a.x_proud ? "their proudest moment" : a.x_one_thing ? a.x_one_thing : null;
      return topic ? { emoji: "🍷", title: "Long-dinner conversation", detail: `book somewhere quiet and ask about ${topic}` } : null;
    },
  },
  {
    ids: ["x_season", "fav_season", "x_weather", "x_holiday2"],
    make: a => {
      const when = a.x_holiday2 || a.x_season || a.fav_season;
      return when ? { emoji: "🍂", title: `Go all-in on ${when}`, detail: a.x_weather ? `ideally on a “${a.x_weather.toLowerCase()}” kind of day` : "their favorite time of year — plan something big" } : null;
    },
  },
  {
    ids: ["x_style_icon", "style_icon", "x_nails", "power_color", "x_color_room"],
    make: a => {
      const icon = a.x_style_icon || a.style_icon;
      if (icon) return { emoji: "🛍️", title: "Closet-raid shopping date", detail: `channel ${icon}, end with dinner` };
      return has(a, "x_nails") ? { emoji: "💅", title: "Mani date", detail: `their signature: ${a.x_nails}` } : null;
    },
  },
  {
    ids: ["x_spice", "x_salty_sweet"],
    make: a => {
      const lean = a.x_spice || a.x_salty_sweet;
      return lean ? { emoji: "🌶️", title: "Snack crawl", detail: `${lean.toLowerCase()} all the way — three stops, one winner` } : null;
    },
  },
];

export const DATE_IDEA_CARD_IDS: ReadonlySet<string> = new Set(DATE_IDEA_RULES.flatMap(r => r.ids));

export const dateIdeas = (d: AppData, limit = 5): DateIdea[] => {
  const a = (d.discoveredAnswers || {}) as Answers;
  const out: DateIdea[] = [];
  for (const rule of DATE_IDEA_RULES) {
    const idea = rule.make(a, d);
    if (idea) out.push({ ...idea, sources: rule.ids.filter(id => has(a, id)) });
  }
  return out.slice(0, limit);
};
