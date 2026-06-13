import { useCallback, useEffect, useRef, useState } from "react";
import { T, ff, ffd, glass, glassInput, btnPrimary, btnGhost, GLOBAL_CSS } from "./theme";
import { FLASHCARDS } from "./data/flashcards";
import { startNotificationLoop } from "./lib/notifications";
import { weeklyThree, liveStreak } from "./lib/weekly";
import { shuffled } from "./lib/utils";
import { hasSupabase, signInEmail, signUpEmail, signInGoogle } from "./lib/couple";
import useAppData from "./hooks/useAppData";
import useCoupleSync from "./hooks/useCoupleSync";
import Aurora from "./components/Aurora";
import Dock from "./components/Dock";
import Liquid from "./components/Liquid";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Brands from "./pages/Brands";
import Preferences from "./pages/Preferences";
import Dates from "./pages/Dates";
import Gifts from "./pages/Gifts";
import Reminders from "./pages/Reminders";
import Settings from "./pages/Settings";
import Events from "./pages/Events";
import Restaurants from "./pages/Restaurants";

const WELCOME_KEY = "hwhl-welcome-done";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
);

const WelcomeOverlay = ({ onDone, onGoSettings }) => {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const run = async (fn, okMsg) => {
    setBusy(true); setMsg(null);
    try { await fn(); if (okMsg) setMsg({ ok: true, text: okMsg }); onDone(); }
    catch (e) { setMsg({ ok: false, text: e.message || "Something went wrong" }); }
    setBusy(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(11,7,16,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", padding: 18, animation: "rise .55s cubic-bezier(.2,1,.3,1)" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>💕</div>
          <h1 style={{ fontFamily: ffd, fontStyle: "italic", fontSize: 28, color: T.ink, margin: "0 0 6px" }}>Happy Wife Happy Life</h1>
          <p style={{ fontFamily: ff, fontSize: 13, color: T.faint, margin: 0, lineHeight: 1.5 }}>Sign in to sync with your partner, or skip to start solo.</p>
        </div>
        <Liquid lift={false} style={{ padding: 20, borderRadius: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" autoComplete="email" style={glassInput} />
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" autoComplete={mode === "signin" ? "current-password" : "new-password"} style={glassInput} />
            <button disabled={busy || !email || pw.length < 6} onClick={() => run(async () => {
              const { error } = mode === "signin" ? await signInEmail(email, pw) : await signUpEmail(email, pw);
              if (error) throw error;
            }, mode === "signup" ? "Check your email to confirm" : null)}
              style={{ ...btnPrimary(), padding: 13, opacity: busy || !email || pw.length < 6 ? 0.5 : 1 }}>
              {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
            <button disabled={busy} onClick={() => run(async () => { const { error } = await signInGoogle(); if (error) throw error; })}
              style={{ ...btnGhost, padding: 12, textAlign: "center", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <GoogleIcon /> Continue with Google
            </button>
            <button onClick={() => { setMode(m => m === "signin" ? "signup" : "signin"); setMsg(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.faint, fontFamily: ff, fontSize: 12 }}>
              {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
            </button>
            {msg && <div style={{ fontFamily: ff, fontSize: 12, color: msg.ok ? T.mintText : "var(--rose-hot)", textAlign: "center" }}>{msg.text}</div>}
          </div>
        </Liquid>
        <button onClick={onDone} style={{ display: "block", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "18px 0 0", textAlign: "center" }}>
          <span style={{ fontFamily: ff, fontSize: 13.5, fontWeight: 600, color: T.faint }}>Skip for now</span>
          <span style={{ display: "block", fontFamily: ff, fontSize: 11, color: T.ghost, marginTop: 4 }}>You can sign in anytime from Settings ⚙️</span>
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════ APP ═══════════════════ */
export default function App() {
  const { d, ok, up, notifs, addBrandTracked, handleSaveAnswer } = useAppData();
  const coupleSync = useCoupleSync(d, ok, up);
  const [showWelcome, setShowWelcome] = useState(() => hasSupabase() && !localStorage.getItem(WELCOME_KEY));
  const dismissWelcome = () => { localStorage.setItem(WELCOME_KEY, "1"); setShowWelcome(false); };
  const [pg, setPg] = useState("home");
  const [ec, setEc] = useState(null);
  const [addDate, setAddDate] = useState(false);
  const [addGift, setAddGift] = useState(false);
  const [df, setDf] = useState({ label: "", date: "", emoji: "💍" });
  const [gf, setGf] = useState({ idea: "", category: "", link: "", price: "" });
  const [dis, setDis] = useState(new Set());
  const [ne, setNe] = useState(false);
  const [tn, setTn] = useState("");
  const [deckFilter, setDeckFilter] = useState("all");
  const [cardIdx, setCardIdx] = useState(0);
  // deck order — reshuffled every time Discover opens, and via the shuffle button
  const [deckOrder, setDeckOrder] = useState(() => shuffled(FLASHCARDS.map(c => c.id)));
  const reshuffle = () => { setDeckOrder(shuffled(FLASHCARDS.map(c => c.id))); setCardIdx(0); };
  const [brandTagFilter, setBrandTagFilter] = useState("all");
  const [syncedDates, setSyncedDates] = useState(new Set());
  const [syncedReminders, setSyncedReminders] = useState(new Set());
  const [exportToCal, setExportToCal] = useState(true);

  const aN = notifs.filter(n => !dis.has(n.id));
  const totalPrefs = Object.values(d.preferences).flat().length;
  const answeredCount = FLASHCARDS.filter(c => d.discoveredAnswers?.[c.id]).length;
  const orderPos = new Map(deckOrder.map((id, i) => [id, i]));
  const inShuffledOrder = (cards) => [...cards].sort((a, b) => (orderPos.get(a.id) ?? 0) - (orderPos.get(b.id) ?? 0));
  const filteredCards = deckFilter === "weekly" ? weeklyThree(FLASHCARDS, d.discoveredAnswers || {}) : inShuffledOrder(deckFilter === "all" ? FLASHCARDS : FLASHCARDS.filter(c => c.deck === deckFilter));
  const currentCard = filteredCards[cardIdx % Math.max(filteredCards.length, 1)];
  const streak = liveStreak(d.streak || { count: 0, lastAnswerDay: null });

  // cross-feature jump: e.g. the Gifts concert suggestion opens Events → Followed
  const [eventsView, setEventsView] = useState(null);
  const go = (k) => { if (k === "discover" && pg !== "discover") reshuffle(); setPg(k); setEc(null); setEventsView(null); };
  const goEvents = (view) => { setEventsView(view); setPg("events"); setEc(null); };
  const dismiss = (id) => setDis(s => new Set([...s, id]));

  // scroll-direction dock minimizer
  const [dockMin, setDockMin] = useState(false);
  const scrollRef = useRef({ lastY: 0, ticking: false });
  const onScroll = useCallback(() => {
    if (scrollRef.current.ticking) return;
    scrollRef.current.ticking = true;
    requestAnimationFrame(() => {
      const el = document.getElementById("hwhl-scroll");
      if (!el) { scrollRef.current.ticking = false; return; }
      const y = el.scrollTop;
      const delta = y - scrollRef.current.lastY;
      if (delta > 8) setDockMin(true);
      else if (delta < -8) setDockMin(false);
      scrollRef.current.lastY = y;
      scrollRef.current.ticking = false;
    });
  }, []);
  useEffect(() => {
    const el = document.getElementById("hwhl-scroll");
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll, ok]);
  useEffect(() => { setDockMin(false); scrollRef.current.lastY = 0; }, [pg]);

  // fire due date/reminder notifications while the app is open
  const dRef = useRef(d);
  dRef.current = d;
  useEffect(() => { if (ok) return startNotificationLoop(() => dRef.current); }, [ok]);

  // theme: flip the variable set + browser chrome color
  const theme = d.settings?.theme || "dark";
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f4eef6" : "#0b0710");
  }, [theme]);

  if (!ok) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
      <div style={{ width: 56, height: 56, borderRadius: 20, ...glass({ borderRadius: 20 }), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, animation: "breathe 2s ease-in-out infinite" }}>💕</div>
    </div>
  );

  /* ──── SHELL ──── */
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: ff, position: "relative", overflow: "hidden" }}>
      <style>{GLOBAL_CSS}</style>
      <Aurora />
      {/* height + bottom padding live in GLOBAL_CSS (#hwhl-scroll) for dvh/safe-area fallbacks */}
      <div id="hwhl-scroll" style={{ position: "relative", maxWidth: 480, margin: "0 auto", padding: "26px 18px 180px", overflowY: "auto", overflowX: "hidden" }}>
        {pg !== "home" && (
          <button onClick={() => go("home")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: T.faint, fontFamily: ff, fontSize: 13, fontWeight: 600, padding: "0 0 18px" }}>← Home</button>
        )}
        <div key={pg}>
          {pg === "home" && <Home d={d} up={up} go={go} totalPrefs={totalPrefs} answeredCount={answeredCount} aN={aN} dismiss={dismiss} ne={ne} setNe={setNe} tn={tn} setTn={setTn} />}
          {pg === "discover" && <Discover d={d} answeredCount={answeredCount} streak={streak} deckFilter={deckFilter} setDeckFilter={setDeckFilter} cardIdx={cardIdx} setCardIdx={setCardIdx} filteredCards={filteredCards} currentCard={currentCard} handleSaveAnswer={handleSaveAnswer} onShuffle={reshuffle} />}
          {pg === "brands" && <Brands d={d} up={up} addBrandTracked={addBrandTracked} brandTagFilter={brandTagFilter} setBrandTagFilter={setBrandTagFilter} />}
          {pg === "preferences" && <Preferences d={d} up={up} addBrandTracked={addBrandTracked} totalPrefs={totalPrefs} ec={ec} setEc={setEc} />}
          {pg === "dates" && <Dates d={d} up={up} addDate={addDate} setAddDate={setAddDate} df={df} setDf={setDf} exportToCal={exportToCal} setExportToCal={setExportToCal} syncedDates={syncedDates} setSyncedDates={setSyncedDates} />}
          {pg === "gifts" && <Gifts d={d} up={up} totalPrefs={totalPrefs} addGift={addGift} setAddGift={setAddGift} gf={gf} setGf={setGf} goEvents={goEvents} />}
          {pg === "reminders" && <Reminders d={d} up={up} syncedReminders={syncedReminders} setSyncedReminders={setSyncedReminders} />}
          {pg === "settings" && <Settings d={d} up={up} sync={coupleSync} />}
          {pg === "events" && <Events d={d} up={up} initialView={eventsView} />}
          {pg === "restaurants" && <Restaurants d={d} up={up} />}
        </div>
      </div>
      <Dock pg={pg} go={go} minimized={dockMin} />
      {showWelcome && <WelcomeOverlay onDone={dismissWelcome} onGoSettings={() => { dismissWelcome(); go("settings"); }} />}
    </div>
  );
}
