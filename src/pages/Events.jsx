import { useCallback, useEffect, useRef, useState } from "react";
import { T, ff, glass, glassInput, eyebrow, btnPrimary, btnGhost } from "../theme";
import { hasAnyKey, searchEvents, searchArtists, eventsForFollowed } from "../lib/eventProvider";
import { daysUntilExact, isPostalCode } from "../lib/utils";
import { rankEventSuggestions } from "../lib/suggest";
import { downloadEventICS } from "../lib/ics";
import Liquid from "../components/Liquid";
import Reveal from "../components/Reveal";
import PageHead from "../components/PageHead";
import MapView from "../components/MapView";
import Icon from "../components/Icon";

const CATEGORIES = [
  { k: "", l: "All" },
  { k: "music", l: "Music" },
  { k: "comedy", l: "Comedy" },
  { k: "theatre", l: "Theater" },
  { k: "sports", l: "Sports" },
  { k: "family", l: "Family" },
  { k: "arts", l: "Arts" },
];
const RADII = [10, 25, 50, 100];

/* shared pill style — identical to the Discover deck chips */
const pill = (act, tone = "rose") => ({
  padding: "9px 17px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
  fontFamily: ff, fontSize: 12.5, fontWeight: act ? 700 : 500,
  color: act ? (tone === "champagne" ? "var(--champagne-text)" : "var(--rose-text-strong)") : T.body,
  background: act
    ? (tone === "champagne" ? "rgba(232,197,146,0.12)" : "linear-gradient(145deg, rgba(255,122,156,0.18), rgba(176,124,255,0.12))")
    : "var(--wash-1)",
  border: act
    ? (tone === "champagne" ? "1px solid rgba(232,197,146,0.30)" : "1px solid rgba(255,122,156,0.30)")
    : "1px solid var(--line)",
  boxShadow: act ? "inset 0 1px 0 var(--highlight)" : "inset 0 1px 0 var(--wash-1)",
  backdropFilter: "blur(12px)", transition: "all .3s",
});

