/* ═══════════════════ DESIGN TOKENS — LIQUID GLASS ═══════════════════
 * Surfaces and text read from CSS variables so the theme can switch at
 * runtime: `html[data-theme]` selects the variable set (dark is default).
 * Accent hexes (rose/violet/champagne/mint) stay literal — they are shared
 * by both themes and get alpha suffixes appended (e.g. Liquid's glow).
 */
import type { CSSProperties } from "react";

export const T = {
  bg: "var(--bg)",
  ink: "var(--ink)",
  body: "var(--body)",
  faint: "var(--faint)",
  ghost: "var(--ghost)",
  rose: "#ff7a9c",
  violet: "#b07cff",
  champagne: "#e8c592",
  mint: "#7ce8b6",
  mintText: "var(--mint-text)",
  gradHero: "linear-gradient(120deg,#ff7a9c 0%,#b07cff 100%)",
  gradWarm: "linear-gradient(120deg,#ff7a9c 0%,#e8c592 100%)",
  gradCool: "linear-gradient(120deg,#b07cff 0%,#7c9fff 100%)",
  gradMint: "linear-gradient(120deg,#7ce8b6 0%,#7cc8ff 100%)",
};
export const ff = "'DM Sans',system-ui,-apple-system,sans-serif";
export const ffd = "'Instrument Serif',Georgia,serif";

/* Liquid glass surface — translucent, saturated blur, specular top edge */
export const glass = (o: CSSProperties = {}): CSSProperties => ({
  position: "relative",
  background: "var(--glass-bg)",
  backdropFilter: "blur(28px) saturate(170%)",
  WebkitBackdropFilter: "blur(28px) saturate(170%)",
  border: "1px solid var(--glass-border)",
  boxShadow: "var(--glass-shadow)",
  borderRadius: 24,
  ...o,
});
export const glassInput: CSSProperties = {
  width: "100%", padding: "15px 17px", borderRadius: 16,
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  boxShadow: "inset 0 1px 0 var(--highlight)",
  color: T.ink, fontFamily: ff, fontSize: 15, outline: "none",
  transition: "border-color .35s, box-shadow .35s", boxSizing: "border-box",
};
export const eyebrow: CSSProperties = { fontSize: 10.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: T.faint, fontFamily: ff };
export const btnPrimary = (grad: string = T.gradHero): CSSProperties => ({
  padding: "14px 24px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.18)",
  background: grad, color: "#fff", cursor: "pointer", fontFamily: ff, fontSize: 14, fontWeight: 700,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 28px rgba(255,122,156,0.30)",
  transition: "transform .25s cubic-bezier(.2,1,.3,1), box-shadow .25s",
});
export const btnGhost: CSSProperties = {
  padding: "13px 20px", borderRadius: 16, ...glass({ borderRadius: 16 }),
  cursor: "pointer", color: T.body, fontFamily: ff, fontSize: 13, fontWeight: 600,
};

