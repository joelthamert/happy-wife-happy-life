/**
 * Local notifications — Notification API + the PWA service worker.
 *
 * Pure logic (quiet hours, due computation) is separated from the
 * browser plumbing so it can be unit-tested with an injected clock.
 * A sent-log in localStorage stops the same alert firing twice.
 */
import type { AppData, NotificationSettings, Reminder } from "../types";
import { daysUntil, daysUntilExact } from "./utils";

const LOG_KEY = "hwhl-notif-log";
const CHECK_INTERVAL_MS = 30 * 60 * 1000; // every 30 minutes while the app is open

export interface DueNotification {
  key: string;    // unique per occurrence — used for the sent-log
  title: string;
  body: string;
  category: "dates" | "reminders" | "reservations";
}

/* Countdown tips for a booked reservation — personalized from preferences */
export const reservationTip = (d: AppData, daysOut: number): string => {
  const flower = d.preferences?.flowers?.[0];
  if (daysOut === 3) return flower ? `Order ${flower.toLowerCase()} now so they arrive in time` : "Order flowers now so they arrive in time";
  if (daysOut === 1) return "Confirm the reservation and plan the outfit";
  return "Tonight — leave early, arrive unhurried";
};

export type SentLog = Record<string, string>; // key → ISO timestamp sent

/* ── pure logic ── */

export const inQuietHours = (s: NotificationSettings, now: Date): boolean => {
  if (!s.quietHours.enabled) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = s.quietHours.start.split(":").map(Number);
  const [eh, em] = s.quietHours.end.split(":").map(Number);
  const start = sh * 60 + sm, end = eh * 60 + em;
  if (start <= end) return minutes >= start && minutes < end;
  return minutes >= start || minutes < end; // overnight range, e.g. 22:00 → 08:00
};

const FREQ_DAYS: Record<Reminder["frequency"], number> = { weekly: 7, "bi-weekly": 14, monthly: 30, quarterly: 90 };

export const computeDueNotifications = (d: AppData, now: Date, log: SentLog): DueNotification[] => {
  const due: DueNotification[] = [];
  const s = d.settings?.notifications;
  if (!s) return due;

  if (s.dates) {
    for (const x of d.dates || []) {
      const days = daysUntil(x.date);
      const year = now.getFullYear() + (days > 364 ? 1 : 0);
      const marks: Array<[number, string]> = [[7, `${x.label} is a week away`], [1, `${x.label} is tomorrow`], [0, `${x.label} is today`]];
      for (const [at, body] of marks) {
        const key = `date-${x.id}-${year}-${at}d`;
        if (days === at && !log[key]) due.push({ key, title: `${x.emoji} ${x.label}`, body, category: "dates" });
      }
    }
  }

  if (s.reservations) {
    for (const r of d.reservations || []) {
      const days = daysUntilExact(r.date);
      for (const at of [3, 1, 0]) {
        const key = `resv-${r.id}-${at}d`;
        if (days === at && !log[key]) {
          const when = at === 3 ? "in 3 days" : at === 1 ? "tomorrow" : "tonight";
          due.push({ key, title: `🍽️ ${r.restaurant} ${when}${r.time ? ` · ${r.time}` : ""}`, body: reservationTip(d, at), category: "reservations" });
        }
      }
    }
  }

  if (s.reminders) {
    for (const r of (d.reminders || []).filter(r => r.active)) {
      const lastKey = Object.keys(log).filter(k => k.startsWith(`rem-${r.id}-`)).sort().pop();
      const lastSent = lastKey ? new Date(log[lastKey]) : null;
      const intervalMs = FREQ_DAYS[r.frequency] * 864e5;
      if (!lastSent || now.getTime() - lastSent.getTime() >= intervalMs) {
        due.push({ key: `rem-${r.id}-${now.toISOString().slice(0, 10)}`, title: `${r.emoji} ${r.label}`, body: `${r.note} · ${r.frequency}`, category: "reminders" });
      }
    }
  }

  return due;
};

/* ── browser plumbing ── */

export const notificationsSupported = (): boolean => typeof window !== "undefined" && "Notification" in window;

export const permissionState = (): NotificationPermission | "unsupported" =>
  notificationsSupported() ? Notification.permission : "unsupported";

export const requestPermission = async (): Promise<boolean> => {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  return (await Notification.requestPermission()) === "granted";
};

const readLog = (): SentLog => { try { return JSON.parse(localStorage.getItem(LOG_KEY) || "{}"); } catch { return {}; } };
const writeLog = (log: SentLog) => { try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch {} };

const show = async (n: DueNotification) => {
  const opts: NotificationOptions = { body: n.body, icon: "/icon-192.png", badge: "/icon-192.png", tag: n.key };
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg?.showNotification) reg.showNotification(n.title, opts);
  else new Notification(n.title, opts);
};

/** Run one check: fire anything due (outside quiet hours), record it in the log. */
export const checkAndNotify = async (d: AppData, now = new Date()): Promise<number> => {
  if (permissionState() !== "granted") return 0;
  if (!d.settings?.notifications || inQuietHours(d.settings.notifications, now)) return 0;
  const log = readLog();
  const due = computeDueNotifications(d, now, log);
  for (const n of due) {
    await show(n);
    log[n.key] = now.toISOString();
  }
  if (due.length) writeLog(log);
  return due.length;
};

/** Check now and every 30 minutes while the app stays open. Returns a cleanup fn. */
export const startNotificationLoop = (getData: () => AppData): (() => void) => {
  const tick = () => { checkAndNotify(getData()).catch(() => {}); };
  tick();
  const id = setInterval(tick, CHECK_INTERVAL_MS);
  return () => clearInterval(id);
};
