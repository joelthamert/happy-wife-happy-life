/* ═══════════════════ AURORA — the breathing background ═══════════════════ */
import type { CSSProperties } from "react";

/* Ambient hearts drifting up behind everything — soft, blurry, low-opacity so
 * cards (glass, backdrop-blurred) sit cleanly on top and stay fully readable.
 * Colour + peak opacity come from theme vars (--heart-fill/--heart-opacity)
 * so it adapts to light and dark. Per-heart --h-op / --h-sway vary the look. */
const HEARTS = [
  { left: "7%",  size: 26, dur: 18, delay: 0,  blur: 3.5, op: 1,    sway: 18 },
  { left: "21%", size: 17, dur: 23, delay: 6,  blur: 2.5, op: 0.8,  sway: -13 },
  { left: "36%", size: 34, dur: 16, delay: 10, blur: 5,   op: 0.9,  sway: 22 },
  { left: "50%", size: 20, dur: 25, delay: 3,  blur: 3,   op: 0.75, sway: -18 },
  { left: "64%", size: 28, dur: 19, delay: 13, blur: 4,   op: 1,    sway: 15 },
  { left: "77%", size: 16, dur: 27, delay: 8,  blur: 2.5, op: 0.7,  sway: -11 },
  { left: "90%", size: 30, dur: 17, delay: 15, blur: 4.5, op: 0.95, sway: 20 },
  { left: "15%", size: 22, dur: 22, delay: 19, blur: 3,   op: 0.85, sway: -16 },
  { left: "58%", size: 24, dur: 24, delay: 21, blur: 3.5, op: 0.9,  sway: 13 },
];

const HEART_PATH = "M16 28.6s-12.6-7.9-12.6-16.8C3.4 7 6.9 4 10.6 4c2.4 0 4.5 1.2 5.4 3 .9-1.8 3-3 5.4-3C25.1 4 28.6 7 28.6 11.8 28.6 20.7 16 28.6 16 28.6z";

const Aurora = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
    <div className="aur a1" /><div className="aur a2" /><div className="aur a3" />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 70% at 50% -10%, transparent 50%, var(--aurora-fade) 100%)" }} />
    <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
    {HEARTS.map((h, i) => (
      <span
        key={i}
        className="heart"
        style={{
          left: h.left,
          width: h.size,
          height: h.size,
          animationDuration: `${h.dur}s`,
          animationDelay: `${h.delay}s`,
          filter: `blur(${h.blur}px)`,
          "--h-op": h.op,
          "--h-sway": `${h.sway}px`,
        } as CSSProperties}
      >
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d={HEART_PATH} fill="var(--heart-fill)" />
        </svg>
      </span>
    ))}
  </div>
);
export default Aurora;