/* Global keyframes, theme variable sets, aurora fields, resets — injected once by App */
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Instrument+Serif:ital@0;1&display=swap');

  :root, html[data-theme="dark"] {
    --bg:#0b0710;
    --ink:rgba(255,255,255,0.95);
    --body:rgba(255,255,255,0.62);
    --faint:rgba(255,255,255,0.34);
    --ghost:rgba(255,255,255,0.16);
    --glass-bg:linear-gradient(145deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.028) 45%, rgba(255,255,255,0.055) 100%);
    --glass-border:rgba(255,255,255,0.10);
    --glass-shadow:inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(255,255,255,0.03), 0 12px 40px rgba(0,0,0,0.35);
    --highlight:rgba(255,255,255,0.08);
    --input-bg:rgba(255,255,255,0.04);
    --input-border:rgba(255,255,255,0.10);
    --placeholder:rgba(255,255,255,0.22);
    --line:rgba(255,255,255,0.08);
    --line-soft:rgba(255,255,255,0.06);
    --line-strong:rgba(255,255,255,0.10);
    --wash-0:rgba(255,255,255,0.03);
    --wash-1:rgba(255,255,255,0.04);
    --wash-2:rgba(255,255,255,0.06);
    --rose-text:#ffc4d4;
    --rose-text-strong:#ffd1dd;
    --rose-soft:#ffb3c6;
    --rose-hot:#ff92ad;
    --violet-text:#cdb3ff;
    --champagne-text:#ffe3c2;
    --mint-text:#7ce8b6;
    --specular:rgba(255,255,255,0.35);
    --scrim:rgba(5,3,8,0.55);
    --sheet-bg:linear-gradient(180deg, rgba(48,30,58,0.85), rgba(16,10,22,0.92));
    --dropdown-bg:linear-gradient(145deg, rgba(36,22,44,0.92), rgba(20,12,26,0.94));
    --dock-bg:linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.035));
    --aurora-1:rgba(255,122,156,.16);
    --aurora-2:rgba(176,124,255,.13);
    --aurora-3:rgba(232,197,146,.08);
    --aurora-fade:rgba(11,7,16,0.7);
    --logo-tile:rgba(255,255,255,0.94);
    --date-picker-invert:invert(.55);
    --heart-fill:#ff7a9c;
    --heart-opacity:.22;
  }
  html[data-theme="light"] {
    --bg:#f4eef6;
    --ink:rgba(30,16,40,0.95);
    --body:rgba(30,16,40,0.66);
    --faint:rgba(30,16,40,0.42);
    --ghost:rgba(30,16,40,0.24);
    --glass-bg:linear-gradient(145deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.48) 45%, rgba(255,255,255,0.64) 100%);
    --glass-border:rgba(30,16,40,0.10);
    --glass-shadow:inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(30,16,40,0.03), 0 12px 40px rgba(70,35,95,0.12);
    --highlight:rgba(255,255,255,0.85);
    --input-bg:rgba(255,255,255,0.6);
    --input-border:rgba(30,16,40,0.13);
    --placeholder:rgba(30,16,40,0.32);
    --line:rgba(30,16,40,0.09);
    --line-soft:rgba(30,16,40,0.07);
    --line-strong:rgba(30,16,40,0.12);
    --wash-0:rgba(30,16,40,0.035);
    --wash-1:rgba(30,16,40,0.05);
    --wash-2:rgba(30,16,40,0.07);
    --rose-text:#b02458;
    --rose-text-strong:#a81e52;
    --rose-soft:#c42a64;
    --rose-hot:#d61b5e;
    --violet-text:#6f37c4;
    --champagne-text:#8a5e16;
    --mint-text:#0c8a55;
    --specular:rgba(255,255,255,1);
    --scrim:rgba(45,28,60,0.32);
    --sheet-bg:linear-gradient(180deg, rgba(255,255,255,0.94), rgba(246,239,249,0.97));
    --dropdown-bg:linear-gradient(145deg, rgba(255,255,255,0.97), rgba(247,240,250,0.98));
    --dock-bg:linear-gradient(145deg, rgba(255,255,255,0.85), rgba(255,255,255,0.6));
    --aurora-1:rgba(255,122,156,.25);
    --aurora-2:rgba(176,124,255,.20);
    --aurora-3:rgba(232,197,146,.22);
    --aurora-fade:rgba(244,238,246,0.7);
    --logo-tile:rgba(255,255,255,0.94);
    --date-picker-invert:none;
    --heart-fill:#ff7a9c;
    --heart-opacity:.30;
  }

  @keyframes rise{from{opacity:0;transform:translateY(22px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes pop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
  @keyframes breathe{0%,100%{transform:scale(1);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 12px 40px rgba(0,0,0,.35)}50%{transform:scale(1.04);box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 16px 50px rgba(255,122,156,.12)}}
  @keyframes heroGlow{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 0 -1px 0 rgba(255,255,255,.03),0 12px 40px rgba(0,0,0,.35)}50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.20),inset 0 -1px 0 rgba(255,255,255,.04),0 16px 56px rgba(255,122,156,.10),0 0 80px rgba(176,124,255,.06)}}
  @keyframes flipInY{from{opacity:.35;transform:rotateY(-70deg)}to{opacity:1;transform:rotateY(0)}}
  @keyframes shuffleDeal{0%{transform:translateY(0) rotate(0) scale(1)}30%{transform:translateY(-16px) rotate(2.5deg) scale(.97)}65%{transform:translateY(5px) rotate(-1.5deg) scale(1.01)}100%{transform:translateY(0) rotate(0) scale(1)}}
  @keyframes shuffleFanL{0%,100%{transform:translate(0,0) rotate(0);opacity:0}25%{opacity:1}50%{transform:translate(-52px,-10px) rotate(-10deg);opacity:1}85%{opacity:0}}
  @keyframes shuffleFanR{0%,100%{transform:translate(0,0) rotate(0);opacity:0}25%{opacity:1}50%{transform:translate(52px,-4px) rotate(9deg);opacity:1}85%{opacity:0}}
  @keyframes cardEnter{from{opacity:0;transform:scale(.9) rotateY(-7deg) translateX(56px)}to{opacity:1;transform:scale(1) rotateY(0) translateX(0)}}
  @keyframes cardExitL{to{opacity:0;transform:scale(.9) rotateY(7deg) translateX(-110px)}}
  @keyframes cardExitR{to{opacity:0;transform:scale(.9) rotateY(-7deg) translateX(110px)}}
  @keyframes drift1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(60px,40px) scale(1.12)}66%{transform:translate(-40px,80px) scale(.94)}}
  @keyframes drift2{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-70px,-30px) scale(1.08)}75%{transform:translate(40px,-60px) scale(.96)}}
  @keyframes drift3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(50px,-50px) scale(1.15)}}
  .aur{position:absolute;border-radius:50%;filter:blur(90px);will-change:transform}
  .a1{width:480px;height:480px;top:-160px;left:-120px;background:radial-gradient(circle,var(--aurora-1),transparent 65%);animation:drift1 26s ease-in-out infinite}
  .a2{width:420px;height:420px;top:18%;right:-150px;background:radial-gradient(circle,var(--aurora-2),transparent 65%);animation:drift2 32s ease-in-out infinite}
  .a3{width:380px;height:380px;bottom:-100px;left:22%;background:radial-gradient(circle,var(--aurora-3),transparent 65%);animation:drift3 38s ease-in-out infinite}
  @keyframes floatHeart{0%{transform:translateY(0) translateX(0) rotate(0) scale(.9);opacity:0}12%{opacity:calc(var(--heart-opacity) * var(--h-op,1))}50%{transform:translateY(-58vh) translateX(var(--h-sway,12px)) rotate(8deg) scale(1)}88%{opacity:calc(var(--heart-opacity) * var(--h-op,1))}100%{transform:translateY(-120vh) translateX(0) rotate(-5deg) scale(1.05);opacity:0}}
  .heart{position:absolute;bottom:-44px;will-change:transform,opacity;animation:floatHeart linear infinite}
  .heart svg{display:block;width:100%;height:100%}
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  #hwhl-scroll{height:100vh;height:100dvh;padding-bottom:calc(180px + env(safe-area-inset-bottom)) !important}
  input::placeholder,textarea::placeholder{color:var(--placeholder)}
  ::-webkit-scrollbar{width:3px;height:0}::-webkit-scrollbar-thumb{background:var(--line-soft);border-radius:4px}
  input[type="date"]::-webkit-calendar-picker-indicator{filter:var(--date-picker-invert)}
  button{font-family:inherit}
  button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid rgba(255,122,156,.55);outline-offset:2px}
  @media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}
`;
