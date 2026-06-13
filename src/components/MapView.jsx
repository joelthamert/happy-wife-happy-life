import { useEffect, useRef, useState } from "react";
import { T, ff, glass } from "../theme";
import { TILE_SIZE, visibleTiles, markerScreenPos, worldToLatLng, latLngToWorld, fitBounds } from "../lib/mapMath";
import Icon from "./Icon";

/* ═══════════════════ MAPVIEW — zero-dependency glass tile map ═══════════════════
 * Raster slippy map with three aesthetics:
 *   minimal (default) — CARTO light/dark, follows the app theme
 *   satellite         — Esri World Imagery
 *   terrain           — CARTO Voyager + Esri hillshade (Google-terrain look)
 * Drag to pan, ± to zoom, glass pins; tap the header to collapse/expand.
 * Style + collapsed state persist locally; pinning something new re-expands.
 */
const STYLE_KEY = "hwhl-map-style";
const COLLAPSE_KEY = "hwhl-map-collapsed";

/* Each style is a stack of tile layers. Terrain composites a clean light
 * basemap with Esri hillshade multiplied on top — the Google-terrain look
 * (white base, vivid lakes, soft relief) rather than busy topo lines. */
const tileLayers = (style, theme, tx, ty, z) => {
  const sub = "abc"[(tx + ty) % 3];
  if (style === "satellite") return [
    { src: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${ty}/${tx}` },
  ];
  if (style === "terrain") return [
    { src: `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${tx}/${ty}.png` },
    { src: `https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/${z}/${ty}/${tx}`, opacity: 0.45, blend: "multiply" },
  ];
  return [
    { src: `https://${sub}.basemaps.cartocdn.com/${theme === "light" ? "light_all" : "dark_all"}/${z}/${tx}/${ty}.png` },
  ];
};

const ATTRIBUTION = {
  minimal: "© OpenStreetMap · CARTO",
  satellite: "© Esri — World Imagery",
  terrain: "© OpenStreetMap · CARTO · Esri",
};

const STYLES = [
  { k: "minimal", l: "Minimal" },
  { k: "satellite", l: "Satellite" },
  { k: "terrain", l: "Terrain" },
];

/* markers: [{ id, lat, lng, label, kind?: "you" }] — `focusId` recenters + labels */
const MapView = ({ markers = [], focusId = null, height = 240, onMarkerClick }) => {
  const boxRef = useRef(null);
  const [w, setW] = useState(360);
  const [style, setStyle] = useState(() => { try { return localStorage.getItem(STYLE_KEY) || "minimal"; } catch { return "minimal"; } });
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || "dark");
  const pins = markers.filter(m => m.kind !== "you");
  const initial = fitBounds(pins.length ? pins : markers, 360, height);
  const [center, setCenter] = useState(initial.center);
  const [zoom, setZoom] = useState(initial.zoom);
  const [activeId, setActiveId] = useState(focusId);
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; } });
  const drag = useRef(null);

  const toggleCollapsed = () => {
    setCollapsed(c => { const next = !c; try { localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch {} return next; });
  };

  // container width (responsive) — re-attach when the body re-mounts after expand
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapsed]);

  // follow the app theme for the minimal basemap
  useEffect(() => {
    const mo = new MutationObserver(() => setTheme(document.documentElement.dataset.theme || "dark"));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  // recenter when a new item is focused or the pin set grows
  const focusKey = focusId ?? "";
  useEffect(() => {
    if (focusId) {
      const m = markers.find(x => x.id === focusId);
      if (m) { setCenter({ lat: m.lat, lng: m.lng }); setZoom(z => Math.max(z, 12)); setActiveId(focusId); setCollapsed(false); }
    } else if (pins.length) {
      const fit = fitBounds(pins, w, height);
      setCenter(fit.center); setZoom(fit.zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, pins.length]);

  const pickStyle = (k) => { setStyle(k); try { localStorage.setItem(STYLE_KEY, k); } catch {} };

  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setCenter(c => {
      const p = latLngToWorld(c, zoom);
      return worldToLatLng({ x: p.x - dx, y: p.y - dy }, zoom);
    });
  };
  const onPointerUp = () => { drag.current = null; };

  const tiles = visibleTiles(center, zoom, w, height);
  const zBtn = {
    width: 30, height: 30, borderRadius: 11, border: "1px solid var(--glass-border)", cursor: "pointer",
    background: "var(--dock-bg)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
    color: T.ink, fontFamily: ff, fontSize: 16, fontWeight: 700, lineHeight: 1,
    boxShadow: "inset 0 1px 0 var(--highlight), 0 4px 14px rgba(0,0,0,0.25)",
  };

  return (
    <div style={{ marginBottom: 14 }}>
      {/* header — tap to expand/collapse */}
      <button onClick={toggleCollapsed} aria-label={collapsed ? "Expand map" : "Collapse map"} style={{
        ...glass({ borderRadius: collapsed ? 18 : "18px 18px 6px 6px" }),
        width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "11px 15px",
        cursor: "pointer", fontFamily: ff, transition: "border-radius .3s",
      }}>
        <span style={{ color: "var(--rose-text-strong)", display: "flex" }}><Icon name="pin" size={15} /></span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>Map</span>
        <span style={{ fontSize: 11, color: T.faint }}>· {pins.length} pin{pins.length === 1 ? "" : "s"}</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: T.faint, display: "flex", transform: collapsed ? "rotate(0)" : "rotate(180deg)", transition: "transform .35s cubic-bezier(.3,1.4,.4,1)" }}>
          <Icon name="chevron" size={16} />
        </span>
      </button>

      {!collapsed && (
    <div ref={boxRef} style={{ ...glass({ borderRadius: "6px 6px 22px 22px" }), overflow: "hidden", height, marginTop: 5, touchAction: "none", userSelect: "none", animation: "rise .3s cubic-bezier(.2,1,.3,1)" }}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      {/* tiles */}
      <div style={{ position: "absolute", inset: 0, cursor: "grab", background: theme === "light" ? "#e8e2ec" : "#171221" }}>
        {tiles.map(t => tileLayers(style, theme, t.tx, t.ty, zoom).map((layer, li) => (
          <img key={`${style}-${theme}-${zoom}-${t.key}-${li}`} src={layer.src} alt=""
            draggable={false}
            style={{ position: "absolute", left: t.left, top: t.top, width: TILE_SIZE, height: TILE_SIZE, opacity: layer.opacity ?? 0.96, mixBlendMode: layer.blend }} />
        )))}
      </div>

      {/* soft vignette so the map sits into the glass */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 40px rgba(0,0,0,0.25), inset 0 1px 0 var(--highlight)", borderRadius: 22 }} />

      {/* markers */}
      {markers.map(m => {
        const pos = markerScreenPos(m, center, zoom, w, height);
        if (pos.x < -40 || pos.x > w + 40 || pos.y < -40 || pos.y > height + 40) return null;
        if (m.kind === "you") {
          return (
            <div key={m.id} style={{ position: "absolute", left: pos.x - 6, top: pos.y - 6, width: 12, height: 12, borderRadius: 999, background: "#7cc8ff", border: "2px solid rgba(255,255,255,0.9)", boxShadow: "0 0 10px rgba(124,200,255,0.8)", pointerEvents: "none" }} />
          );
        }
        const active = m.id === activeId;
        return (
          <div key={m.id} onClick={e => { e.stopPropagation(); setActiveId(active ? null : m.id); onMarkerClick?.(m.id); }}
            onPointerDown={e => e.stopPropagation()}
            style={{ position: "absolute", left: pos.x, top: pos.y, transform: "translate(-50%, -100%)", cursor: "pointer", textAlign: "center", zIndex: active ? 3 : 2 }}>
            {active && (
              <div style={{ ...glass({ borderRadius: 10 }), background: "var(--dropdown-bg)", padding: "5px 10px", marginBottom: 5, fontFamily: ff, fontSize: 11, fontWeight: 700, color: T.ink, whiteSpace: "nowrap", animation: "pop .25s cubic-bezier(.2,1,.3,1)" }}>{m.label}</div>
            )}
            <div style={{
              width: active ? 20 : 15, height: active ? 20 : 15, margin: "0 auto", borderRadius: "50% 50% 50% 4px", transform: "rotate(-45deg)",
              background: "linear-gradient(135deg, #ff7a9c, #b07cff)", border: "2px solid rgba(255,255,255,0.92)",
              boxShadow: "0 3px 10px rgba(0,0,0,0.4), 0 0 14px rgba(255,122,156,0.5)", transition: "width .2s, height .2s",
            }} />
          </div>
        );
      })}

      {/* style switcher */}
      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5 }} onPointerDown={e => e.stopPropagation()}>
        {STYLES.map(s => (
          <button key={s.k} onClick={() => pickStyle(s.k)} style={{
            padding: "5px 11px", borderRadius: 999, cursor: "pointer", fontFamily: ff, fontSize: 10, fontWeight: style === s.k ? 700 : 500,
            color: style === s.k ? "var(--rose-text-strong)" : T.body,
            background: "var(--dock-bg)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            border: style === s.k ? "1px solid rgba(255,122,156,0.35)" : "1px solid var(--glass-border)",
            boxShadow: "inset 0 1px 0 var(--highlight), 0 4px 14px rgba(0,0,0,0.2)", transition: "all .3s",
          }}>{s.l}</button>
        ))}
      </div>

      {/* zoom */}
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 5 }} onPointerDown={e => e.stopPropagation()}>
        <button aria-label="Zoom in" onClick={() => setZoom(z => Math.min(z + 1, 18))} style={zBtn}>+</button>
        <button aria-label="Zoom out" onClick={() => setZoom(z => Math.max(z - 1, 3))} style={zBtn}>−</button>
      </div>

      {/* attribution */}
      <div style={{ position: "absolute", bottom: 6, right: 10, fontFamily: ff, fontSize: 8.5, color: theme === "light" && style !== "minimal" ? "rgba(255,255,255,0.85)" : T.faint, textShadow: style === "satellite" ? "0 1px 3px rgba(0,0,0,0.8)" : "none", pointerEvents: "none" }}>
        {ATTRIBUTION[style]}
      </div>
    </div>
      )}
    </div>
  );
};
export default MapView;
