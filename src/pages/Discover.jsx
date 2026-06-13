import { useState } from "react";
import { T, ff, glass, eyebrow } from "../theme";
import { FLASHCARDS } from "../data/flashcards";
import Liquid from "../components/Liquid";
import Reveal from "../components/Reveal";
import FlashCard from "../components/FlashCard";
import PageHead from "../components/PageHead";
import Icon from "../components/Icon";

/* a face-down card used by the shuffle animation */
const ghostCard = (anim) => ({
  position: "absolute", inset: 0, maxWidth: 380, height: 400, margin: "0 auto",
  ...glass({ borderRadius: 30 }),
  background: "linear-gradient(155deg, rgba(255,122,156,0.14) 0%, rgba(176,124,255,0.12) 55%, rgba(232,197,146,0.08) 100%)",
  animation: `${anim} .7s cubic-bezier(.3,1.2,.4,1)`,
  pointerEvents: "none", zIndex: 0, opacity: 0,
});

/* ──── DISCOVER ──── */
const Discover = ({ d, answeredCount, streak, deckFilter, setDeckFilter, cardIdx, setCardIdx, filteredCards, currentCard, handleSaveAnswer, onShuffle }) => {
  const [shuffling, setShuffling] = useState(0); // key bump while the fan plays
  const shuffle = () => {
    if (deckFilter === "weekly") setDeckFilter("all");
    onShuffle();
    setShuffling(s => s + 1);
    setTimeout(() => setShuffling(0), 720);
  };
  return (
  <div style={{ animation: "rise .55s cubic-bezier(.2,1,.3,1)" }}>
    <PageHead kicker="Flashcards" title="Discover"
      action={streak > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, background: "rgba(255,122,156,0.10)", border: "1px solid rgba(255,122,156,0.25)", boxShadow: "inset 0 1px 0 var(--highlight)", animation: "pop .4s cubic-bezier(.2,1,.3,1)" }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ fontFamily: ff, fontSize: 12.5, fontWeight: 800, color: "var(--rose-text-strong)", fontVariantNumeric: "tabular-nums" }}>{streak} day{streak === 1 ? "" : "s"}</span>
        </div>
      )} />
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: "var(--wash-2)", overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)" }}>
        <div style={{ height: "100%", borderRadius: 3, background: T.gradMint, width: `${(answeredCount / FLASHCARDS.length) * 100}%`, transition: "width .8s cubic-bezier(.2,1,.3,1)", boxShadow: "0 0 12px rgba(124,232,182,0.5)" }} />
      </div>
      <span style={{ fontFamily: ff, fontSize: 12.5, fontWeight: 700, color: T.mintText, fontVariantNumeric: "tabular-nums" }}>{answeredCount}/{FLASHCARDS.length}</span>
      <button onClick={shuffle} aria-label="Shuffle the deck" title="Shuffle" style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 999, cursor: "pointer",
        fontFamily: ff, fontSize: 11.5, fontWeight: 700, color: "var(--rose-text-strong)",
        background: "linear-gradient(145deg, rgba(255,122,156,0.16), rgba(176,124,255,0.10))",
        border: "1px solid rgba(255,122,156,0.30)", boxShadow: "inset 0 1px 0 var(--highlight)", transition: "all .3s",
      }}>
        <span style={{ display: "flex", animation: shuffling ? "shuffleDeal .7s cubic-bezier(.3,1.2,.4,1)" : "none" }}><Icon name="shuffle" size={15} /></span>
        Shuffle
      </button>
    </div>
    <div style={{ display: "flex", gap: 7, overflowX: "auto", marginBottom: 26, paddingBottom: 4, scrollbarWidth: "none" }}>
      {[{ k: "weekly", l: "✨ Weekly 3" }, { k: "all", l: "All" }, { k: "music", l: "Music" }, { k: "food", l: "Food" }, { k: "style", l: "Style" }, { k: "hobbies", l: "Hobbies" }, { k: "vibes", l: "Vibes" }, { k: "deep", l: "Deep" }].map(dk => {
        const act = deckFilter === dk.k;
        return (
          <button key={dk.k} onClick={() => { setDeckFilter(dk.k); setCardIdx(0); }} style={{
            padding: "9px 17px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            fontFamily: ff, fontSize: 12.5, fontWeight: act ? 700 : 500,
            color: act ? "var(--rose-text-strong)" : T.body,
            background: act ? "linear-gradient(145deg, rgba(255,122,156,0.18), rgba(176,124,255,0.12))" : "var(--wash-1)",
            border: act ? "1px solid rgba(255,122,156,0.30)" : "1px solid var(--line)",
            boxShadow: act ? "inset 0 1px 0 var(--highlight)" : "inset 0 1px 0 var(--wash-1)",
            backdropFilter: "blur(12px)", transition: "all .3s",
          }}>{dk.l}</button>
        );
      })}
    </div>
    {filteredCards.length > 0 && currentCard && (
      <div style={{ position: "relative" }}>
        {/* ghost cards fan out behind the deal while shuffling */}
        {shuffling > 0 && <div key={`gl-${shuffling}`} style={ghostCard("shuffleFanL")} />}
        {shuffling > 0 && <div key={`gr-${shuffling}`} style={ghostCard("shuffleFanR")} />}
        <div key={`deal-${shuffling}`} style={{ position: "relative", zIndex: 1, animation: shuffling ? "shuffleDeal .7s cubic-bezier(.3,1.2,.4,1)" : "none" }}>
          <FlashCard key={currentCard.id + "-" + cardIdx} card={currentCard} answer={d.discoveredAnswers?.[currentCard.id] || ""} index={cardIdx % filteredCards.length} total={filteredCards.length} onSave={ans => handleSaveAnswer(currentCard.id, ans, currentCard.mapTo)} onSkip={() => setCardIdx(i => i + 1)} />
        </div>
      </div>
    )}
    {answeredCount > 0 && (
      <div style={{ marginTop: 30 }}>
        <div style={{ ...eyebrow, margin: "0 4px 12px" }}>Answered · {answeredCount}</div>
        {FLASHCARDS.filter(c => d.discoveredAnswers?.[c.id]).map((c, i) => (
          <Reveal key={c.id} delay={i * 0.025}>
            <Liquid lift={false} style={{ padding: "12px 15px", marginBottom: 7, borderRadius: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ fontSize: 17 }}>{c.emoji}</span>
                <div style={{ flex: 1, minWidth: 0, fontFamily: ff, fontSize: 13.5, color: T.ink, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.discoveredAnswers[c.id]}</div>
                <span style={{ fontSize: 10.5, color: T.mintText, fontFamily: ff, fontWeight: 600 }}>→ {c.mapTo}</span>
              </div>
            </Liquid>
          </Reveal>
        ))}
      </div>
    )}
  </div>
  );
};
export default Discover;
