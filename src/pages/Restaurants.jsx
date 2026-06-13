import { useState } from "react";
import { T, ff, ffd, glass, glassInput, eyebrow, btnPrimary, btnGhost } from "../theme";
import { RESTAURANT_DB, DISTINCTION_BADGE } from "../data/restaurants";
import { filterRestaurants, cuisinesIn, reserveLinks } from "../lib/restaurants";
import { gid, daysUntilExact, fmtDate } from "../lib/utils";
import { suggestRestaurants } from "../lib/suggest";
import { generateEventICS, downloadFile } from "../lib/ics";
import Liquid from "../components/Liquid";
import Reveal from "../components/Reveal";
import Sheet from "../components/Sheet";
import PageHead from "../components/PageHead";
import MapView from "../components/MapView";
import Icon from "../components/Icon";

const pill = (act, tone = "rose") => ({
  padding: "8px 15px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
  fontFamily: ff, fontSize: 12, fontWeight: act ? 700 : 500,
  color: act ? (tone === "champagne" ? "var(--champagne-text)" : "var(--rose-text-strong)") : T.body,
  background: act
    ? (tone === "champagne" ? "rgba(232,197,146,0.12)" : "linear-gradient(145deg, rgba(255,122,156,0.18), rgba(176,124,255,0.12))")
    : "var(--wash-1)",
  border: act
    ? (tone === "champagne" ? "1px solid rgba(232,197,146,0.30)" : "1px solid rgba(255,122,156,0.30)")
    : "1px solid var(--line)",
  boxShadow: "inset 0 1px 0 var(--highlight)", backdropFilter: "blur(12px)", transition: "all .3s",
});

/* Google rating — filled stars + the number, e.g. ★★★★★ (4.7) */
const RatingStars = ({ rating }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }} title={`${rating} on Google`}>
    <span style={{ fontSize: 10.5, letterSpacing: "0.05em" }} aria-hidden="true">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? "#e8c592" : "var(--ghost)" }}>★</span>
      ))}
    </span>
    <span style={{ fontFamily: ff, fontSize: 10.5, color: T.faint, fontWeight: 600 }}>({rating.toFixed(1)})</span>
    <span style={{ fontFamily: ff, fontSize: 9, color: T.ghost }}>Google</span>
  </span>
);

const downloadReservationICS = (resv) => {
  const ics = generateEventICS({
    id: resv.id,
    name: `Dinner at ${resv.restaurant}`,
    date: resv.date,
    time: resv.time ? `${resv.time}:00` : null,
    venue: resv.restaurant,
    city: resv.city,
    url: null,
  });
  downloadFile(ics, `hwhl-reservation-${resv.restaurant.replace(/[^\w]+/g, "-").slice(0, 30)}.ics`, "text/calendar;charset=utf-8");
};

