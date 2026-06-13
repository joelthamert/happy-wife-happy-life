import { T, ff, ffd, glass, glassInput, eyebrow, btnPrimary } from "../theme";
import { gid } from "../lib/utils";
import { giftSuggestions } from "../lib/giftIntel";
import Liquid from "../components/Liquid";
import Reveal from "../components/Reveal";
import Sheet from "../components/Sheet";
import PageHead from "../components/PageHead";

/* ──── GIFTS ──── */
const Gifts = ({ d, up, totalPrefs, addGift, setAddGift, gf, setGf, goEvents }) => (
  <div style={{ animation: "rise .55s cubic-bezier(.2,1,.3,1)" }}>
    <PageHead kicker={`${(d.giftIdeas || []).length} ideas`} title="Gifts"
      action={<button onClick={() => { setAddGift(true); setGf({ idea: "", category: "", link: "", price: "" }); }} style={{ ...btnPrimary(T.gradCool), padding: "11px 19px", fontSize: 13, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 28px rgba(176,124,255,0.30)" }}>+ Add</button>} />
    {totalPrefs > 0 && (() => {
      const { context, suggestions } = giftSuggestions(d);
      return (
        <Reveal delay={0.04}>
          <Liquid lift={false} glow={T.champagne} style={{ padding: "17px 19px", marginBottom: 16, borderRadius: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ ...eyebrow, color: "var(--champagne-text)" }}>Smart suggestions</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: ff, fontSize: 10.5, color: T.faint }}>Budget $</span>
                <input type="number" value={d.giftBudget ?? ""} placeholder="any" min="0"
                  onChange={e => up(x => x.giftBudget = e.target.value ? Number(e.target.value) : null)}
                  style={{ ...glassInput, width: 72, padding: "7px 10px", fontSize: 12.5, textAlign: "right" }} />
              </div>
            </div>
            {context.headline && (
              <div style={{ fontFamily: ff, fontSize: 12.5, fontWeight: 700, color: "var(--rose-soft)", marginBottom: 8 }}>
                {context.occasion?.emoji} {context.headline}
              </div>
            )}
            <div style={{ fontFamily: ff, fontSize: 13, color: T.body, lineHeight: 2 }}>
              {suggestions.length === 0 ? (
                <div style={{ color: T.faint }}>Nothing fits that budget — try raising it</div>
              ) : suggestions.map(s => {
                const clickable = s.kind === "concert";
                return (
                  <div key={s.title} onClick={clickable ? () => goEvents("followed") : undefined}
                    style={{ display: "flex", alignItems: "baseline", gap: 8, cursor: clickable ? "pointer" : "default", borderRadius: 10 }}>
                    <span>{s.emoji}</span>
                    <span style={{ color: T.ink, fontWeight: 600 }}>{s.title}</span>
                    <span style={{ fontSize: 11, color: clickable ? "var(--violet-text)" : T.faint }}>{s.detail}</span>
                  </div>
                );
              })}
            </div>
          </Liquid>
        </Reveal>
      );
    })()}
    {(d.giftIdeas || []).length === 0 ? (
      <Reveal delay={0.06}>
        <Liquid lift={false} style={{ padding: "44px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.6 }}>🎁</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.body, fontFamily: ff }}>No ideas saved</div>
          <div style={{ fontSize: 13, color: T.faint, fontFamily: ff, marginTop: 5 }}>Capture them before you forget</div>
        </Liquid>
      </Reveal>
    ) : (
      (d.giftIdeas || []).map((g, i) => (
        <Reveal key={g.id} delay={0.05 + i * 0.04}>
          <Liquid style={{ padding: "14px 16px", marginBottom: 8, borderRadius: 19, opacity: g.purchased ? 0.45 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 13, ...glass({ borderRadius: 13 }), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎁</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: T.ink, textDecoration: g.purchased ? "line-through" : "none", letterSpacing: "-0.01em" }}>{g.idea}</div>
                <div style={{ fontFamily: ff, fontSize: 11.5, color: T.faint, marginTop: 2 }}>{[g.category, g.price && `~$${g.price}`].filter(Boolean).join(" · ")}{g.link && <a href={g.link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--rose-soft)", marginLeft: 8 }}>View →</a>}</div>
              </div>
              <button onClick={() => up(x => { const j = x.giftIdeas.findIndex(z => z.id === g.id); if (j >= 0) x.giftIdeas[j].purchased = !x.giftIdeas[j].purchased; })} style={{ width: 30, height: 30, borderRadius: 10, background: g.purchased ? T.gradHero : "var(--wash-0)", border: g.purchased ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--line-strong)", boxShadow: "inset 0 1px 0 var(--highlight)", cursor: "pointer", color: "#fff", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .3s" }}>{g.purchased ? "✓" : ""}</button>
              <button onClick={() => up(x => x.giftIdeas = x.giftIdeas.filter(z => z.id !== g.id))} style={{ background: "none", border: "none", cursor: "pointer", color: T.ghost, fontSize: 14, padding: 4 }}>×</button>
            </div>
          </Liquid>
        </Reveal>
      ))
    )}
    <Sheet open={addGift} onClose={() => setAddGift(false)}>
      <h3 style={{ fontSize: 21, fontFamily: ffd, fontStyle: "italic", fontWeight: 400, color: T.ink, margin: "0 0 18px" }}>Add a gift idea</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <input value={gf.idea} onChange={e => setGf({ ...gf, idea: e.target.value })} placeholder="Gift idea…" style={glassInput} />
        <div style={{ display: "flex", gap: 8 }}>
          <input value={gf.category} onChange={e => setGf({ ...gf, category: e.target.value })} placeholder="Category" style={glassInput} />
          <input value={gf.price} onChange={e => setGf({ ...gf, price: e.target.value })} placeholder="$" type="number" style={{ ...glassInput, width: 86, flex: "none" }} />
        </div>
        <input value={gf.link} onChange={e => setGf({ ...gf, link: e.target.value })} placeholder="Link (optional)" style={glassInput} />
        <button onClick={() => { if (gf.idea) { up(x => x.giftIdeas.push({ ...gf, id: gid(), purchased: false })); setAddGift(false); } }} style={{ ...btnPrimary(T.gradCool), padding: 15, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 28px rgba(176,124,255,0.30)" }}>Save idea</button>
      </div>
    </Sheet>
  </div>
);
export default Gifts;
