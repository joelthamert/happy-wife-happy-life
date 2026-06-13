import { useState } from "react";
import { T, ff, ffd, glassInput, eyebrow, btnPrimary, btnGhost } from "../theme";
import { hasSupabase, signInEmail, signUpEmail, signInGoogle, signOut, joinCoupleByCode } from "../lib/couple";
import { notificationsSupported, permissionState, requestPermission, checkAndNotify } from "../lib/notifications";
import LocationPicker from "../components/LocationPicker";
import Liquid from "../components/Liquid";
import Reveal from "../components/Reveal";
import PageHead from "../components/PageHead";

const Row = ({ label, sub, on, onToggle }) => (
  <Liquid lift={false} style={{ padding: "14px 16px", marginBottom: 8, borderRadius: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: T.ink }}>{label}</div>
        <div style={{ fontFamily: ff, fontSize: 11.5, color: T.faint, marginTop: 2 }}>{sub}</div>
      </div>
      <button onClick={onToggle} style={{
        padding: "5px 13px", borderRadius: 999, cursor: "pointer", fontFamily: ff, fontSize: 10, fontWeight: 800, transition: "all .3s",
        border: "1px solid " + (on ? "rgba(255,122,156,0.35)" : "rgba(255,255,255,0.08)"),
        background: on ? "linear-gradient(145deg, rgba(255,122,156,0.20), rgba(176,124,255,0.14))" : "var(--wash-0)",
        color: on ? "var(--rose-text-strong)" : T.ghost, boxShadow: "inset 0 1px 0 var(--highlight)",
      }}>{on ? "ON" : "OFF"}</button>
    </div>
  </Liquid>
);


/* ──── Account & partner — Supabase-backed couples mode ──── */
const AccountCard = ({ sync }) => {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!hasSupabase()) {
    return (
      <Liquid lift={false} style={{ padding: "17px 19px", marginBottom: 18, borderRadius: 20 }}>
        <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: T.ink, marginBottom: 5 }}>Couples mode needs a free Supabase project</div>
        <div style={{ fontFamily: ff, fontSize: 12, color: T.faint, lineHeight: 1.65 }}>
          Create one at supabase.com (instant), run <span style={{ color: T.body }}>supabase/schema.sql</span> in its SQL editor, then paste the project URL and anon key into .env.local as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY and restart. Email login works out of the box; enable Google under Auth → Providers.
        </div>
      </Liquid>
    );
  }

  const run = async (fn, okMsg) => {
    setBusy(true); setMsg(null);
    try { await fn(); if (okMsg) setMsg({ ok: true, text: okMsg }); }
    catch (e) { setMsg({ ok: false, text: e.message || "Something went wrong" }); }
    setBusy(false);
  };

  if (!sync.user) {
    return (
      <Liquid lift={false} style={{ padding: "19px", marginBottom: 18, borderRadius: 20 }}>
        <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 4 }}>{mode === "signin" ? "Sign in" : "Create your account"}</div>
        <div style={{ fontFamily: ff, fontSize: 12, color: T.faint, marginBottom: 14 }}>Link with your partner so you both fill in the profile.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" autoComplete="email" style={glassInput} />
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" autoComplete={mode === "signin" ? "current-password" : "new-password"} style={glassInput} />
          <button disabled={busy || !email || pw.length < 6} onClick={() => run(async () => {
            const { error } = mode === "signin" ? await signInEmail(email, pw) : await signUpEmail(email, pw);
            if (error) throw error;
          }, mode === "signup" ? "Check your email to confirm, then sign in" : null)}
            style={{ ...btnPrimary(), padding: 13, opacity: busy || !email || pw.length < 6 ? 0.5 : 1 }}>
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          <button disabled={busy} onClick={() => run(async () => { const { error } = await signInGoogle(); if (error) throw error; })}
            style={{ ...btnGhost, padding: 12, textAlign: "center", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>
          <button onClick={() => { setMode(m => m === "signin" ? "signup" : "signin"); setMsg(null); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.faint, fontFamily: ff, fontSize: 12 }}>
            {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
          </button>
          {msg && <div style={{ fontFamily: ff, fontSize: 12, color: msg.ok ? T.mintText : "var(--rose-hot)", textAlign: "center" }}>{msg.text}</div>}
        </div>
      </Liquid>
    );
  }

  return (
    <Liquid lift={false} glow={T.mint} style={{ padding: "19px", marginBottom: 18, borderRadius: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: sync.state === "synced" ? "#7ce8b6" : sync.state === "error" ? "#ff7a9c" : "#e8c592", boxShadow: sync.state === "synced" ? "0 0 8px rgba(124,232,182,0.8)" : "none" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: T.ink, overflow: "hidden", textOverflow: "ellipsis" }}>{sync.user.email}</div>
          <div style={{ fontFamily: ff, fontSize: 11, color: T.faint }}>{sync.state === "synced" ? "Synced with your couple space" : sync.state === "linking" ? "Connecting…" : sync.state === "error" ? "Sync error — changes stay safe on this device" : ""}</div>
        </div>
        <button onClick={() => run(() => signOut())} style={{ background: "none", border: "none", cursor: "pointer", color: T.faint, fontFamily: ff, fontSize: 12 }}>Sign out</button>
      </div>
      {sync.couple && (
        <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 12 }}>
          <div style={{ fontFamily: ff, fontSize: 11.5, color: T.faint, marginBottom: 7 }}>Your invite code — partner enters it below on their device:</div>
          <button onClick={async () => { try { await navigator.clipboard.writeText(sync.couple.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }}
            style={{ ...btnGhost, width: "100%", padding: "11px", textAlign: "center", fontFamily: ff, fontSize: 19, fontWeight: 800, letterSpacing: "0.35em", color: "var(--rose-text-strong)", marginBottom: 10 }}>
            {copied ? "Copied ✓" : sync.couple.code}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Partner's code" maxLength={6}
              style={{ ...glassInput, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 700 }} />
            <button disabled={busy || code.length !== 6} onClick={() => run(async () => {
              const c = await joinCoupleByCode(code);
              sync.adoptCouple(c);
              setCode("");
            }, "Linked! You now share one profile")}
              style={{ ...btnPrimary(), padding: "13px 18px", whiteSpace: "nowrap", opacity: busy || code.length !== 6 ? 0.5 : 1 }}>Link</button>
          </div>
          {msg && <div style={{ fontFamily: ff, fontSize: 12, color: msg.ok ? T.mintText : "var(--rose-hot)", marginTop: 9, textAlign: "center" }}>{msg.text}</div>}
        </div>
      )}
    </Liquid>
  );
};

