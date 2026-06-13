import { useState } from "react";
import { ff } from "../theme";
import { LOGO_SOURCES } from "../data/brands";

/* Resolves logos through a 4-source fallback chain, then a colored-initial tile */
const BrandLogo = ({ domain, size = 28, style: s = {}, name = "" }) => {
  const [srcIdx, setSrcIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  if (!domain || failed) {
    const initial = (name || domain || "?")[0].toUpperCase();
    const hue = (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    return <div style={{ width: size, height: size, borderRadius: size > 32 ? 13 : 8, background: `linear-gradient(145deg, hsl(${hue},40%,28%), hsl(${hue},45%,18%))`, boxShadow: "inset 0 1px 0 var(--highlight)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, fontWeight: 700, color: `hsl(${hue},65%,78%)`, fontFamily: ff, flexShrink: 0, ...s }}>{initial}</div>;
  }
  return <img src={LOGO_SOURCES[srcIdx](domain)} alt={name} style={{ width: size, height: size, borderRadius: size > 32 ? 13 : 8, objectFit: "contain", background: "var(--logo-tile)", padding: size > 32 ? 5 : 2, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)", flexShrink: 0, ...s }} onError={() => { if (srcIdx < LOGO_SOURCES.length - 1) setSrcIdx(i => i + 1); else setFailed(true); }} />;
};
export default BrandLogo;
