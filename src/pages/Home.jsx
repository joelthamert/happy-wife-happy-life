import { T, ff, ffd, glass, glassInput, eyebrow, btnPrimary, btnGhost } from "../theme";
import { FLASHCARDS } from "../data/flashcards";
import { useState } from "react";
import Liquid from "../components/Liquid";
import Reveal from "../components/Reveal";
import AnimNum from "../components/AnimNum";
import Sheet from "../components/Sheet";
import LocationPicker from "../components/LocationPicker";

const LOC_DISMISS_KEY = "hwhl-loc-prompt-dismissed";

/* First-open nudge: set a home location once; everything local keys off it.
 * Hidden after a location exists or the user dismisses; editable later in
 * Settings → Location. */
const LocationPrompt = ({ d, up }) => {
  const [dismissed, setDismissed] = useState(() => { try { return localStorage.getItem(LOC_DISMISS_KEY) === "1"; } catch { return false; } });
  const hasLoc = !!(d.eventPrefs?.latlong || d.eventPrefs?.city);
  if (hasLoc || dismissed) return null;
  const dismiss = () => { setDismissed(true); try { localStorage.setItem(LOC_DISMISS_KEY, "1"); } catch {} };
  return (
    <Reveal delay={0.05}>
      <Liquid lift={false} glow={T.violet} style={{ padding: "18px 20px", marginBottom: 16, borderRadius: 22 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 22 }}>📍</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.ink }}>Where's home base?</div>
            <div style={{ fontFamily: ff, fontSize: 12, color: T.body, marginTop: 2, lineHeight: 1.5 }}>Unlocks nearby restaurant picks, event suggestions and distance sorting. Change it anytime in Settings.</div>
          </div>
          <button onClick={dismiss} aria-label="Dismiss location prompt" style={{ background: "none", border: "none", cursor: "pointer", color: T.ghost, fontSize: 16, padding: 2 }}>×</button>
        </div>
        <LocationPicker d={d} up={up} compact onDone={() => {}} />
      </Liquid>
    </Reveal>
  );
};

