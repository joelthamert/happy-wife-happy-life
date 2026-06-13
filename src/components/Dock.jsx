import { useState } from "react";
import { T, ff, glass } from "../theme";
import Icon from "./Icon";

/* ═══════════════════ GLASS DOCK — three buttons, expanding tray ═══════════════════
 * Home · More · Discover. The center button springs open a glass tray with
 * the section pages (Brands, Dates, Dine, Events, Gifts) so the bar stays
 * uncluttered. Prefs/Reminders live on the Home "Spaces" grid; Settings is
 * the gear on the hero.
 */
const TRAY = [
  { k: "brands", icon: "tag", l: "Brands" },
  { k: "dates", icon: "calendar", l: "Dates" },
  { k: "restaurants", icon: "wine", l: "Dine" },
  { k: "events", icon: "ticket", l: "Events" },
  { k: "gifts", icon: "gift", l: "Gifts" },
];

const Dock = ({ pg, go, minimized }) => {
  const [open, setOpen] = useState(false);
  const trayActive = TRAY.some(t => t.k === pg);
  const slotIdx = pg === "home" ? 0 : trayActive || open ? 1 : pg === "discover" ? 2 : -1;
  const nav = (k) => { setOpen(false); go(k); };

  const slotBtn = ({ key, label, active, onClick, children }) => (
    <button key={key} onClick={onClick} aria-label={label} style={{ position: "relative", zIndex: 1, flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 0 8px", transition: "transform .2s cubic-bezier(.2,1,.3,1)" }}
      onMouseDown={e => e.currentTarget.style.transform = "scale(0.88)"}
      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
      {children}
      <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, fontFamily: ff, color: active ? "var(--rose-text-strong)" : T.faint, letterSpacing: "0.04em", transition: "color .35s" }}>{label}</span>
    </button>
  );

  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 190 }} />}
      <div style={{ position: "fixed", bottom: "calc(14px + env(safe-area-inset-bottom))", left: 0, right: 0, zIndex: 200, display: "flex", justifyContent: "center", pointerEvents: "none", padding: "0 12px", transform: minimized && !open ? "translateY(calc(100% + 8px))" : "translateY(0)", transition: "transform .35s cubic-bezier(.2,1,.3,1)", willChange: "transform" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 340 }}>

          {/* expanding tray */}
          {open && (
            <div style={{
              ...glass({ borderRadius: 24 }),
              position: "absolute", bottom: "calc(100% + 10px)", left: 0, right: 0, pointerEvents: "auto",
              display: "flex",
              background: "var(--dock-bg)",
              backdropFilter: "blur(34px) saturate(180%)", WebkitBackdropFilter: "blur(34px) saturate(180%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.20), 0 18px 50px rgba(0,0,0,0.45)",
              padding: 6, animation: "rise .35s cubic-bezier(.2,1,.3,1)",
            }}>
              {TRAY.map(t => {
                const act = pg === t.k;
                return (
                  <button key={t.k} onClick={() => nav(t.k)} aria-label={t.l} style={{ flex: 1, background: act ? "linear-gradient(145deg, rgba(255,122,156,0.18), rgba(176,124,255,0.12))" : "none", border: "none", borderRadius: 18, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "11px 0 9px", transition: "background .3s" }}>
                    <span style={{ color: act ? "var(--rose-text-strong)" : T.body, display: "flex" }}><Icon name={t.icon} size={20} /></span>
                    <span style={{ fontSize: 9, fontWeight: act ? 700 : 500, fontFamily: ff, color: act ? "var(--rose-text-strong)" : T.faint, letterSpacing: "0.04em" }}>{t.l}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* the bar */}
          <div style={{
            pointerEvents: "auto", display: "flex", position: "relative",
            ...glass({ borderRadius: 999 }),
            background: "var(--dock-bg)",
            backdropFilter: "blur(34px) saturate(180%)", WebkitBackdropFilter: "blur(34px) saturate(180%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 var(--wash-1), 0 18px 50px rgba(0,0,0,0.55)",
            padding: 5,
          }}>
            {/* liquid indicator */}
            <div style={{
              position: "absolute", top: 5, bottom: 5, left: 5,
              width: "calc((100% - 10px) / 3)",
              transform: `translateX(${Math.max(slotIdx, 0) * 100}%)`,
              opacity: slotIdx < 0 ? 0 : 1,
              transition: "transform .55s cubic-bezier(.3,1.4,.4,1), opacity .3s",
              borderRadius: 999,
              background: "linear-gradient(145deg, rgba(255,122,156,0.22), rgba(176,124,255,0.16))",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 18px rgba(255,122,156,0.18)",
            }} />
            {slotBtn({
              key: "home", label: "Home", active: pg === "home", onClick: () => nav("home"),
              children: <span style={{ color: pg === "home" ? "var(--rose-text-strong)" : T.body, display: "flex", transition: "color .35s" }}><Icon name="home" size={20} /></span>,
            })}
            {slotBtn({
              key: "more", label: open ? "Close" : "More", active: trayActive || open, onClick: () => setOpen(o => !o),
              children: (
                <span style={{ color: trayActive || open ? "var(--rose-text-strong)" : T.body, display: "flex", transform: open ? "rotate(45deg)" : "rotate(0)", transition: "transform .35s cubic-bezier(.3,1.4,.4,1), color .35s" }}>
                  <Icon name="plus" size={20} />
                </span>
              ),
            })}
            {slotBtn({
              key: "discover", label: "Discover", active: pg === "discover", onClick: () => nav("discover"),
              children: <span style={{ color: pg === "discover" ? "var(--rose-text-strong)" : T.body, display: "flex", transition: "color .35s" }}><Icon name="cards" size={20} /></span>,
            })}
          </div>
        </div>
      </div>
    </>
  );
};
export default Dock;
