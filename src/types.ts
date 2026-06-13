/* Shared data model — the single source of truth for the `d` object shape */

export interface Brand {
  name: string;
  domain: string;
  tags: string[];
}

export interface TrackedBrand {
  name: string;
  domain: string | null;
  tags: string[];
  addedAt: string; // ISO timestamp
  notify: boolean;
}

export interface DateEntry {
  id: string;
  label: string;
  date: string; // YYYY-MM-DD
  emoji: string;
}

export interface Reminder {
  id: string;
  label: string;
  emoji: string;
  frequency: "weekly" | "bi-weekly" | "monthly" | "quarterly";
  note: string;
  active: boolean;
}

export interface GiftIdea {
  id: string;
  idea: string;
  category: string;
  link: string;
  price: string;
  purchased: boolean;
}

export interface Flashcard {
  id: string;
  category: string;
  question: string;
  hint: string;
  mapTo: PreferenceKey;
  emoji: string;
  deck: string;
  choices?: string[]; // multiple choice — the UI always adds an "Other" type-in
}

export type PreferenceKey =
  | "musicians" | "brands" | "hobbies" | "clothing" | "foods"
  | "flowers" | "colors" | "scents" | "misc";

export type Preferences = Record<PreferenceKey, string[]>;

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:MM
  end: string;   // HH:MM
}

export interface NotificationSettings {
  dates: boolean;
  reminders: boolean;
  brandSales: boolean;
  reservations: boolean; // added in v9
  quietHours: QuietHours;
}

export type ThemeMode = "dark" | "light";

export interface Settings {
  notifications: NotificationSettings;
  theme: ThemeMode; // added in v8
}

export interface Streak {
  count: number;
  lastAnswerDay: string | null; // YYYY-MM-DD of the most recent answer
}

export interface FollowedArtist {
  id: string;        // Ticketmaster attraction id
  name: string;
  imageUrl: string | null;
  genre?: string;
}

export interface LiveEvent {
  id: string;        // Ticketmaster event id
  name: string;
  url: string | null;
  image: string | null;
  date: string | null; // "2026-07-04" (local)
  time: string | null; // "19:30:00" (local)
  tba: boolean;
  venue: string;
  city: string;
  lat: number | null;
  lng: number | null;
  genre: string;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  attractions: Array<{ id: string; name: string; imageUrl: string | null }>;
}

export interface EventPrefs {
  city: string;
  latlong: string | null; // "41.88,-87.62"
  radius: 10 | 25 | 50 | 100;
  category: string;       // classificationName, "" = all
  sort: "date,asc" | "distance,asc";
}

export interface Reservation {
  id: string;
  restaurant: string;
  city: string;       // "Winter Park, FL"
  date: string;       // YYYY-MM-DD
  time: string | null; // HH:MM
  note: string;
}

export interface AppData {
  partnerName: string;
  preferences: Preferences;
  dates: DateEntry[];
  reminders: Reminder[];
  giftIdeas: GiftIdea[];
  notes: string;
  discoveredAnswers: Record<string, string>;
  trackedBrands: TrackedBrand[];
  settings: Settings;   // added in v5
  streak: Streak;       // added in v5
  giftBudget: number | null; // added in v6 — planning budget for gift suggestions
  followedArtists: FollowedArtist[]; // added in v7
  savedEvents: LiveEvent[];          // added in v7
  eventPrefs: EventPrefs;            // added in v7
  reservations: Reservation[];       // added in v9
}

/* Versioned storage envelope — everything in localStorage is wrapped in this */
export interface StorageEnvelope {
  version: number;
  data: AppData;
}
