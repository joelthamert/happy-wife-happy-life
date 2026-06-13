/* Calendar/reminders interop — .ics generation opens natively on iOS/Android/desktop */
import type { Reminder } from "../types";

export interface ICSEvent {
  date: string;        // YYYY-MM-DD
  label: string;
  emoji?: string;
  id?: string;
}
export const toICSDate = (ds: string): string => { const d2 = new Date(ds + "T00:00:00"); return `${d2.getFullYear()}${String(d2.getMonth()+1).padStart(2,"0")}${String(d2.getDate()).padStart(2,"0")}`; };
export const generateICS = (events: ICSEvent[]): string => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}T${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}00`;
  let ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//HWHL//EN\r\nCALSCALE:GREGORIAN\r\n";
  events.forEach((ev, i) => {
    const dtStart = toICSDate(ev.date);
    const nd = new Date(ev.date + "T00:00:00"); nd.setDate(nd.getDate() + 1);
    const dtEnd = `${nd.getFullYear()}${String(nd.getMonth()+1).padStart(2,"0")}${String(nd.getDate()).padStart(2,"0")}`;
    ics += `BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:${dtStart}\r\nDTEND;VALUE=DATE:${dtEnd}\r\nSUMMARY:${ev.emoji || ""} ${ev.label}\r\nDESCRIPTION:Added from Happy Spouse Happy House\r\nRRULE:FREQ=YEARLY\r\nUID:hwhl-${ev.id || i}-${dtStart}@hwhl\r\nDTSTAMP:${stamp}\r\nBEGIN:VALARM\r\nTRIGGER:-P7D\r\nACTION:DISPLAY\r\nDESCRIPTION:${ev.label} in 7 days\r\nEND:VALARM\r\nBEGIN:VALARM\r\nTRIGGER:-P1D\r\nACTION:DISPLAY\r\nDESCRIPTION:${ev.label} tomorrow\r\nEND:VALARM\r\nEND:VEVENT\r\n`;
  });
  return ics + "END:VCALENDAR\r\n";
};
export const downloadFile = (content: string, filename: string, mime: string): void => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename, style: "display:none" });
  (document.body || document.documentElement).appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 100);
};
export const downloadICS = (events: ICSEvent[], filename = "hwhl-dates.ics"): void => downloadFile(generateICS(events), filename, "text/calendar;charset=utf-8");
/**
 * Single-occurrence VEVENT — unlike the anniversary exporter, NO RRULE.
 * Uses the event's local date/time (floating, so it lands at the right local
 * wall-clock time); all-day when the time is missing or TBA. 1-day alarm only.
 */
export interface OneOffEvent {
  id: string;
  name: string;
  date: string;          // YYYY-MM-DD
  time?: string | null;  // HH:MM:SS
  tba?: boolean;
  venue?: string;
  city?: string;
  url?: string | null;
}

export const generateEventICS = (e: OneOffEvent): string => {
  const d = e.date.replace(/-/g, "");
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}T${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}00`;
  const dt = e.time && !e.tba
    ? `DTSTART:${d}T${e.time.replace(/:/g, "").slice(0, 6).padEnd(6, "0")}\r\n`
    : `DTSTART;VALUE=DATE:${d}\r\n`;
  const location = [e.venue, e.city].filter(Boolean).join(", ");
  return (
    "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//HWHL//EN\r\nCALSCALE:GREGORIAN\r\n" +
    "BEGIN:VEVENT\r\n" + dt +
    `SUMMARY:🎟️ ${e.name}\r\n` +
    (location ? `LOCATION:${location}\r\n` : "") +
    `DESCRIPTION:Saved from Happy Spouse Happy House${e.url ? "\\n" + e.url : ""}\r\n` +
    `UID:hwhl-evt-${e.id}@hwhl\r\nDTSTAMP:${stamp}\r\n` +
    "BEGIN:VALARM\r\nTRIGGER:-P1D\r\nACTION:DISPLAY\r\n" +
    `DESCRIPTION:${e.name} tomorrow\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`
  );
};

export const downloadEventICS = (e: OneOffEvent): void =>
  downloadFile(generateEventICS(e), `hwhl-${e.name.replace(/[^\w]+/g, "-").slice(0, 40)}.ics`, "text/calendar;charset=utf-8");

export const generateRemindersText = (reminders: Reminder[], partnerName: string): string => {
  let txt = `Happy Spouse Happy House — Reminders for ${partnerName || "Partner"}\n${"─".repeat(40)}\n\n`;
  reminders.filter(r => r.active).forEach(r => { txt += `${r.emoji} ${r.label}\n   ${r.note} · ${r.frequency}\n\n`; });
  return txt;
};
