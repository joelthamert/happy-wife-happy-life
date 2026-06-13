import { useEffect, useState } from "react";
import { T, ff, ffd, glass, glassInput, eyebrow, btnPrimary, btnGhost } from "../theme";

/* ═══════════════════ FLASHCARD ═══════════════════
 * One face renders at a time with a rotateY entrance animation instead of a
 * preserve-3d two-face stack: WebKit mispositions backdrop-filtered layers
 * inside preserve-3d, which detached the card from its slot on iOS/Safari.
 */
const FlashCard = ({ card, answer, onSave, onSkip, index, total }) => {
  const [flipped, setFlipped] = useState(false);
  const [input, setInput] = useState(answer || "");
  const [saved, setSaved] = useState(!!answer);
  const [exit, setExit] = useState(null);
  const [other, setOther] = useState(false); // "Other" chosen on a multiple-choice card
  useEffect(() => { setFlipped(false); setInput(answer || ""); setSaved(!!answer); setExit(null); setOther(false); }, [card.id, answer]);
  const doSave = () => { if (!input.trim()) return; setSaved(true); onSave(input.trim()); setTimeout(() => { setExit("left"); setTimeout(onSkip, 380); }, 750); };
  const anim = exit ? (exit === "left" ? "cardExitL" : "cardExitR") : "cardEnter";
  const face = (extra = {}) => ({
    position: "relative", width: "100%", height: "100%", boxSizing: "border-box",
    ...glass({ borderRadius: 30 }), padding: "30px 26px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 28px 70px rgba(0,0,0,0.45)",
    animation: "flipInY .5s cubic-bezier(.2,1,.3,1)",
    ...extra,
  });
  return (
    <div style={{ width: "100%", maxWidth: 380, height: 400, margin: "0 auto", perspective: 1400, animation: `${anim} ${exit ? ".38s" : ".55s"} cubic-bezier(.2,1,.3,1) ${exit ? "forwards" : ""}` }}>
      {!flipped ? (
        <div key="front" onClick={() => setFlipped(true)} style={face({ cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(155deg, rgba(255,122,156,0.10) 0%, rgba(176,124,255,0.07) 55%, rgba(232,197,146,0.05) 100%)" })}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
              <span style={eyebrow}>{card.category}</span>
              <span style={{ fontSize: 12, color: T.faint, fontFamily: ff, fontVariantNumeric: "tabular-nums" }}>{index + 1} / {total}</span>
            </div>
            <div style={{ fontSize: 46, marginBottom: 18, filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.35))" }}>{card.emoji}</div>
            <h2 style={{ fontFamily: ffd, fontWeight: 400, fontStyle: "italic", fontSize: 25, color: T.ink, margin: 0, lineHeight: 1.32, letterSpacing: "0.01em" }}>{card.question}</h2>
          </div>
          <div>
            <div style={{ fontSize: 13, color: T.faint, fontFamily: ff, marginBottom: 14 }}>{card.hint}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0 2px", borderTop: "1px solid var(--line)", color: "var(--rose-soft)", fontSize: 13, fontFamily: ff, fontWeight: 600 }}>
              Tap to answer
            </div>
          </div>
        </div>
      ) : (
        <div key="back" style={face({ display: "flex", flexDirection: "column", background: "linear-gradient(155deg, rgba(176,124,255,0.12) 0%, rgba(255,122,156,0.07) 100%)" })}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={eyebrow}>{card.category}</span>
            <button onClick={e => { e.stopPropagation(); setFlipped(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.body, fontSize: 13, fontFamily: ff }}>← Back</button>
          </div>
          <div style={{ fontSize: 16, fontFamily: ffd, fontStyle: "italic", color: T.ink, marginBottom: 16, lineHeight: 1.4 }}>{card.question}</div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
            {card.choices && !saved ? (
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }}>
                {card.choices.map(c => {
                  const act = !other && input === c;
                  return (
                    <button key={c} onClick={() => { setOther(false); setInput(c); }} style={{
                      padding: "9px 16px", borderRadius: 999, cursor: "pointer", fontFamily: ff, fontSize: 13, fontWeight: act ? 700 : 500,
                      color: act ? "var(--rose-text-strong)" : T.body,
                      background: act ? "linear-gradient(145deg, rgba(255,122,156,0.20), rgba(176,124,255,0.14))" : "var(--wash-1)",
                      border: act ? "1px solid rgba(255,122,156,0.35)" : "1px solid var(--line)",
                      boxShadow: "inset 0 1px 0 var(--highlight)", transition: "all .25s",
                    }}>{c}</button>
                  );
                })}
                <button onClick={() => { setOther(true); setInput(""); }} style={{
                  padding: "9px 16px", borderRadius: 999, cursor: "pointer", fontFamily: ff, fontSize: 13, fontWeight: other ? 700 : 500,
                  color: other ? "var(--champagne-text)" : T.faint,
                  background: other ? "rgba(232,197,146,0.12)" : "var(--wash-0)",
                  border: other ? "1px solid rgba(232,197,146,0.30)" : "1px dashed var(--line-strong)",
                  boxShadow: "inset 0 1px 0 var(--highlight)", transition: "all .25s",
                }}>Other…</button>
                {other && (
                  <input autoFocus value={input} onChange={e => setInput(e.target.value)} placeholder="Type their answer…"
                    onKeyDown={e => { if (e.key === "Enter" && input.trim()) doSave(); }}
                    style={{ ...glassInput, padding: "11px 14px", fontSize: 13.5 }} />
                )}
              </div>
            ) : (
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Type their answer…" rows={3}
                style={{ ...glassInput, resize: "none", flex: 1, lineHeight: 1.6, borderColor: saved ? "rgba(124,232,182,0.35)" : "var(--line-strong)", background: saved ? "rgba(124,232,182,0.05)" : "var(--wash-1)" }} />
            )}
            {saved ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 13, borderRadius: 16, background: "rgba(124,232,182,0.08)", border: "1px solid rgba(124,232,182,0.22)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)", animation: "pop .45s cubic-bezier(.2,1,.3,1)" }}>
                <span style={{ fontFamily: ff, fontWeight: 700, fontSize: 13, color: T.mintText }}>Saved · synced to preferences</span>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setExit("right"); setTimeout(onSkip, 380); }} style={{ ...btnGhost, flex: 1, padding: 13 }}>Skip</button>
                <button onClick={doSave} style={{ ...btnPrimary(), flex: 2, padding: 13, opacity: input.trim() ? 1 : 0.4 }}>Save answer</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default FlashCard;
