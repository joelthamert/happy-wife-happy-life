import { T, ff, ffd, glassInput, eyebrow, btnPrimary } from "../theme";
import { gid, daysUntil, fmtDate } from "../lib/utils";
import { downloadICS } from "../lib/ics";
import { dateSuggestions } from "../lib/dateSuggestions";
import { dateIdeas } from "../lib/dateIdeas";
import Liquid from "../components/Liquid";
import Reveal from "../components/Reveal";
import AnimNum from "../components/AnimNum";
import Sheet from "../components/Sheet";
import PageHead from "../components/PageHead";

/* ──── DATES ──── */
const Dates = ({ d, up, addDate, setAddDate, df, setDf, exportToCal, setExportToCal, syncedDates, setSyncedDates }) => (
  <div style={{ animation: "rise .55s cubic-bezier(.2,1,.3,1)" }}>
    <PageHead kicker={`${(d.dates || []).length} tracked`} title="Dates"
      action={<button onClick={() => { setAddDate(true); setDf({ label: "", date: "", emoji: "💍" }); }} style={{ ...btnPrimary(T.gradWarm), padding: "11px 19px", fontSize: 13 }}>+ Add</button>} />
    {(d.dates || []).length > 0 && (
      <Reveal delay={0.04}>
        <Liquid onClick={() => { downloadICS(d.dates); setSyncedDates(new Set(d.dates.map(x => x.id))); }} glow={T.mint} style={{ padding: "14px 18px", marginBottom: 16, borderRadius: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
            <span style={{ fontSize: 16 }}>📲</span>
            <span style={{ fontFamily: ff, fontWeight: 700, fontSize: 13, color: T.mintText }}>Export all to calendar</span>
            <span style={{ fontFamily: ff, fontSize: 11, color: T.faint }}>· yearly, with alerts</span>
          </div>
        </Liquid>
      </Reveal>
    )}
    {(() => {
      const suggested = dateSuggestions(d);
      return suggested.length > 0 && (
        <Reveal delay={0.05}>
          <div style={{ ...eyebrow, margin: "0 4px 10px" }}>Suggested</div>
          <div style={{ display: "flex", gap: 7, overflowX: "auto", marginBottom: 18, paddingBottom: 4, scrollbarWidth: "none" }}>
            {suggested.map(s => (
              <button key={s.label} title={s.hint}
                onClick={() => { setDf({ label: s.label, date: s.date || "", emoji: s.emoji }); setAddDate(true); }}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  fontFamily: ff, fontSize: 12.5, fontWeight: 600, color: T.body,
                  background: "var(--wash-1)", border: "1px dashed var(--line-strong)",
                  boxShadow: "inset 0 1px 0 var(--highlight)", backdropFilter: "blur(12px)", transition: "all .3s",
                }}>
                <span style={{ fontSize: 14 }}>{s.emoji}</span>{s.label}
                <span style={{ color: T.faint, fontWeight: 700 }}>+</span>
              </button>
            ))}
          </div>
        </Reveal>
      );
    })()}
    {(() => {
      const ideas = dateIdeas(d, 3);
      return ideas.length > 0 && (
        <Reveal delay={0.055}>
          <Liquid lift={false} glow={T.violet} style={{ padding: "15px 18px", marginBottom: 16, borderRadius: 20 }}>
            <div style={{ ...eyebrow, color: "var(--violet-text)", marginBottom: 9 }}>Date ideas · from their answers</div>
            <div style={{ fontFamily: ff, fontSize: 13, color: T.body, lineHeight: 1.95 }}>
              {ideas.map(idea => (
                <div key={idea.title} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span>{idea.emoji}</span>
                  <span style={{ color: T.ink, fontWeight: 600 }}>{idea.title}</span>
                  <span style={{ fontSize: 11, color: T.faint, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{idea.detail}</span>
                </div>
              ))}
            </div>
          </Liquid>
        </Reveal>
      );
    })()}
    {(d.dates || []).length === 0 ? (
      <Reveal delay={0.06}>
        <Liquid lift={false} style={{ padding: "44px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.6 }}>📅</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.body, fontFamily: ff }}>No dates yet</div>
          <div style={{ fontSize: 13, color: T.faint, fontFamily: ff, marginTop: 5 }}>Tap a suggestion above to start</div>
        </Liquid>
      </Reveal>
    ) : (
      [...d.dates].sort((a, b) => daysUntil(a.date) - daysUntil(b.date)).map((x, i) => {
        const days = daysUntil(x.date);
        const synced = syncedDates.has(x.id);
        return (
          <Reveal key={x.id} delay={0.05 + i * 0.04}>
            <Liquid style={{ padding: "15px 17px", marginBottom: 9, borderRadius: 20, ...(days <= 7 ? { border: "1px solid rgba(255,122,156,0.22)" } : {}) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <span style={{ fontSize: 26 }}>{x.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 14.5, color: T.ink, letterSpacing: "-0.01em" }}>{x.label}</div>
                  <div style={{ fontFamily: ff, fontSize: 11.5, color: T.faint, marginTop: 2 }}>{fmtDate(x.date)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <AnimNum value={days} color={days <= 7 ? "var(--rose-hot)" : "var(--rose-soft)"} />
                  <div style={{ fontFamily: ff, fontSize: 9, color: T.faint, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>days</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 11, borderTop: "1px solid var(--line-soft)" }}>
                <button onClick={() => { downloadICS([x], `hwhl-${x.label.replace(/\s/g, "-")}.ics`); setSyncedDates(s => new Set([...s, x.id])); }} style={{
                  flex: 1, padding: "8px 12px", borderRadius: 12, border: "1px solid " + (synced ? "rgba(124,232,182,0.25)" : "rgba(255,255,255,0.08)"), cursor: "pointer",
                  fontFamily: ff, fontSize: 11.5, fontWeight: 700, transition: "all .3s",
                  background: synced ? "rgba(124,232,182,0.08)" : "var(--wash-0)",
                  color: synced ? T.mintText : T.body, boxShadow: "inset 0 1px 0 var(--highlight)",
                }}>{synced ? "Exported ✓" : "Add to calendar"}</button>
                <button onClick={() => up(dd => dd.dates = dd.dates.filter(z => z.id !== x.id))} style={{ padding: "8px 14px", borderRadius: 12, border: "1px solid var(--line-soft)", background: "var(--wash-0)", cursor: "pointer", color: T.ghost, fontSize: 11.5, fontFamily: ff, fontWeight: 600 }}>Remove</button>
              </div>
            </Liquid>
          </Reveal>
        );
      })
    )}
    <Sheet open={addDate} onClose={() => setAddDate(false)}>
      <h3 style={{ fontSize: 21, fontFamily: ffd, fontStyle: "italic", fontWeight: 400, color: T.ink, margin: "0 0 18px" }}>Add a date</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <input value={df.label} onChange={e => setDf({ ...df, label: e.target.value })} placeholder="Occasion…" style={glassInput} />
        <input type="date" value={df.date} onChange={e => setDf({ ...df, date: e.target.value })} style={{ ...glassInput, colorScheme: "dark" }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["💍", "🎂", "❤️", "🌹", "💐", "🌷", "🎉", "✈️"].map(e => (
            <button key={e} onClick={() => setDf({ ...df, emoji: e })} style={{ width: 46, height: 46, borderRadius: 15, border: df.emoji === e ? "1px solid rgba(255,122,156,0.5)" : "1px solid var(--line-strong)", background: df.emoji === e ? "rgba(255,122,156,0.12)" : "var(--wash-0)", boxShadow: "inset 0 1px 0 var(--highlight)", cursor: "pointer", fontSize: 21, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .25s" }}>{e}</button>
          ))}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: ff, fontSize: 12.5, color: T.body, cursor: "pointer" }}>
          <input type="checkbox" checked={exportToCal} onChange={e => setExportToCal(e.target.checked)} style={{ accentColor: T.rose }} />
          Export to calendar after saving
        </label>
        <button onClick={() => {
          if (df.label && df.date) {
            const newId = gid(); const newDate = { ...df, id: newId };
            up(x => x.dates.push(newDate));
            if (exportToCal) { setTimeout(() => { downloadICS([newDate], `hwhl-${df.label.replace(/\s/g, "-")}.ics`); setSyncedDates(s => new Set([...s, newId])); }, 300); }
            setAddDate(false);
          }
        }} style={{ ...btnPrimary(T.gradWarm), padding: 15 }}>Save date</button>
      </div>
    </Sheet>
  </div>
);
export default Dates;
