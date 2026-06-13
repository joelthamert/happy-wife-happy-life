import { T, ff, eyebrow, btnGhost } from "../theme";
import { gid } from "../lib/utils";
import { downloadFile, downloadICS, generateRemindersText } from "../lib/ics";
import Liquid from "../components/Liquid";
import Reveal from "../components/Reveal";
import PageHead from "../components/PageHead";

/* ──── REMINDERS ──── */
const Reminders = ({ d, up, syncedReminders, setSyncedReminders }) => {
  const activeReminders = (d.reminders || []).filter(r => r.active);
  return (
    <div style={{ animation: "rise .55s cubic-bezier(.2,1,.3,1)" }}>
      <PageHead kicker={`${activeReminders.length} active`} title="Reminders" />
      <div style={{ ...eyebrow, margin: "0 4px 11px" }}>Quick add</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
        {[{ l: "Buy flowers", e: "💐", f: "bi-weekly", n: "Her favorites" }, { l: "Date night", e: "🍷", f: "monthly", n: "Plan something" }, { l: "Love note", e: "💌", f: "weekly", n: "A sweet text" }, { l: "Surprise", e: "🎉", f: "quarterly", n: "Unexpected" }].map((p, i) => (
          <Reveal key={p.l} delay={0.04 + i * 0.04}>
            <Liquid onClick={() => up(x => x.reminders.push({ label: p.l, emoji: p.e, frequency: p.f, note: p.n, id: gid(), active: true }))} style={{ padding: "19px 16px", borderRadius: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 9 }}>{p.e}</div>
              <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: T.ink, letterSpacing: "-0.01em" }}>{p.l}</div>
              <div style={{ fontFamily: ff, fontSize: 10.5, color: T.faint, marginTop: 3, textTransform: "capitalize" }}>{p.f}</div>
            </Liquid>
          </Reveal>
        ))}
      </div>
      {activeReminders.length > 0 && (
        <Reveal delay={0.18}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => downloadFile(generateRemindersText(d.reminders, d.partnerName), "hwhl-reminders.txt", "text/plain")} style={{ ...btnGhost, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: T.mintText, fontWeight: 700, fontSize: 12 }}>
              Export to-do list
            </button>
            <button onClick={async () => {
              const txt = activeReminders.map(r => `${r.emoji} ${r.label} (${r.frequency}) — ${r.note}`).join("\n");
              try { await navigator.clipboard.writeText(txt); setSyncedReminders(new Set(activeReminders.map(r => r.id))); } catch {}
            }} style={{ ...btnGhost, fontSize: 12 }}>Copy</button>
          </div>
        </Reveal>
      )}
      {(d.reminders || []).length > 0 && d.reminders.map((r, i) => {
        const synced = syncedReminders.has(r.id);
        return (
          <Reveal key={r.id} delay={0.2 + i * 0.04}>
            <Liquid lift={false} style={{ padding: "13px 15px", marginBottom: 8, borderRadius: 18, opacity: r.active ? 1 : 0.4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ fontSize: 21 }}>{r.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: T.ink }}>{r.label}</div>
                  <div style={{ fontFamily: ff, fontSize: 11, color: T.faint, marginTop: 1 }}>{r.note} · {r.frequency}</div>
                </div>
                <button onClick={() => up(x => { const j = x.reminders.findIndex(z => z.id === r.id); if (j >= 0) x.reminders[j].active = !x.reminders[j].active; })} style={{
                  padding: "5px 13px", borderRadius: 999, cursor: "pointer", fontFamily: ff, fontSize: 10, fontWeight: 800, transition: "all .3s",
                  border: "1px solid " + (r.active ? "rgba(255,122,156,0.35)" : "rgba(255,255,255,0.08)"),
                  background: r.active ? "linear-gradient(145deg, rgba(255,122,156,0.20), rgba(176,124,255,0.14))" : "var(--wash-0)",
                  color: r.active ? "var(--rose-text-strong)" : T.ghost, boxShadow: "inset 0 1px 0 var(--highlight)",
                }}>{r.active ? "ON" : "OFF"}</button>
                <button onClick={() => up(x => x.reminders = x.reminders.filter(z => z.id !== r.id))} style={{ background: "none", border: "none", cursor: "pointer", color: T.ghost, fontSize: 14, padding: 3 }}>×</button>
              </div>
              {r.active && (
                <div style={{ marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--line-soft)" }}>
                  <button onClick={() => {
                    const calEvent = { label: `${r.emoji} ${r.label}`, date: new Date(Date.now() + (r.frequency === "weekly" ? 7 : r.frequency === "bi-weekly" ? 14 : r.frequency === "monthly" ? 30 : 90) * 864e5).toISOString().split("T")[0], emoji: r.emoji, id: r.id };
                    downloadICS([calEvent], `hwhl-reminder-${r.label.replace(/\s/g, "-")}.ics`);
                    setSyncedReminders(s => new Set([...s, r.id]));
                  }} style={{
                    width: "100%", padding: "7px 10px", borderRadius: 11, cursor: "pointer", fontFamily: ff, fontSize: 10.5, fontWeight: 700, transition: "all .3s",
                    border: "1px solid " + (synced ? "rgba(124,232,182,0.25)" : "rgba(255,255,255,0.07)"),
                    background: synced ? "rgba(124,232,182,0.07)" : "var(--wash-0)",
                    color: synced ? T.mintText : T.faint, boxShadow: "inset 0 1px 0 var(--highlight)",
                  }}>{synced ? "Added to calendar ✓" : "Add next occurrence to calendar"}</button>
                </div>
              )}
            </Liquid>
          </Reveal>
        );
      })}
    </div>
  );
};
export default Reminders;