/* ──── SETTINGS — notifications & quiet hours ──── */
const Settings = ({ d, up, sync }) => {
  const [perm, setPerm] = useState(permissionState());
  const n = d.settings.notifications;
  const setN = (fn) => up(x => fn(x.settings.notifications));
  const granted = perm === "granted";
  return (
    <div style={{ animation: "rise .55s cubic-bezier(.2,1,.3,1)" }}>
      <PageHead kicker="Notifications & appearance" title="Settings" />
      <Reveal delay={0.02}>
        <div style={{ ...eyebrow, margin: "0 4px 11px" }}>Appearance</div>
        <Liquid lift={false} style={{ padding: "14px 16px", marginBottom: 18, borderRadius: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: T.ink }}>Theme</div>
              <div style={{ fontFamily: ff, fontSize: 11.5, color: T.faint, marginTop: 2 }}>Liquid glass, two ways</div>
            </div>
            {[{ k: "dark", l: "🌙 Dark" }, { k: "light", l: "☀️ Light" }].map(t => {
              const act = (d.settings.theme || "dark") === t.k;
              return (
                <button key={t.k} onClick={() => up(x => { x.settings.theme = t.k; })} style={{
                  padding: "8px 15px", borderRadius: 999, cursor: "pointer", fontFamily: ff, fontSize: 11.5, fontWeight: act ? 700 : 500, transition: "all .3s",
                  border: act ? "1px solid rgba(255,122,156,0.30)" : "1px solid var(--line)",
                  background: act ? "linear-gradient(145deg, rgba(255,122,156,0.18), rgba(176,124,255,0.12))" : "var(--wash-1)",
                  color: act ? "var(--rose-text-strong)" : T.body, boxShadow: "inset 0 1px 0 var(--highlight)",
                }}>{t.l}</button>
              );
            })}
          </div>
        </Liquid>
      </Reveal>
      <Reveal delay={0.025}>
        <div style={{ ...eyebrow, margin: "0 4px 11px" }}>Location</div>
        <Liquid lift={false} style={{ padding: "16px 18px", marginBottom: 18, borderRadius: 20 }}>
          <div style={{ fontFamily: ff, fontSize: 12, color: T.faint, marginBottom: 11, lineHeight: 1.5 }}>Home base for nearby restaurants, event picks and maps. Searches on Dine/Events can still look anywhere.</div>
          <LocationPicker d={d} up={up} compact />
        </Liquid>
      </Reveal>
      <Reveal delay={0.03}>
        <div style={{ ...eyebrow, margin: "0 4px 11px" }}>Account & partner</div>
        <AccountCard sync={sync} />
      </Reveal>
      <Reveal delay={0.04}>
        {!notificationsSupported() ? (
          <Liquid lift={false} style={{ padding: "17px 19px", marginBottom: 18, borderRadius: 20 }}>
            <div style={{ fontFamily: ff, fontSize: 13, color: T.body }}>This browser doesn't support notifications. Install the app to your home screen for the full experience.</div>
          </Liquid>
        ) : !granted ? (
          <Liquid lift={false} glow={T.violet} style={{ padding: "20px 19px", marginBottom: 18, borderRadius: 20 }}>
            <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 5 }}>Turn on notifications</div>
            <div style={{ fontFamily: ff, fontSize: 12.5, color: T.body, marginBottom: 14, lineHeight: 1.5 }}>Get date countdowns and recurring reminders on this device — nothing leaves your phone.</div>
            <button onClick={async () => { await requestPermission(); setPerm(permissionState()); }} style={{ ...btnPrimary(), width: "100%", padding: 13 }}>
              {perm === "denied" ? "Blocked — enable in browser settings" : "Allow notifications"}
            </button>
          </Liquid>
        ) : (
          <Liquid lift={false} glow={T.mint} style={{ padding: "14px 18px", marginBottom: 18, borderRadius: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: ff, fontWeight: 700, fontSize: 13, color: T.mintText }}>Notifications enabled ✓</span>
              <button onClick={() => checkAndNotify(d)} style={{ background: "none", border: "none", cursor: "pointer", color: T.faint, fontFamily: ff, fontSize: 11.5 }}>Send test check</button>
            </div>
          </Liquid>
        )}
      </Reveal>
      <Reveal delay={0.08}>
        <div style={{ ...eyebrow, margin: "0 4px 11px" }}>Categories</div>
        <Row label="Date countdowns" sub="7-day and 1-day alerts before each date" on={n.dates} onToggle={() => setN(x => x.dates = !x.dates)} />
        <Row label="Recurring reminders" sub="Flowers, date nights, love notes…" on={n.reminders} onToggle={() => setN(x => x.reminders = !x.reminders)} />
        <Row label="Brand sale alerts" sub="When tracked brands run sales" on={n.brandSales} onToggle={() => setN(x => x.brandSales = !x.brandSales)} />
        <Row label="Reservation countdowns" sub="3-day, 1-day and day-of tips for booked dinners" on={n.reservations} onToggle={() => setN(x => x.reservations = !x.reservations)} />
      </Reveal>
      <Reveal delay={0.14}>
        <div style={{ ...eyebrow, margin: "18px 4px 11px" }}>Quiet hours</div>
        <Row label="Quiet hours" sub="Silence notifications during these hours" on={n.quietHours.enabled} onToggle={() => setN(x => x.quietHours.enabled = !x.quietHours.enabled)} />
        {n.quietHours.enabled && (
          <Liquid lift={false} style={{ padding: "14px 16px", marginBottom: 8, borderRadius: 18 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: ff, fontSize: 10.5, color: T.faint, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>From</div>
                <input type="time" value={n.quietHours.start} onChange={e => setN(x => x.quietHours.start = e.target.value)} style={{ ...glassInput, padding: "11px 13px", colorScheme: "dark" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: ff, fontSize: 10.5, color: T.faint, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>Until</div>
                <input type="time" value={n.quietHours.end} onChange={e => setN(x => x.quietHours.end = e.target.value)} style={{ ...glassInput, padding: "11px 13px", colorScheme: "dark" }} />
              </div>
            </div>
          </Liquid>
        )}
      </Reveal>
      <Reveal delay={0.2}>
        <div style={{ fontFamily: ff, fontSize: 11.5, color: T.faint, lineHeight: 1.6, margin: "16px 4px 0" }}>
          Notifications fire while the app is open or installed to your home screen. All data stays on this device.
        </div>
      </Reveal>
    </div>
  );
};
export default Settings;
