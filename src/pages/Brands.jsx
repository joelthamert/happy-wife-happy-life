import { useState } from "react";
import { T, ff, ffd, btnGhost } from "../theme";
import { dealLinks } from "../lib/saleAlerts";
import { styleLinks, styleReminders } from "../lib/styleLinks";
import Liquid from "../components/Liquid";
import Reveal from "../components/Reveal";
import BrandLogo from "../components/BrandLogo";
import BrandInput from "../components/BrandInput";
import Sheet from "../components/Sheet";
import PageHead from "../components/PageHead";

/* ──── BRANDS ──── */
const Brands = ({ d, up, addBrandTracked, brandTagFilter, setBrandTagFilter }) => {
  const [dealsFor, setDealsFor] = useState(null); // brand whose deal sources are open
  const [looksFor, setLooksFor] = useState(null); // brand whose style/outfit sources are open
  const styleCtx = { colors: d.preferences?.colors || [], clothing: d.preferences?.clothing || [] };
  const tracked = d.trackedBrands || [];
  const allTags = [...new Set(tracked.flatMap(b => b.tags || []))];
  const filtered = brandTagFilter === "all" ? tracked : tracked.filter(b => (b.tags || []).includes(brandTagFilter));
  return (
    <div style={{ animation: "rise .55s cubic-bezier(.2,1,.3,1)" }}>
      <PageHead kicker={`${tracked.length} tracked`} title="Brands" />
      <Reveal delay={0.05}><div style={{ marginBottom: 18 }}><BrandInput onAdd={addBrandTracked} placeholder="Search 150+ brands…" /></div></Reveal>
      {allTags.length > 0 && (
        <Reveal delay={0.08}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 18, paddingBottom: 4, scrollbarWidth: "none" }}>
            {["all", ...allTags.slice(0, 8)].map(tag => {
              const act = brandTagFilter === tag;
              return (
                <button key={tag} onClick={() => setBrandTagFilter(tag)} style={{
                  padding: "7px 14px", borderRadius: 999, cursor: "pointer", flexShrink: 0, textTransform: "capitalize",
                  fontFamily: ff, fontSize: 11.5, fontWeight: act ? 700 : 500,
                  color: act ? "var(--champagne-text)" : T.body,
                  background: act ? "rgba(232,197,146,0.12)" : "var(--wash-1)",
                  border: act ? "1px solid rgba(232,197,146,0.30)" : "1px solid var(--line)",
                  boxShadow: "inset 0 1px 0 var(--highlight)", backdropFilter: "blur(12px)", transition: "all .3s",
                }}>{tag}</button>
              );
            })}
          </div>
        </Reveal>
      )}
      {filtered.length === 0 ? (
        <Reveal delay={0.1}>
          <Liquid lift={false} style={{ padding: "44px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.6 }}>🏷️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.body, fontFamily: ff }}>No brands tracked yet</div>
            <div style={{ fontSize: 13, color: T.faint, fontFamily: ff, marginTop: 5 }}>Search above to start tracking favorites</div>
          </Liquid>
        </Reveal>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {filtered.map((b, i) => (
            <Reveal key={b.name} delay={0.05 + i * 0.03}>
              <Liquid glow={T.champagne} style={{ padding: "20px 14px 16px", borderRadius: 22 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <BrandLogo domain={b.domain} name={b.name} size={46} />
                  <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: T.ink, textAlign: "center", letterSpacing: "-0.01em" }}>{b.name}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                    {(b.tags || []).slice(0, 2).map(t => (
                      <span key={t} style={{ fontSize: 9, color: T.faint, fontFamily: ff, background: "var(--wash-1)", border: "1px solid var(--line-soft)", padding: "2.5px 8px", borderRadius: 999, textTransform: "capitalize" }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap", justifyContent: "center" }}>
                    <button onClick={() => setLooksFor(b)} title="See how their clothes are styled" style={{
                      padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(176,124,255,0.32)", cursor: "pointer",
                      background: "linear-gradient(145deg, rgba(176,124,255,0.20), rgba(255,122,156,0.12))",
                      color: "var(--violet-text)", fontFamily: ff, fontSize: 10, fontWeight: 700,
                      boxShadow: "inset 0 1px 0 var(--highlight)", transition: "all .3s",
                    }}>Looks ↗</button>
                    <button onClick={() => setDealsFor(b)} style={{
                      padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(255,122,156,0.30)", cursor: "pointer",
                      background: "linear-gradient(145deg, rgba(255,122,156,0.16), rgba(176,124,255,0.10))",
                      color: "var(--rose-text-strong)", fontFamily: ff, fontSize: 10, fontWeight: 700,
                      boxShadow: "inset 0 1px 0 var(--highlight)", transition: "all .3s",
                    }}>Deals ↗</button>
                    <button onClick={() => up(x => { const j = x.trackedBrands.findIndex(z => z.name === b.name); if (j >= 0) x.trackedBrands[j].notify = !x.trackedBrands[j].notify; })} style={{
                      padding: "5px 12px", borderRadius: 999, border: "1px solid " + (b.notify ? "rgba(124,232,182,0.3)" : "rgba(255,255,255,0.08)"), cursor: "pointer",
                      background: b.notify ? "rgba(124,232,182,0.10)" : "var(--wash-0)",
                      color: b.notify ? T.mintText : T.faint, fontFamily: ff, fontSize: 10, fontWeight: 700, transition: "all .3s",
                      boxShadow: "inset 0 1px 0 var(--highlight)",
                    }}>{b.notify ? "Alerts on" : "Alerts off"}</button>
                    <button onClick={() => up(x => { x.trackedBrands = x.trackedBrands.filter(z => z.name !== b.name); x.preferences.brands = x.preferences.brands.filter(z => z !== b.name); })} style={{ background: "none", border: "none", cursor: "pointer", color: T.ghost, fontSize: 12, padding: "5px 4px" }}>Remove</button>
                  </div>
                </div>
              </Liquid>
            </Reveal>
          ))}
        </div>
      )}
      <Sheet open={!!dealsFor} onClose={() => setDealsFor(null)}>
        {dealsFor && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <BrandLogo domain={dealsFor.domain} name={dealsFor.name} size={38} />
              <h3 style={{ fontSize: 21, fontFamily: ffd, fontStyle: "italic", fontWeight: 400, color: T.ink, margin: 0 }}>{dealsFor.name} deals</h3>
            </div>
            <div style={{ fontFamily: ff, fontSize: 12, color: T.faint, marginBottom: 16 }}>Live deals and codes from the big aggregators — opens in a new tab.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {dealLinks(dealsFor).map(l => (
                <button key={l.name} onClick={() => window.open(l.url, "_blank", "noopener,noreferrer")}
                  style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "13px 16px" }}>
                  <span style={{ fontFamily: ff, fontSize: 13.5, fontWeight: 700, color: T.ink }}>{l.name}</span>
                  <span style={{ fontFamily: ff, fontSize: 11.5, color: T.faint, flex: 1 }}>{l.note}</span>
                  <span style={{ color: "var(--rose-text-strong)", fontSize: 13 }}>↗</span>
                </button>
              ))}
            </div>
          </>
        )}
      </Sheet>
      <Sheet open={!!looksFor} onClose={() => setLooksFor(null)}>
        {looksFor && (() => {
          const reminders = styleReminders(styleCtx);
          const topColor = (styleCtx.colors || []).find(c => c && c.trim());
          return (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <BrandLogo domain={looksFor.domain} name={looksFor.name} size={38} />
                <h3 style={{ fontSize: 21, fontFamily: ffd, fontStyle: "italic", fontWeight: 400, color: T.ink, margin: 0 }}>Style {looksFor.name}</h3>
              </div>
              <div style={{ fontFamily: ff, fontSize: 12, color: T.faint, marginBottom: 16 }}>
                See how real outfits use {looksFor.name}{topColor ? ` in ${topColor}` : ""}, then shop the exact pieces — a head start on what to buy{d.partnerName ? ` ${d.partnerName}` : " them"}.
              </div>
              {reminders.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: ff, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.faint, marginBottom: 8 }}>What to look for</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {reminders.map(r => (
                      <span key={r} style={{ fontFamily: ff, fontSize: 11.5, color: "var(--champagne-text)", background: "rgba(232,197,146,0.10)", border: "1px solid rgba(232,197,146,0.22)", padding: "4px 11px", borderRadius: 999 }}>{r}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {styleLinks(looksFor, styleCtx).map(l => (
                  <button key={l.name} onClick={() => window.open(l.url, "_blank", "noopener,noreferrer")}
                    style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "13px 16px", ...(l.hero ? { border: "1px solid rgba(176,124,255,0.32)", background: "linear-gradient(145deg, rgba(176,124,255,0.16), rgba(255,122,156,0.08))" } : {}) }}>
                    <span style={{ fontFamily: ff, fontSize: 13.5, fontWeight: 700, color: T.ink }}>{l.name}</span>
                    <span style={{ fontFamily: ff, fontSize: 11.5, color: T.faint, flex: 1 }}>{l.note}</span>
                    <span style={{ color: l.hero ? "var(--violet-text)" : "var(--rose-text-strong)", fontSize: 13 }}>↗</span>
                  </button>
                ))}
              </div>
            </>
          );
        })()}
      </Sheet>
    </div>
  );
};
export default Brands;
