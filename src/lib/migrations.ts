/**
 * Versioned storage migrations.
 *
 * Everything persisted is wrapped in a `{ version, data }` envelope.
 * Legacy payloads (the raw v4 object, no envelope) are detected and wrapped
 * before migrating. Migrations run in sequence: each entry upgrades
 * version n → n+1. Never drop user data — unknown fields pass through.
 *
 * IMPORTANT: bump CURRENT_VERSION and add its migration in the SAME file
 * write — a transient mismatch under HMR once autosaved a wipe.
 *
 * The localStorage key stays `hwhl-v4` (the key names the era the app
 * shipped in, the envelope names the data shape).
 */
import type { AppData, EventPrefs, Settings, StorageEnvelope, Streak } from "../types";

export const CURRENT_VERSION = 9;

export const defaultSettings = (): Settings => ({
  notifications: {
    dates: true,
    reminders: true,
    brandSales: true,
    reservations: true,
    quietHours: { enabled: false, start: "22:00", end: "08:00" },
  },
  theme: "dark",
});

export const defaultStreak = (): Streak => ({ count: 0, lastAnswerDay: null });

export const defaultEventPrefs = (): EventPrefs => ({ city: "", latlong: null, radius: 25, category: "", sort: "date,asc" });

export const defaultData = (): AppData => ({
  partnerName: "",
  preferences: { musicians: [], brands: [], hobbies: [], clothing: [], foods: [], flowers: [], colors: [], scents: [], misc: [] },
  dates: [],
  reminders: [],
  giftIdeas: [],
  notes: "",
  discoveredAnswers: {},
  trackedBrands: [],
  settings: defaultSettings(),
  streak: defaultStreak(),
  giftBudget: null,
  followedArtists: [],
  savedEvents: [],
  eventPrefs: defaultEventPrefs(),
  reservations: [],
});

/* Each migration upgrades data from its key's version to the next. */
type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

const MIGRATIONS: Record<number, Migration> = {
  /* v4 → v5: add notification settings and the Discover streak */
  4: (data) => ({
    ...data,
    settings: (data.settings as Settings | undefined) ?? defaultSettings(),
    streak: (data.streak as Streak | undefined) ?? defaultStreak(),
  }),
  /* v5 → v6: add the gift planning budget */
  5: (data) => ({
    ...data,
    giftBudget: (data.giftBudget as number | null | undefined) ?? null,
  }),
  /* v6 → v7: add live events — followed artists, saved events, search prefs */
  6: (data) => ({
    ...data,
    followedArtists: (data.followedArtists as unknown[] | undefined) ?? [],
    savedEvents: (data.savedEvents as unknown[] | undefined) ?? [],
    eventPrefs: { ...defaultEventPrefs(), ...(data.eventPrefs as Partial<EventPrefs> | undefined) },
  }),
  /* v7 → v8: add the theme mode (dark stays the designed default) */
  7: (data) => {
    const prev = (data.settings as Partial<Settings> | undefined) ?? defaultSettings();
    return { ...data, settings: { ...defaultSettings(), ...prev, theme: prev.theme ?? "dark" } };
  },
  /* v8 → v9: add restaurant reservations + their notification toggle */
  8: (data) => {
    const prev = (data.settings as Settings | undefined) ?? defaultSettings();
    const n = prev.notifications as Partial<Settings["notifications"]>;
    return {
      ...data,
      reservations: (data.reservations as unknown[] | undefined) ?? [],
      settings: { ...prev, notifications: { ...defaultSettings().notifications, ...n } },
    };
  },
};

/** Wrap a parsed payload in an envelope; raw legacy objects are version 4. */
export const toEnvelope = (parsed: unknown): StorageEnvelope => {
  if (parsed && typeof parsed === "object" && "version" in (parsed as object) && "data" in (parsed as object)) {
    return parsed as StorageEnvelope;
  }
  return { version: 4, data: parsed as AppData };
};

/** Run pending migrations until the envelope reaches CURRENT_VERSION. */
export const migrate = (envelope: StorageEnvelope): StorageEnvelope => {
  let { version, data } = envelope;
  let obj = data as unknown as Record<string, unknown>;
  while (version < CURRENT_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new Error(`No migration from storage version ${version}`);
    obj = step(obj);
    version += 1;
  }
  return { version, data: obj as unknown as AppData };
};

/** Parse a raw stored string into fully-migrated app data. */
export const parseStored = (raw: string): AppData => migrate(toEnvelope(JSON.parse(raw))).data;

/** Serialize app data into the current envelope for storage. */
export const serialize = (data: AppData): string => JSON.stringify({ version: CURRENT_VERSION, data });
