/* ═══════════════════ AURORA — the breathing background ═══════════════════ */
const Aurora = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
    <div className="aur a1" /><div className="aur a2" /><div className="aur a3" />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 70% at 50% -10%, transparent 50%, var(--aurora-fade) 100%)" }} />
    <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
  </div>
);
export default Aurora;