const fmtEventDate = (e) => {
  if (!e.date) return "Date TBA";
  const d = new Date(e.date + "T00:00:00");
  const ds = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}) });
  if (!e.time || e.tba) return ds;
  const [h, m] = e.time.split(":").map(Number);
  const t = new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${ds} · ${t}`;
};

const fmtPrice = (e) => {
  if (e.priceMin == null) return null;
  const f = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
  return e.priceMin === e.priceMax || e.priceMax == null ? `from ${f(e.priceMin)}` : `${f(e.priceMin)} – ${f(e.priceMax)}`;
};

/* friendly inline status — never a blank panel */
const StatusNote = ({ emoji, title, sub }) => (
  <Reveal>
    <Liquid lift={false} style={{ padding: "40px 22px", textAlign: "center" }}>
      <div style={{ fontSize: 38, marginBottom: 12, opacity: 0.65 }}>{emoji}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: T.body, fontFamily: ff }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: T.faint, fontFamily: ff, marginTop: 6, lineHeight: 1.6 }}>{sub}</div>}
    </Liquid>
  </Reveal>
);

const STATUS_NOTES = {
  bad_key: { emoji: "🔑", title: "Event API key needed", sub: "Two free options: Ticketmaster (developer.ticketmaster.com → VITE_TM_API_KEY) or SeatGeek, issued instantly with no approval (seatgeek.com/account/develop → VITE_SEATGEEK_CLIENT_ID). Paste either into .env.local and restart the dev server." },
  rate_limit: { emoji: "🐢", title: "Slow down a sec", sub: "Hit the API rate limit — give it a moment and try again." },
  error: { emoji: "📡", title: "Couldn't reach Ticketmaster", sub: "Check your connection and try again." },
  empty: { emoji: "🌒", title: "Nothing found nearby", sub: "Widen the radius or try a different category." },
  geo_denied: { emoji: "📍", title: "Location unavailable", sub: "Location access was denied — type a city or postal code instead." },
  no_location: { emoji: "🗺️", title: "Where should we look?", sub: "Type a city or postal code, or tap the location button." },
};

const EventCard = ({ e, i, saved, onToggleSave, isPinned, onTogglePin }) => (
  <Reveal delay={0.04 + Math.min(i, 8) * 0.04}>
    <Liquid glow={T.violet} style={{ marginBottom: 12, borderRadius: 22, overflow: "hidden" }}>
      {e.image && (
        <div style={{ margin: "-1px -1px 0", height: 132, overflow: "hidden", borderRadius: "22px 22px 0 0" }}>
          <img src={e.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(1.05)" }} />
        </div>
      )}
      <div style={{ padding: "14px 16px 15px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 14.5, color: T.ink, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{e.name}</div>
            <div style={{ fontFamily: ff, fontSize: 11.5, color: T.faint, marginTop: 3 }}>{e.venue}{e.city ? ` · ${e.city}` : ""}</div>
            <div style={{ fontFamily: ff, fontSize: 12, color: "var(--violet-text)", marginTop: 4, fontWeight: 600 }}>{fmtEventDate(e)}</div>
          </div>
          {e.lat != null && onTogglePin && (
            <button onClick={() => onTogglePin(e)} aria-label={isPinned ? "Remove map pin" : "Pin on map"} title="Pin on map"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: isPinned ? "var(--rose-text-strong)" : T.ghost, transition: "color .25s" }}>
              <Icon name="pin" size={17} />
            </button>
          )}
          <button onClick={() => onToggleSave(e)} aria-label={saved ? "Unsave event" : "Save event"} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 19, padding: 2, filter: saved ? "none" : "grayscale(1) opacity(0.45)", transition: "filter .25s, transform .25s", transform: saved ? "scale(1.1)" : "scale(1)" }}>❤️</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
          {e.genre && <span style={{ fontSize: 9.5, color: "var(--champagne-text)", fontFamily: ff, fontWeight: 600, background: "rgba(232,197,146,0.10)", border: "1px solid rgba(232,197,146,0.22)", padding: "3px 10px", borderRadius: 999 }}>{e.genre}</span>}
          {fmtPrice(e) && <span style={{ fontSize: 10.5, color: T.mintText, fontFamily: ff, fontWeight: 700 }}>{fmtPrice(e)}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 11, borderTop: "1px solid var(--line-soft)" }}>
          {e.url && (
            <button onClick={() => window.open(e.url, "_blank", "noopener,noreferrer")} style={{ ...btnPrimary(T.gradCool), flex: 1, padding: "9px 12px", fontSize: 12, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 28px rgba(176,124,255,0.30)" }}>Tickets</button>
          )}
          {e.date && (
            <button onClick={() => downloadEventICS(e)} style={{ ...btnGhost, flex: 1, padding: "9px 12px", fontSize: 11.5, textAlign: "center" }}>Add to calendar</button>
          )}
        </div>
      </div>
    </Liquid>
  </Reveal>
);

/* ──── EVENTS — live discovery via Ticketmaster ──── */
const Events = ({ d, up, initialView }) => {
  const [view, setView] = useState(initialView || "discover"); // discover | followed | saved
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle|loading|ok|empty|error|bad_key|rate_limit|geo_denied|no_location
  const [cityInput, setCityInput] = useState(d.eventPrefs?.city || "");
  const [artistQuery, setArtistQuery] = useState("");
  const [artistResults, setArtistResults] = useState([]);
  const [artistStatus, setArtistStatus] = useState("idle");
  const [followedEvents, setFollowedEvents] = useState([]);
  const [followedStatus, setFollowedStatus] = useState("idle");
  const debounceRef = useRef(null);
  const artistDebounceRef = useRef(null);
  const [pinnedEvents, setPinnedEvents] = useState([]); // events pinned onto the map
  const [focusPin, setFocusPin] = useState(null);
  const togglePinEvent = (e) => {
    setPinnedEvents(p => {
      const has = p.some(x => x.id === e.id);
      setFocusPin(has ? null : e.id);
      return has ? p.filter(x => x.id !== e.id) : [...p, e];
    });
  };
  const isPinned = (e) => pinnedEvents.some(x => x.id === e.id);

  const prefs = { city: "", latlong: null, radius: 25, category: "", sort: "date,asc", ...(d.eventPrefs || {}) };
  const setPrefs = (p) => up(x => { x.eventPrefs = { ...prefs, ...p }; });
  const followed = d.followedArtists || [];
  const savedEvents = d.savedEvents || [];
  const isSaved = (e) => savedEvents.some(s => s.id === e.id);

  const toggleSave = (e) => up(x => {
    const cur = x.savedEvents || [];
    x.savedEvents = cur.some(s => s.id === e.id) ? cur.filter(s => s.id !== e.id) : [...cur, e];
  });
  const toggleFollow = (artist) => up(x => {
    const cur = x.followedArtists || [];
    const exists = cur.some(a => a.id === artist.id);
    x.followedArtists = exists ? cur.filter(a => a.id !== artist.id) : [...cur, artist];
    // keep the profile in sync: a followed artist IS a musician preference
    if (!exists && !x.preferences.musicians.some(m => m.toLowerCase() === artist.name.toLowerCase())) {
      x.preferences.musicians.push(artist.name);
    }
  });

  const useMyLocation = () => {
    if (!navigator.geolocation) { setStatus("geo_denied"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setCityInput(""); setPrefs({ latlong: `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`, city: "" }); },
      () => setStatus("geo_denied"),
    );
  };

  /* discover search — debounced ≥400ms, cached in the client layer */
  const hasLocation = !!(prefs.latlong || prefs.city);
  const runSearch = useCallback(() => {
    clearTimeout(debounceRef.current);
    if (!hasAnyKey()) { setStatus("bad_key"); return; }
    if (!hasLocation && !query.trim()) { setStatus("no_location"); return; }
    debounceRef.current = setTimeout(async () => {
      setStatus("loading");
      try {
        const loc = prefs.latlong ? { latlong: prefs.latlong, radius: prefs.radius } : prefs.city ? { city: prefs.city } : {};
        const sort = prefs.sort === "distance,asc" && !prefs.latlong ? "date,asc" : prefs.sort;
        const { events } = await searchEvents({ ...loc, sort, classificationName: prefs.category || undefined, keyword: query.trim() || undefined });
        setResults(events);
        setStatus(events.length ? "ok" : "empty");
      } catch (err) {
        setStatus(STATUS_NOTES[err.message] ? err.message : "error");
      }
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.latlong, prefs.city, prefs.radius, prefs.category, prefs.sort, query]);

  useEffect(() => { if (view === "discover") runSearch(); return () => clearTimeout(debounceRef.current); }, [view, runSearch]);

  /* artist search — same debounce discipline */
  useEffect(() => {
    clearTimeout(artistDebounceRef.current);
    if (!artistQuery.trim()) { setArtistResults([]); setArtistStatus("idle"); return; }
    if (!hasAnyKey()) { setArtistStatus("bad_key"); return; }
    artistDebounceRef.current = setTimeout(async () => {
      setArtistStatus("loading");
      try {
        const artists = await searchArtists(artistQuery.trim());
        setArtistResults(artists);
        setArtistStatus(artists.length ? "ok" : "empty");
      } catch (err) {
        setArtistStatus(STATUS_NOTES[err.message] ? err.message : "error");
      }
    }, 400);
    return () => clearTimeout(artistDebounceRef.current);
  }, [artistQuery]);

  /* followed artists' tour dates */
  useEffect(() => {
    if (view !== "followed" || followed.length === 0) return;
    if (!hasAnyKey()) { setFollowedStatus("bad_key"); return; }
    let alive = true;
    setFollowedStatus("loading");
    eventsForFollowed(followed)
      .then(evts => { if (alive) { setFollowedEvents(evts); setFollowedStatus(evts.length ? "ok" : "empty"); } })
      .catch(() => { if (alive) setFollowedStatus("error"); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, followed.map(a => a.id).join(",")]);

  const commitCity = (v) => { setPrefs({ city: v.trim(), latlong: null }); };

  const sortedSaved = [...savedEvents].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  const pastCount = sortedSaved.filter(e => e.date && daysUntilExact(e.date) < 0).length;

  return (
    <div style={{ animation: "rise .55s cubic-bezier(.2,1,.3,1)" }}>
      <PageHead kicker="Live nearby" title="Events" />

      {/* sub-tabs */}
      <div style={{ display: "flex", gap: 7, marginBottom: 18 }}>
        {[{ k: "discover", l: "Discover" }, { k: "followed", l: `Followed${followed.length ? ` · ${followed.length}` : ""}` }, { k: "saved", l: `Saved${savedEvents.length ? ` · ${savedEvents.length}` : ""}` }].map(t => (
          <button key={t.k} onClick={() => setView(t.k)} style={pill(view === t.k)}>{t.l}</button>
        ))}
      </div>

      {pinnedEvents.length > 0 && (
        <Reveal delay={0.02}>
          <MapView
            markers={[
              ...pinnedEvents.map(e => ({ id: e.id, lat: e.lat, lng: e.lng, label: e.name })),
              ...(prefs.latlong ? [{ id: "you", kind: "you", lat: Number(prefs.latlong.split(",")[0]), lng: Number(prefs.latlong.split(",")[1]), label: "You" }] : []),
            ]}
            focusId={focusPin}
            height={240}
          />
        </Reveal>
      )}

      {view === "discover" && (
        <>
          <Reveal delay={0.03}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={cityInput} onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") commitCity(cityInput); }}
                onBlur={() => { if (cityInput.trim() !== prefs.city) commitCity(cityInput); }}
                placeholder={prefs.latlong ? "Using your location — type a city to override" : "City or postal code…"}
                style={glassInput}
                onFocus={e => { e.target.style.borderColor = "rgba(255,122,156,0.45)"; e.target.style.boxShadow = "inset 0 1px 0 var(--highlight), 0 0 0 3px rgba(255,122,156,0.10)"; }} />
              <button onClick={useMyLocation} aria-label="Use my location" title="Use my location" style={{ ...btnGhost, padding: "13px 16px", fontSize: 16, ...(prefs.latlong ? { border: "1px solid rgba(124,232,182,0.30)", color: T.mintText } : {}) }}>📍</button>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search artists, shows, venues…" style={{ ...glassInput, marginBottom: 12 }}
              onFocus={e => { e.target.style.borderColor = "rgba(255,122,156,0.45)"; e.target.style.boxShadow = "inset 0 1px 0 var(--highlight), 0 0 0 3px rgba(255,122,156,0.10)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--line-strong)"; e.target.style.boxShadow = "inset 0 1px 0 var(--highlight)"; }} />
          </Reveal>
          <Reveal delay={0.07}>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10, paddingBottom: 4, scrollbarWidth: "none" }}>
              {CATEGORIES.map(c => (
                <button key={c.k} onClick={() => setPrefs({ category: c.k })} style={{ ...pill(prefs.category === c.k), padding: "7px 14px", fontSize: 11.5 }}>{c.l}</button>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.09}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
              <span style={{ ...eyebrow, fontSize: 9.5, marginRight: 2 }}>Within</span>
              {RADII.map(r => {
                const radiusOn = !!prefs.latlong || isPostalCode(prefs.city || "");
                return (
                  <button key={r} onClick={() => setPrefs({ radius: r })} disabled={!radiusOn}
                    style={{ ...pill(prefs.radius === r && radiusOn, "champagne"), padding: "6px 12px", fontSize: 11, opacity: radiusOn ? 1 : 0.35, cursor: radiusOn ? "pointer" : "default" }}>{r} mi</button>
                );
              })}
              <span style={{ flex: 1 }} />
              <span style={{ ...eyebrow, fontSize: 9.5, marginRight: 2 }}>Sort</span>
              {[{ k: "date,asc", l: "Date" }, { k: "distance,asc", l: "Distance" }].map(s => (
                <button key={s.k} onClick={() => setPrefs({ sort: s.k })} disabled={s.k === "distance,asc" && !prefs.latlong}
                  style={{ ...pill(prefs.sort === s.k, "champagne"), padding: "6px 12px", fontSize: 11, opacity: s.k === "distance,asc" && !prefs.latlong ? 0.35 : 1, cursor: s.k === "distance,asc" && !prefs.latlong ? "default" : "pointer" }}>{s.l}</button>
              ))}
            </div>
          </Reveal>

          {status === "loading" && (
            <Reveal><div style={{ display: "flex", justifyContent: "center", padding: "44px 0" }}>
              <div style={{ width: 46, height: 46, borderRadius: 16, ...glass({ borderRadius: 16 }), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, animation: "breathe 1.6s ease-in-out infinite" }}>🎟️</div>
            </div></Reveal>
          )}
          {STATUS_NOTES[status] && <StatusNote {...STATUS_NOTES[status]} />}
          {status === "ok" && (() => {
            const picks = rankEventSuggestions(results, d, 3);
            return picks.length > 0 && (
              <Reveal delay={0.02}>
                <Liquid lift={false} glow={T.violet} style={{ padding: "15px 18px", marginBottom: 14, borderRadius: 20 }}>
                  <div style={{ ...eyebrow, color: "var(--violet-text)", marginBottom: 9 }}>Top picks for you two</div>
                  <div style={{ fontFamily: ff, fontSize: 13, color: T.body, lineHeight: 2 }}>
                    {picks.map(e => (
                      <div key={e.id} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ color: T.ink, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>{e.name}</span>
                        <span style={{ fontSize: 11, color: T.faint, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmtEventDate(e)}</span>
                        {e.url && <button onClick={() => window.open(e.url, "_blank", "noopener,noreferrer")} style={{ background: "none", border: "none", cursor: "pointer", color: T.mintText, fontFamily: ff, fontSize: 11, fontWeight: 700, padding: 0 }}>Tickets →</button>}
                      </div>
                    ))}
                  </div>
                </Liquid>
              </Reveal>
            );
          })()}
          {status === "ok" && results.map((e, i) => (
            <EventCard key={e.id} e={e} i={i} saved={isSaved(e)} onToggleSave={toggleSave} isPinned={isPinned(e)} onTogglePin={togglePinEvent} />
          ))}
        </>
      )}

      {view === "followed" && (
        <>
          <Reveal delay={0.03}>
            <input value={artistQuery} onChange={e => setArtistQuery(e.target.value)} placeholder="Search artists to follow…" style={{ ...glassInput, marginBottom: 12 }}
              onFocus={e => { e.target.style.borderColor = "rgba(255,122,156,0.45)"; e.target.style.boxShadow = "inset 0 1px 0 var(--highlight), 0 0 0 3px rgba(255,122,156,0.10)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--line-strong)"; e.target.style.boxShadow = "inset 0 1px 0 var(--highlight)"; }} />
          </Reveal>

          {artistStatus === "loading" && <div style={{ fontFamily: ff, fontSize: 12, color: T.faint, margin: "0 4px 12px" }}>Searching…</div>}
          {artistStatus === "bad_key" && <StatusNote {...STATUS_NOTES.bad_key} />}
          {artistStatus === "ok" && artistResults.map((a, i) => {
            const isFollowed = followed.some(f => f.id === a.id);
            return (
              <Reveal key={a.id} delay={i * 0.03}>
                <Liquid lift={false} style={{ padding: "11px 14px", marginBottom: 7, borderRadius: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {a.imageUrl
                      ? <img src={a.imageUrl} alt="" style={{ width: 38, height: 38, borderRadius: 13, objectFit: "cover", flexShrink: 0 }} />
                      : <div style={{ width: 38, height: 38, borderRadius: 13, ...glass({ borderRadius: 13 }), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🎤</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                      {a.genre && <div style={{ fontFamily: ff, fontSize: 11, color: T.faint, marginTop: 1 }}>{a.genre}</div>}
                    </div>
                    <button onClick={() => toggleFollow(a)} style={{
                      padding: "6px 14px", borderRadius: 999, cursor: "pointer", fontFamily: ff, fontSize: 11, fontWeight: 700, transition: "all .3s",
                      border: "1px solid " + (isFollowed ? "rgba(124,232,182,0.3)" : "rgba(255,122,156,0.30)"),
                      background: isFollowed ? "rgba(124,232,182,0.10)" : "linear-gradient(145deg, rgba(255,122,156,0.18), rgba(176,124,255,0.12))",
                      color: isFollowed ? T.mintText : "var(--rose-text-strong)", boxShadow: "inset 0 1px 0 var(--highlight)",
                    }}>{isFollowed ? "Following ✓" : "+ Follow"}</button>
                  </div>
                </Liquid>
              </Reveal>
            );
          })}

          {followed.length > 0 && (
            <Reveal delay={0.06}>
              <div style={{ ...eyebrow, margin: "16px 4px 10px" }}>Following</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {followed.map(a => (
                  <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 7px", borderRadius: 999, background: "rgba(255,122,156,0.08)", border: "1px solid rgba(255,122,156,0.20)", boxShadow: "inset 0 1px 0 var(--highlight)", color: "var(--rose-text)", fontSize: 12.5, fontWeight: 500, fontFamily: ff, animation: "pop .3s cubic-bezier(.2,1,.3,1)" }}>
                    {a.imageUrl ? <img src={a.imageUrl} alt="" style={{ width: 22, height: 22, borderRadius: 999, objectFit: "cover" }} /> : <span style={{ fontSize: 13 }}>🎤</span>}
                    {a.name}
                    <button onClick={() => toggleFollow(a)} aria-label={`Unfollow ${a.name}`} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rose-text)", opacity: 0.5, padding: 0, fontSize: 15, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            </Reveal>
          )}

          {followed.length === 0 ? (
            artistStatus === "idle" && <StatusNote emoji="🎤" title="No artists followed yet" sub="Search above for the artists they love — their tour dates will show up here." />
          ) : (
            <>
              <div style={{ ...eyebrow, margin: "0 4px 10px" }}>Upcoming shows</div>
              {followedStatus === "loading" && <div style={{ fontFamily: ff, fontSize: 12, color: T.faint, margin: "0 4px 12px" }}>Checking tour dates…</div>}
              {followedStatus === "empty" && <StatusNote emoji="🌒" title="No upcoming shows" sub="None of your followed artists have announced dates yet." />}
              {(followedStatus === "error" || followedStatus === "bad_key") && <StatusNote {...STATUS_NOTES[followedStatus === "bad_key" ? "bad_key" : "error"]} />}
              {followedStatus === "ok" && followedEvents.map((e, i) => (
                <EventCard key={e.id} e={e} i={i} saved={isSaved(e)} onToggleSave={toggleSave} isPinned={isPinned(e)} onTogglePin={togglePinEvent} />
              ))}
            </>
          )}
        </>
      )}

      {view === "saved" && (
        sortedSaved.length === 0 ? (
          <StatusNote emoji="❤️" title="No saved events" sub="Heart an event in Discover or Followed and it'll live here." />
        ) : (
          <>
            {pastCount > 0 && (
              <Reveal>
                <button onClick={() => up(x => { x.savedEvents = (x.savedEvents || []).filter(e => !e.date || daysUntilExact(e.date) >= 0); })}
                  style={{ ...btnGhost, width: "100%", marginBottom: 12, fontSize: 12 }}>Clear {pastCount} past event{pastCount === 1 ? "" : "s"}</button>
              </Reveal>
            )}
            {sortedSaved.map((e, i) => {
              const days = e.date ? daysUntilExact(e.date) : null;
              const passed = days !== null && days < 0;
              return (
                <Reveal key={e.id} delay={0.03 + Math.min(i, 8) * 0.04}>
                  <Liquid lift={false} style={{ padding: "13px 15px", marginBottom: 8, borderRadius: 18, opacity: passed ? 0.45 : 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {e.image
                        ? <img src={e.image} alt="" style={{ width: 44, height: 44, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} />
                        : <div style={{ width: 44, height: 44, borderRadius: 14, ...glass({ borderRadius: 14 }), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎟️</div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: passed ? "line-through" : "none" }}>{e.name}</div>
                        <div style={{ fontFamily: ff, fontSize: 11, color: T.faint, marginTop: 2 }}>{e.venue}{e.city ? ` · ${e.city}` : ""} · {fmtEventDate(e)}</div>
                      </div>
                      <div style={{ textAlign: "center", minWidth: 52 }}>
                        {days === null ? (
                          <span style={{ fontFamily: ff, fontSize: 10, color: T.faint, fontWeight: 600 }}>TBA</span>
                        ) : passed ? (
                          <span style={{ fontFamily: ff, fontSize: 10, color: T.ghost, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Passed</span>
                        ) : (
                          <>
                            <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 19, color: days <= 7 ? "var(--rose-hot)" : "var(--rose-soft)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{days === 0 ? "🎉" : days}</div>
                            <div style={{ fontFamily: ff, fontSize: 8.5, color: T.faint, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>{days === 0 ? "today" : "days"}</div>
                          </>
                        )}
                      </div>
                      {e.lat != null && (
                        <button onClick={() => togglePinEvent(e)} aria-label={isPinned(e) ? "Remove map pin" : "Pin on map"} title="Pin on map"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: isPinned(e) ? "var(--rose-text-strong)" : T.ghost, transition: "color .25s" }}>
                          <Icon name="pin" size={15} />
                        </button>
                      )}
                      <button onClick={() => toggleSave(e)} aria-label="Remove saved event" style={{ background: "none", border: "none", cursor: "pointer", color: T.ghost, fontSize: 14, padding: 3 }}>×</button>
                    </div>
                    {!passed && e.date && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line-soft)" }}>
                        {e.url && <button onClick={() => window.open(e.url, "_blank", "noopener,noreferrer")} style={{ ...btnGhost, flex: 1, padding: "7px 10px", fontSize: 11, textAlign: "center" }}>Tickets</button>}
                        <button onClick={() => downloadEventICS(e)} style={{ ...btnGhost, flex: 1, padding: "7px 10px", fontSize: 11, textAlign: "center", color: T.mintText }}>Add to calendar</button>
                      </div>
                    )}
                  </Liquid>
                </Reveal>
              );
            })}
          </>
        )
      )}
    </div>
  );
};
export default Events;