/* ──── HOME ──── */
const Home = ({ d, up, go, totalPrefs, answeredCount, aN, dismiss, ne, setNe, tn, setTn }) => (
  <>
    <Reveal>
      <Liquid lift={false} style={{ padding: "38px 28px 32px", marginBottom: 16, borderRadius: 30, animation: "heroGlow 7s ease-in-out infinite" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={eyebrow}>Happy Wife · Happy Life</div>
          <button onClick={() => go("settings")} aria-label="Settings" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 0, filter: "grayscale(0.6) opacity(0.55)", transition: "filter .3s" }}
            onMouseEnter={e => e.currentTarget.style.filter = "none"}
            onMouseLeave={e => e.currentTarget.style.filter = "grayscale(0.6) opacity(0.55)"}>⚙️</button>
        </div>
        {d.partnerName ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1 style={{ fontSize: 34, fontWeight: 400, color: T.ink, margin: 0, fontFamily: ffd, fontStyle: "italic", lineHeight: 1.1 }}>
              Making <span style={{ background: T.gradHero, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontStyle: "normal", fontWeight: 600 }}>{d.partnerName}</span> happy
            </h1>
            <button onClick={() => { setNe(true); setTn(d.partnerName); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.faint, fontSize: 13, fontFamily: ff, padding: 0 }}>edit</button>
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: 27, fontFamily: ffd, fontWeight: 400, fontStyle: "italic", color: T.ink, margin: "0 0 18px" }}>Who makes your heart sing?</h1>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={tn} onChange={e => setTn(e.target.value)} placeholder="Their name…" style={glassInput} onKeyDown={e => { if (e.key === "Enter" && tn.trim()) up(x => x.partnerName = tn.trim()); }} />
              <button onClick={() => { if (tn.trim()) up(x => x.partnerName = tn.trim()); }} style={btnPrimary()}>Save</button>
            </div>
          </div>
        )}
        {d.partnerName && (
          <div style={{ display: "flex", gap: 22, marginTop: 26, paddingTop: 22, borderTop: "1px solid var(--line-soft)" }}>
            {[{ l: "Preferences", v: totalPrefs, c: "var(--rose-soft)" }, { l: "Brands", v: (d.trackedBrands || []).length, c: T.champagne }, { l: "Gift ideas", v: (d.giftIdeas || []).length, c: "var(--violet-text)" }].map(s => (
              <div key={s.l}>
                <AnimNum value={s.v} color={s.c} />
                <div style={{ fontFamily: ff, fontSize: 10, color: T.faint, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
      </Liquid>
    </Reveal>

    <Sheet open={ne} onClose={() => setNe(false)}>
      <h3 style={{ fontSize: 22, fontFamily: ffd, fontStyle: "italic", fontWeight: 400, color: T.ink, margin: "0 0 16px" }}>Edit name</h3>
      <input value={tn} onChange={e => setTn(e.target.value)} style={{ ...glassInput, marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setNe(false)} style={{ ...btnGhost, flex: 1 }}>Cancel</button>
        <button onClick={() => { up(x => x.partnerName = tn.trim()); setNe(false); }} style={{ ...btnPrimary(), flex: 1 }}>Save</button>
      </div>
    </Sheet>

    <LocationPrompt d={d} up={up} />

    {answeredCount < FLASHCARDS.length && (
      <Reveal delay={0.07}>
        <Liquid onClick={() => go("discover")} glow={T.mint} style={{ padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 15, ...glass({ borderRadius: 15 }), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>🃏</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 14.5, color: T.ink, letterSpacing: "-0.01em" }}>Discover their favorites</div>
              <div style={{ fontFamily: ff, fontSize: 12.5, color: T.body, marginTop: 2 }}>{answeredCount === 0 ? "Flip cards. Save answers. Build the profile." : `${answeredCount} of ${FLASHCARDS.length} answered`}</div>
            </div>
            <span style={{ fontFamily: ff, fontSize: 12, color: T.mintText, fontWeight: 700 }}>Open →</span>
          </div>
          <div style={{ marginTop: 14, height: 4, borderRadius: 2, background: "var(--wash-2)", overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)" }}>
            <div style={{ height: "100%", borderRadius: 2, background: T.gradMint, width: `${(answeredCount / FLASHCARDS.length) * 100}%`, transition: "width .7s cubic-bezier(.2,1,.3,1)", boxShadow: "0 0 10px rgba(124,232,182,0.5)" }} />
          </div>
        </Liquid>
      </Reveal>
    )}

    {aN.length > 0 && (
      <Reveal delay={0.12}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...eyebrow, margin: "6px 4px 11px" }}>Coming up</div>
          {aN.slice(0, 3).map((n, i) => (
            <Reveal key={n.id} delay={0.14 + i * 0.05}>
              <Liquid onClick={n.id === "sale" ? () => go("brands") : n.id === "conc" ? () => go("events") : n.id.startsWith("resv-") ? () => go("restaurants") : undefined}
                style={{ padding: "13px 16px", marginBottom: 8, borderRadius: 18, ...(n.urgency === "urgent" ? { border: "1px solid rgba(255,122,156,0.25)" } : {}) }} lift={false}>
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <span style={{ fontSize: 23 }}>{n.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: ff, fontWeight: 600, fontSize: 13.5, color: T.ink }}>{n.title}</div>
                    <div style={{ fontFamily: ff, fontSize: 12, color: n.urgency === "urgent" ? "var(--rose-soft)" : T.body, marginTop: 1 }}>{n.msg}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); dismiss(n.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.ghost, padding: 4, fontSize: 16 }}>×</button>
                </div>
              </Liquid>
            </Reveal>
          ))}
        </div>
      </Reveal>
    )}

    <Reveal delay={0.18}>
      <div style={{ ...eyebrow, margin: "10px 4px 12px" }}>Spaces</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
        {[
          { l: "Preferences", sub: "Everything they love", e: "💜", p: "preferences", g: T.rose },
          { l: "Tracked brands", sub: "Logos, tags & alerts", e: "🏷️", p: "brands", g: T.champagne },
          { l: "Important dates", sub: "Countdowns & calendar", e: "📅", p: "dates", g: T.violet },
          { l: "Gift ideas", sub: "Smart suggestions", e: "🎁", p: "gifts", g: T.rose },
          { l: "Date nights", sub: "MICHELIN picks & bookings", e: "🍽️", p: "restaurants", g: T.champagne },
          { l: "Reminders", sub: "Recurring sweet things", e: "🔔", p: "reminders", g: T.violet },
        ].map((item, i) => (
          <Reveal key={item.p} delay={0.2 + i * 0.06}>
            <Liquid onClick={() => go(item.p)} glow={item.g} style={{ padding: "20px 17px", borderRadius: 22 }}>
              <div style={{ fontSize: 26, marginBottom: 12 }}>{item.e}</div>
              <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.ink, letterSpacing: "-0.01em" }}>{item.l}</div>
              <div style={{ fontFamily: ff, fontSize: 11.5, color: T.faint, marginTop: 3, lineHeight: 1.45 }}>{item.sub}</div>
            </Liquid>
          </Reveal>
        ))}
      </div>
    </Reveal>
  </>
);
export default Home;
