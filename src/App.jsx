import { useCallback, useEffect, useRef, useState } from "react";
import { T, ff, glass, GLOBAL_CSS } from "./theme";
import { FLASHCARDS } from "./data/flashcards";
import { startNotificationLoop } from "./lib/notifications";
import { weeklyThree, liveStreak } from "./lib/weekly";
import { shuffled } from "./lib/utils";
import useAppData from "./hooks/useAppData";
import useCoupleSync from "./hooks/useCoupleSync";
import Aurora from "./components/Aurora";
import Dock from "./components/Dock";
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

/* ═══════════════════ APP ═══════════════════ */
export default function App() {
  const { d, ok, up, notifs, addBrandTracked, handleSaveAnswer } = useAppData();
  const coupleSync = useCoupleSync(d, ok, up);
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
      <div id="hwhl-scroll" style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "26px 18px 130px", overflowY: "auto", overflowX: "hidden" }}>
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
    </div>
  );
}
