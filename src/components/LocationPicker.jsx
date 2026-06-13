import { useState } from "react";
import { T, ff, glassInput, btnGhost, btnPrimary } from "../theme";
import { isPostalCode } from "../lib/utils";

/* Shared location editor — writes d.eventPrefs (city/postal or precise
 * latlong), which feeds restaurant top-3, event search, maps and distance
 * sort. Used by the Home first-open prompt and Settings → Location. */
const LocationPicker = ({ d, up, onDone, compact = false }) => {
  const prefs = d.eventPrefs || {};
  const [v, setV] = useState(prefs.city || "");
  const [geoBusy, setGeoBusy] = useState(false);
  const [err, setErr] = useState(null);

  const saveCity = () => {
    const city = v.trim();
    if (!city) return;
    up(x => { x.eventPrefs = { ...x.eventPrefs, city, latlong: null }; });
    onDone?.();
  };
  const useGeo = () => {
    if (!navigator.geolocation) { setErr("Location unavailable — type a city or ZIP instead"); return; }
    setGeoBusy(true); setErr(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGeoBusy(false);
        up(x => { x.eventPrefs = { ...x.eventPrefs, latlong: `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`, city: "" }; });
        onDone?.();
      },
      () => { setGeoBusy(false); setErr("Location was denied — type a city or ZIP instead"); },
    );
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={v} onChange={e => setV(e.target.value)} placeholder="City or ZIP code…"
          onKeyDown={e => { if (e.key === "Enter") saveCity(); }}
          style={{ ...glassInput, ...(compact ? { padding: "12px 14px", fontSize: 14 } : {}) }} />
        <button onClick={saveCity} disabled={!v.trim()} style={{ ...btnPrimary(), padding: compact ? "12px 16px" : "14px 18px", whiteSpace: "nowrap", opacity: v.trim() ? 1 : 0.45 }}>
          {isPostalCode(v) ? "Use ZIP" : "Save"}
        </button>
      </div>
      <button onClick={useGeo} disabled={geoBusy} style={{ ...btnGhost, width: "100%", marginTop: 9, padding: compact ? 11 : 12, textAlign: "center", fontWeight: 700, fontSize: 12 }}>
        {geoBusy ? "Locating…" : "📍 Use my current location"}
      </button>
      {err && <div style={{ fontFamily: ff, fontSize: 11.5, color: "var(--rose-hot)", marginTop: 8, textAlign: "center" }}>{err}</div>}
      {(prefs.latlong || prefs.city) && (
        <div style={{ fontFamily: ff, fontSize: 11, color: T.faint, marginTop: 8, textAlign: "center" }}>
          Current: {prefs.latlong ? "precise location set" : prefs.city}
        </div>
      )}
    </div>
  );
};
export default LocationPicker;