/* ──── RESTAURANTS — MICHELIN-guide date nights ──── */
const Restaurants = ({ d, up }) => {
  const [cuisine, setCuisine] = useState("");
  const [sort, setSort] = useState(d.eventPrefs?.latlong ? "distance" : "rating");
  const [bookingFor, setBookingFor] = useState(null); // restaurant being booked
  const [rf, setRf] = useState({ date: "", time: "19:00", note: "" });
  const [syncedResv, setSyncedResv] = useState(new Set());
  const [pinned, setPinned] = useState([]); // restaurants pinned onto the map
  const [focusPin, setFocusPin] = useState(null);
  const togglePin = (r) => {
    setPinned(p => {
      const has = p.some(x => x.name === r.name);
      setFocusPin(has ? null : r.name);
      return has ? p.filter(x => x.name !== r.name) : [...p, r];
    });
  };

  const [cityInput, setCityInput] = useState(d.eventPrefs?.city || "");
  const setPrefs = (p) => up(x => { x.eventPrefs = { ...(x.eventPrefs || {}), ...p }; });
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => { setCityInput(""); setPrefs({ latlong: `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`, city: "" }); setSort("distance"); },
      () => {},
    );
  };
  const commitCity = (v) => { if (v.trim()) setPrefs({ city: v.trim(), latlong: null }); };

  const latlong = d.eventPrefs?.latlong || null;
  const list = filterRestaurants({ cuisine, latlong, sort: sort === "distance" && !latlong ? "rating" : sort });
  const cuisines = cuisinesIn(RESTAURANT_DB);
  const favs = d.preferences.foods || [];
  const isFav = (r) => favs.some(f => f.toLowerCase() === r.name.toLowerCase());
  const toggleFav = (r) => up(x => {
    const cur = x.preferences.foods;
    x.preferences.foods = cur.some(f => f.toLowerCase() === r.name.toLowerCase())
      ? cur.filter(f => f.toLowerCase() !== r.name.toLowerCase())
      : [...cur, r.name];
  });

  const upcoming = [...(d.reservations || [])].filter(r => daysUntilExact(r.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));

  const saveReservation = () => {
    if (!bookingFor || !rf.date) return;
    const resv = { id: gid(), restaurant: bookingFor.name, city: `${bookingFor.city}, ${bookingFor.state}`, date: rf.date, time: rf.time || null, note: rf.note };
    up(x => { if (!x.reservations) x.reservations = []; x.reservations.push(resv); });
    setTimeout(() => { downloadReservationICS(resv); setSyncedResv(s => new Set([...s, resv.id])); }, 300);
    setBookingFor(null);
  };

  return (
    <div style={{ animation: "rise .55s cubic-bezier(.2,1,.3,1)" }}>
      <PageHead kicker="MICHELIN guide picks" title="Restaurants" />

      <Reveal delay={0.02}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input value={cityInput} onChange={e => setCityInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commitCity(cityInput); }}
            placeholder={latlong ? "Using your location — type a city to override" : "City or postal code…"}
            style={glassInput}
            onFocus={e => { e.target.style.borderColor = "rgba(255,122,156,0.45)"; e.target.style.boxShadow = "inset 0 1px 0 var(--highlight), 0 0 0 3px rgba(255,122,156,0.10)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--input-border)"; e.target.style.boxShadow = "inset 0 1px 0 var(--highlight)"; if (cityInput.trim() && cityInput.trim() !== (d.eventPrefs?.city || "")) commitCity(cityInput); }} />
          <button onClick={useMyLocation} aria-label="Use my location" title="Use my location" style={{ ...btnGhost, padding: "13px 16px", fontSize: 16, ...(latlong ? { border: "1px solid rgba(124,232,182,0.30)", color: T.mintText } : {}) }}>📍</button>
        </div>
      </Reveal>

      {upcoming.length > 0 && (
        <Reveal delay={0.02}>
          <div style={{ ...eyebrow, margin: "0 4px 10px" }}>Your reservations</div>
          {upcoming.map((r, i) => {
            const days = daysUntilExact(r.date);
            return (
              <Reveal key={r.id} delay={0.03 + i * 0.03}>
                <Liquid lift={false} glow={T.champagne} style={{ padding: "13px 15px", marginBottom: 8, borderRadius: 18, ...(days <= 3 ? { border: "1px solid rgba(255,122,156,0.25)" } : {}) }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>🍽️</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: T.ink }}>{r.restaurant}</div>
                      <div style={{ fontFamily: ff, fontSize: 11, color: T.faint, marginTop: 2 }}>{fmtDate(r.date)}{r.time ? ` · ${r.time}` : ""} · {r.city}</div>
                      {days <= 3 && (
                        <div style={{ fontFamily: ff, fontSize: 11.5, color: "var(--rose-soft)", marginTop: 4, fontWeight: 600 }}>
                          💐 {days === 0 ? "Tonight — leave early, arrive unhurried" : days === 1 ? "Tomorrow — confirm the reservation, plan the outfit" : `${days} days out — ${d.preferences.flowers?.[0] ? `order ${d.preferences.flowers[0].toLowerCase()} now` : "order flowers now"}`}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "center", minWidth: 44 }}>
                      <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 18, color: days <= 3 ? "var(--rose-hot)" : "var(--rose-soft)", fontVariantNumeric: "tabular-nums" }}>{days === 0 ? "🥂" : days}</div>
                      <div style={{ fontFamily: ff, fontSize: 8.5, color: T.faint, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>{days === 0 ? "today" : "days"}</div>
                    </div>
                    <button onClick={() => up(x => x.reservations = x.reservations.filter(z => z.id !== r.id))} aria-label="Remove reservation" style={{ background: "none", border: "none", cursor: "pointer", color: T.ghost, fontSize: 14, padding: 3 }}>×</button>
                  </div>
                  <div style={{ marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--line-soft)" }}>
                    <button onClick={() => { downloadReservationICS(r); setSyncedResv(s => new Set([...s, r.id])); }} style={{
                      width: "100%", padding: "7px 10px", borderRadius: 11, cursor: "pointer", fontFamily: ff, fontSize: 10.5, fontWeight: 700, transition: "all .3s",
                      border: "1px solid " + (syncedResv.has(r.id) ? "rgba(124,232,182,0.25)" : "var(--line-soft)"),
                      background: syncedResv.has(r.id) ? "rgba(124,232,182,0.07)" : "var(--wash-0)",
                      color: syncedResv.has(r.id) ? T.mintText : T.faint, boxShadow: "inset 0 1px 0 var(--highlight)",
                    }}>{syncedResv.has(r.id) ? "Added to calendar ✓" : "Add to calendar"}</button>
                  </div>
                </Liquid>
              </Reveal>
            );
          })}
          <div style={{ height: 10 }} />
        </Reveal>
      )}

      {pinned.length > 0 && (
        <Reveal delay={0.02}>
          <MapView
            markers={[
              ...pinned.map(r => ({ id: r.name, lat: r.lat, lng: r.lng, label: r.name })),
              ...(latlong ? [{ id: "you", kind: "you", lat: Number(latlong.split(",")[0]), lng: Number(latlong.split(",")[1]), label: "You" }] : []),
            ]}
            focusId={focusPin}
            height={240}
          />
        </Reveal>
      )}

      {(() => {
        const picks = suggestRestaurants(d, 3);
        return picks.length > 0 && (
          <Reveal delay={0.025}>
            <Liquid lift={false} glow={T.champagne} style={{ padding: "16px 18px", marginBottom: 12, borderRadius: 20 }}>
              <div style={{ ...eyebrow, color: "var(--champagne-text)", marginBottom: 10 }}>{latlong || d.eventPrefs?.city ? "Tonight's top 3 near you" : "Top picks — set a location for nearby"}</div>
              <div style={{ fontFamily: ff, fontSize: 13, color: T.body, lineHeight: 2 }}>
                {picks.map(r => (
                  <div key={r.name} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ color: T.ink, fontWeight: 600 }}>{r.name}</span>
                    <span style={{ fontSize: 10.5, color: "var(--champagne-text)" }}>MICHELIN {r.distinction}</span>
                    <span style={{ fontSize: 10.5, color: T.faint }}>★ {r.rating.toFixed(1)}</span>
                    <span style={{ fontSize: 11, color: T.faint, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.why}{r.miles != null ? ` · ${Math.round(r.miles)} mi` : ""}
                    </span>
                    <button onClick={() => { setBookingFor(r); setRf({ date: "", time: "19:00", note: "" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.mintText, fontFamily: ff, fontSize: 11, fontWeight: 700, padding: 0 }}>Book →</button>
                  </div>
                ))}
              </div>
            </Liquid>
          </Reveal>
        );
      })()}

      <Reveal delay={0.05}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10, paddingBottom: 4, scrollbarWidth: "none" }}>
          <button onClick={() => setCuisine("")} style={pill(cuisine === "")}>All cuisines</button>
          {cuisines.map(c => (
            <button key={c} onClick={() => setCuisine(c === cuisine ? "" : c)} style={pill(cuisine === c)}>{c}</button>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.07}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
          <span style={{ ...eyebrow, fontSize: 9.5, marginRight: 2 }}>Sort</span>
          {[{ k: "distance", l: "Near me", off: !latlong }, { k: "rating", l: "Stars" }, { k: "name", l: "A–Z" }].map(s => (
            <button key={s.k} onClick={() => !s.off && setSort(s.k)} disabled={s.off}
              style={{ ...pill(sort === s.k && !s.off, "champagne"), padding: "6px 12px", fontSize: 11, opacity: s.off ? 0.35 : 1, cursor: s.off ? "default" : "pointer" }}>{s.l}</button>
          ))}
          {!latlong && <span style={{ fontFamily: ff, fontSize: 10, color: T.faint }}>use location above for distance sort</span>}
        </div>
      </Reveal>

      {list.map((r, i) => {
        const links = reserveLinks(r);
        return (
          <Reveal key={r.name} delay={0.05 + Math.min(i, 8) * 0.035}>
            <Liquid glow={T.champagne} style={{ padding: "15px 17px", marginBottom: 9, borderRadius: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: ff, fontWeight: 700, fontSize: 14.5, color: T.ink, letterSpacing: "-0.01em" }}>{r.name}</span>
                    <span title={`MICHELIN Guide ${r.distinction}`} style={{ fontSize: 10, color: "var(--champagne-text)", fontFamily: ff, fontWeight: 700, background: "rgba(232,197,146,0.10)", border: "1px solid rgba(232,197,146,0.22)", padding: "2px 9px", borderRadius: 999, letterSpacing: "0.06em" }}>MICHELIN {DISTINCTION_BADGE[r.distinction]} {r.distinction}</span>
                  </div>
                  <div style={{ fontFamily: ff, fontSize: 11.5, color: T.faint, marginTop: 4 }}>
                    {r.cuisine} · {"$".repeat(r.price)} · {r.city}, {r.state}{r.miles != null && <span style={{ color: "var(--violet-text)", fontWeight: 600 }}> · {r.miles < 100 ? r.miles.toFixed(0) : Math.round(r.miles)} mi</span>}
                  </div>
                  <div style={{ marginTop: 5 }}><RatingStars rating={r.rating} /></div>
                </div>
                <button onClick={() => togglePin(r)} aria-label={pinned.some(x => x.name === r.name) ? "Remove map pin" : "Pin on map"} title="Pin on map"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: pinned.some(x => x.name === r.name) ? "var(--rose-text-strong)" : T.ghost, transition: "color .25s" }}>
                  <Icon name="pin" size={17} />
                </button>
                <button onClick={() => toggleFav(r)} aria-label={isFav(r) ? "Remove from favorites" : "Save to her favorites"} title="Saves to Preferences → Foods" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 2, filter: isFav(r) ? "none" : "grayscale(1) opacity(0.45)", transition: "filter .25s" }}>❤️</button>
              </div>
              <div style={{ display: "flex", gap: 7, marginTop: 12, paddingTop: 11, borderTop: "1px solid var(--line-soft)" }}>
                <button onClick={() => window.open(links.opentable, "_blank", "noopener,noreferrer")} style={{ ...btnPrimary(T.gradWarm), flex: 1, padding: "8px 10px", fontSize: 11.5 }}>OpenTable</button>
                <button onClick={() => window.open(links.resy, "_blank", "noopener,noreferrer")} style={{ ...btnGhost, flex: 1, padding: "8px 10px", fontSize: 11, textAlign: "center" }}>Resy</button>
                <button onClick={() => window.open(links.michelin, "_blank", "noopener,noreferrer")} style={{ ...btnGhost, flex: 1, padding: "8px 10px", fontSize: 11, textAlign: "center" }}>Guide</button>
                <button onClick={() => { setBookingFor(r); setRf({ date: "", time: "19:00", note: "" }); }} style={{ ...btnGhost, flex: 1, padding: "8px 10px", fontSize: 11, textAlign: "center", color: T.mintText, fontWeight: 700 }}>I booked it</button>
              </div>
            </Liquid>
          </Reveal>
        );
      })}

      <Reveal delay={0.4}>
        <div style={{ fontFamily: ff, fontSize: 10.5, color: T.faint, lineHeight: 1.6, margin: "14px 4px 0" }}>
          Stars on badges are MICHELIN Guide distinctions; ★ ratings are Google review scores (curated snapshot — tap Guide to verify current status). Booking happens on OpenTable/Resy; log it here for countdown reminders and tips.
        </div>
      </Reveal>

      <Sheet open={!!bookingFor} onClose={() => setBookingFor(null)}>
        <h3 style={{ fontSize: 21, fontFamily: ffd, fontStyle: "italic", fontWeight: 400, color: T.ink, margin: "0 0 6px" }}>Reservation at {bookingFor?.name}</h3>
        <div style={{ fontFamily: ff, fontSize: 12, color: T.faint, marginBottom: 16 }}>You'll get reminders 3 days out (flowers), the day before (confirm), and day-of.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" value={rf.date} onChange={e => setRf({ ...rf, date: e.target.value })} style={{ ...glassInput, colorScheme: "dark" }} />
            <input type="time" value={rf.time} onChange={e => setRf({ ...rf, time: e.target.value })} style={{ ...glassInput, width: 130, flex: "none", colorScheme: "dark" }} />
          </div>
          <input value={rf.note} onChange={e => setRf({ ...rf, note: e.target.value })} placeholder="Notes — occasion, table request…" style={glassInput} />
          <button onClick={saveReservation} style={{ ...btnPrimary(T.gradWarm), padding: 15, opacity: rf.date ? 1 : 0.4 }}>Save · add to calendar</button>
        </div>
      </Sheet>
    </div>
  );
};
export default Restaurants;
