import { useEffect, useState } from "react";
import { T, ff, glass, glassInput, btnPrimary } from "../theme";
import { BRAND_DB } from "../data/brands";
import BrandLogo from "./BrandLogo";

const BrandInput = ({ onAdd, placeholder = "Search brands…" }) => {
  const [v, setV] = useState("");
  const [sugg, setSugg] = useState([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(-1);
  useEffect(() => {
    if (!v) { setSugg([]); setOpen(false); return; }
    const q = v.toLowerCase();
    const m = BRAND_DB.filter(b => b.name.toLowerCase().startsWith(q) || b.name.toLowerCase().includes(q) || b.tags.some(t => t.includes(q))).slice(0, 8);
    setSugg(m); setSel(-1); setOpen(m.length > 0);
  }, [v]);
  const pick = (b) => { onAdd(b.name); setV(""); setSugg([]); setOpen(false); };
  const key = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(i => Math.min(i + 1, sugg.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (sel >= 0 && sugg[sel]) pick(sugg[sel]); else if (v.trim()) { onAdd(v.trim()); setV(""); setOpen(false); } }
    else if (e.key === "Escape") setOpen(false);
  };
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={v} onChange={e => setV(e.target.value)} onKeyDown={key}
          onFocus={e => { if (sugg.length) setOpen(true); e.target.style.borderColor = "rgba(255,122,156,0.45)"; e.target.style.boxShadow = "inset 0 1px 0 var(--highlight), 0 0 0 3px rgba(255,122,156,0.10)"; }}
          onBlur={e => { setTimeout(() => setOpen(false), 180); e.target.style.borderColor = "var(--line-strong)"; e.target.style.boxShadow = "inset 0 1px 0 var(--highlight)"; }}
          placeholder={placeholder} style={glassInput} />
        <button onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(""); } }} style={{ ...btnPrimary(), padding: "14px 20px", whiteSpace: "nowrap" }}>Add</button>
      </div>
      {open && sugg.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 70, zIndex: 60, ...glass({ borderRadius: 18, padding: "6px" }), background: "var(--dropdown-bg)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 24px 60px rgba(0,0,0,0.6)", maxHeight: 290, overflowY: "auto", animation: "rise .25s cubic-bezier(.2,1,.3,1)" }}>
          {sugg.map((b, i) => (
            <button key={b.name} onMouseDown={() => pick(b)} onMouseEnter={() => setSel(i)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", border: "none", cursor: "pointer", textAlign: "left", borderRadius: 12, background: i === sel ? "rgba(255,122,156,0.12)" : "transparent", transition: "background .15s", fontFamily: ff }}>
              <BrandLogo domain={b.domain} name={b.name} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{b.name}</div>
                <div style={{ fontSize: 11, color: T.faint, marginTop: 1 }}>{b.tags.slice(0, 3).join(" · ")}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export default BrandInput;
