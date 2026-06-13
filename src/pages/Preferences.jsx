import { T, ff, ffd, glass, glassInput, eyebrow } from "../theme";
import { CATS } from "../data/flashcards";
import { findBrand } from "../data/brands";
import { categorySuggestions, bouquetIdeas } from "../lib/suggest";
import Liquid from "../components/Liquid";
import Reveal from "../components/Reveal";
import BrandLogo from "../components/BrandLogo";
import BrandInput from "../components/BrandInput";
import BrandChip from "../components/BrandChip";
import TagInput from "../components/TagInput";
import PageHead from "../components/PageHead";

/* ──── PREFERENCES ──── */
const Preferences = ({ d, up, addBrandTracked, totalPrefs, ec, setEc }) => (
  <div style={{ animation: "rise .55s cubic-bezier(.2,1,.3,1)" }}>
    {ec ? (() => {
      const cat = CATS.find(c => c.key === ec);
      return (
        <Reveal>
          <button onClick={() => setEc(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.body, fontFamily: ff, fontSize: 14, padding: 0, marginBottom: 18 }}>← All preferences</button>
          <Liquid lift={false} style={{ padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
              <div style={{ width: 50, height: 50, borderRadius: 17, ...glass({ borderRadius: 17 }), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{cat.emoji}</div>
              <div>
                <h2 style={{ fontSize: 21, fontFamily: ffd, fontStyle: "italic", fontWeight: 400, color: T.ink, margin: 0 }}>{cat.label}</h2>
                <div style={{ fontSize: 12.5, color: T.faint, fontFamily: ff, marginTop: 3 }}>{cat.desc}</div>
              </div>
            </div>
            {cat.key === "brands" ? (
              <div>
                <BrandInput onAdd={addBrandTracked} placeholder="Search brands…" />
                {(d.preferences.brands || []).length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>{d.preferences.brands.map((b, i) => <BrandChip key={i} name={b} onRemove={() => up(x => { x.preferences.brands.splice(i, 1); x.trackedBrands = (x.trackedBrands || []).filter(z => z.name !== b); })} />)}</div>}
              </div>
            ) : (
              <TagInput items={d.preferences[cat.key] || []} onAdd={v => up(x => x.preferences[cat.key].push(v))} onRemove={i => up(x => x.preferences[cat.key].splice(i, 1))} placeholder={`Add ${cat.label.toLowerCase()}…`} />
            )}
            {(() => {
              const sugg = categorySuggestions(d, cat.key, 8);
              return sugg.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ ...eyebrow, marginBottom: 9 }}>Suggested — tap to add</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {sugg.map(v => (
                      <button key={v} onClick={() => cat.key === "brands" ? addBrandTracked(v) : up(x => { if (!x.preferences[cat.key].includes(v)) x.preferences[cat.key].push(v); })}
                        style={{
                          padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontFamily: ff, fontSize: 12, fontWeight: 600,
                          color: T.body, background: "var(--wash-1)", border: "1px dashed var(--line-strong)",
                          boxShadow: "inset 0 1px 0 var(--highlight)", transition: "all .25s",
                        }}>{v} <span style={{ color: T.faint, fontWeight: 700 }}>+</span></button>
                    ))}
                  </div>
                </div>
              );
            })()}
            {cat.key === "flowers" && (() => {
              const ideas = bouquetIdeas(d);
              return ideas.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line-soft)" }}>
                  <div style={{ ...eyebrow, color: "var(--rose-text)", marginBottom: 9 }}>Bouquets to buy — from her favorites</div>
                  <div style={{ fontFamily: ff, fontSize: 12.5, color: T.body, lineHeight: 1.9 }}>
                    {ideas.map(b => <div key={b} style={{ display: "flex", gap: 7 }}><span>💐</span><span>{b}</span></div>)}
                  </div>
                </div>
              );
            })()}
          </Liquid>
        </Reveal>
      );
    })() : (
      <>
        <PageHead kicker={`${totalPrefs} saved`} title={d.partnerName ? `${d.partnerName}'s favorites` : "Favorites"} />
        {CATS.map((cat, i) => {
          const items = d.preferences[cat.key] || [];
          return (
            <Reveal key={cat.key} delay={0.03 + i * 0.03}>
              <Liquid onClick={() => setEc(cat.key)} style={{ padding: "14px 16px", marginBottom: 8, borderRadius: 19 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 14, ...glass({ borderRadius: 14 }), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{cat.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.ink, letterSpacing: "-0.01em" }}>{cat.label}</div>
                    <div style={{ fontFamily: ff, fontSize: 11.5, color: T.faint, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                      {cat.key === "brands" && items.length > 0 && items.slice(0, 3).map(b => { const br = findBrand(b); return br ? <BrandLogo key={b} domain={br.domain} name={b} size={13} /> : null; })}
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{items.length ? items.join(", ") : cat.desc}</span>
                    </div>
                  </div>
                  <div style={{ minWidth: 30, textAlign: "center", background: items.length ? "rgba(255,122,156,0.10)" : "var(--wash-1)", border: "1px solid " + (items.length ? "rgba(255,122,156,0.22)" : "rgba(255,255,255,0.07)"), color: items.length ? "var(--rose-soft)" : T.ghost, borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 700, fontFamily: ff, boxShadow: "inset 0 1px 0 var(--highlight)" }}>{items.length}</div>
                </div>
              </Liquid>
            </Reveal>
          );
        })}
        <Reveal delay={0.35}>
          <div style={{ marginTop: 18 }}>
            <div style={{ ...eyebrow, margin: "0 4px 10px" }}>Notes</div>
            <textarea value={d.notes || ""} onChange={e => up(x => x.notes = e.target.value)} placeholder="Allergies, dream trips, anything worth remembering…" rows={4} style={{ ...glassInput, resize: "vertical", lineHeight: 1.7 }} />
          </div>
        </Reveal>
      </>
    )}
  </div>
);
export default Preferences;
