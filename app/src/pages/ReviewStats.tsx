// /review/stats (#195): days in a row and freezes, the calendar of review days, mastery per course and
// per concept, milestones, totals, and the settings (daily limits, retention, feedback).
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { node, useData } from "../data/load";
import type { CourseNode } from "../data/types";
import { calendar, milestones, streak } from "../review/days";
import MasteryBar, { TIERS } from "../components/MasteryBar";
import { TIER_COLOR, memoryOf } from "../review/memory";
import type { Settings } from "../review/engine";
import { prefs, setPrefs, type FeedbackPrefs } from "../review/feedback";
import { TIER_NAME } from "../review/rewards";
import { clearedDays, useReviewData } from "../review/useDeck";


export default function ReviewStats() {
  const d = useData();
  const { st, error } = useReviewData();
  const [, redraw] = useState(0);

  const view = useMemo(() => {
    if (!st) return null;
    const now = Date.now();
    const s = streak(st.engine.log, clearedDays(st.store), now);
    const m = memoryOf(st.engine, st.cards);
    const courses = [...m.courses].map(([id, tiers]) => ({ id, code: node<CourseNode>(d, id)?.code ?? id, tiers }));
    return {
      streak: s, cal: calendar(st.engine.log, now), courses, concepts: { total: m.concepts.size, silverPlus: m.silverPlus },
      milestones: milestones(st.engine, st.cards, s), stats: st.engine.stats(now),
    };
  }, [st, d]);

  if (error) return <p>Could not load the review data: {error}</p>;
  if (!st || !view) return <p className="muted">Loading…</p>;
  const { streak: s, stats } = view;

  return (
    <div className="stats">
      <div className="crumbs"><Link to="/review">Review</Link> › stats</div>
      <h1>Streak and stats</h1>

      <section className="stats-streak">
        <div className="stats-big"><b>{s.current}</b><span>day{s.current === 1 ? "" : "s"} in a row</span></div>
        <div className="stats-big"><b>{s.best}</b><span>best</span></div>
        <div className="stats-big"><b>{s.freezes}</b><span>freeze{s.freezes === 1 ? "" : "s"} held</span></div>
        <p className="small muted">
          A day counts when the deck is cleared or 10 cards are graded{s.today ? "; today already counts." : "; today does not count yet."} Every
          7 days in a row earn a freeze (at most 2), used by itself on a missed day, so one missed day does not undo weeks.
        </p>
      </section>

      <section>
        <h2>The last 26 weeks</h2>
        <div className="heatmap" role="img" aria-label="Cards graded per day over the last 26 weeks">
          {view.cal.map((col, i) => (
            <div key={i} className="heat-col">
              {col.map((c) => (
                <i key={c.day} className={`heat l${c.count < 0 ? "x" : level(c.count)}${s.frozen.includes(c.day) ? " frozen" : ""}`}
                  title={c.count < 0 ? "" : `${new Date(c.day).toLocaleDateString()}: ${c.count} card${c.count === 1 ? "" : "s"}${s.frozen.includes(c.day) ? " (freeze)" : ""}`} />
              ))}
            </div>
          ))}
        </div>
        <p className="small muted">{stats.reviews} grades in all, {Math.round(stats.ms / 60_000)} minutes{stats.retention30 !== null ? `; ${Math.round(stats.retention30 * 100)}% of reviews recalled in the last 30 days` : ""}.</p>
      </section>

      <section>
        <h2>Mastery</h2>
        {view.courses.map((c) => (
          <div key={c.id} className="mastery-row"><span className="mastery-course">{c.code}</span><MasteryBar tiers={c.tiers} /></div>
        ))}
        <p className="small muted legend">{TIERS.map((t) => <span key={t}><i style={{ background: TIER_COLOR[t] }} /> {TIER_NAME[t]}</span>)}</p>
        <p className="small muted">
          {view.concepts.silverPlus} of {view.concepts.total} concepts at Silver or above: a concept takes the mean memory of its cards
          (a week for Bronze, a month for Silver, three months for Gold, a year for Diamond).
        </p>
      </section>

      <section>
        <h2>Milestones</h2>
        <ul className="milestones">
          {view.milestones.map((m) => (
            <li key={m.id} className={m.reached ? "reached" : ""} title={m.hint}><b>{m.title}</b><span className="small muted">{m.hint}</span></li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Settings</h2>
        <SettingsForm settings={st.engine.settings} onSave={async (x) => { st.engine.setSettings(x); await st.store.saveSettings(x); redraw((n) => n + 1); }} />
        <FeedbackForm leftToday={() => { const q = st.engine.queue(st.cards.map((c) => c.id), Date.now()); return q.due.length + q.fresh.length + q.later.length; }} />
      </section>
    </div>
  );
}

function level(n: number): number {
  return n === 0 ? 0 : n < 5 ? 1 : n < 15 ? 2 : n < 30 ? 3 : 4;
}

function SettingsForm({ settings, onSave }: { settings: Settings; onSave(s: Settings): Promise<void> }) {
  // the fields keep what is typed; values are brought into range when a field is left and on Save
  const [raw, setRaw] = useState({ newPerDay: String(settings.newPerDay), reviewsPerDay: String(settings.reviewsPerDay) });
  const [retention, setRetention] = useState(settings.retention);
  const [saved, setSaved] = useState(false);
  const num = (v: string, lo: number, hi: number, fallback: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) && v.trim() !== "" ? Math.max(lo, Math.min(hi, n)) : fallback;
  };
  const parsed: Settings = {
    newPerDay: num(raw.newPerDay, 0, 200, settings.newPerDay),
    reviewsPerDay: num(raw.reviewsPerDay, 10, 2000, settings.reviewsPerDay),
    retention,
  };
  const changed = parsed.newPerDay !== settings.newPerDay || parsed.reviewsPerDay !== settings.reviewsPerDay || retention !== settings.retention;
  const field = (k: "newPerDay" | "reviewsPerDay") => ({
    value: raw[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setSaved(false); setRaw({ ...raw, [k]: e.target.value }); },
    onBlur: () => setRaw({ ...raw, [k]: String(parsed[k]) }),
  });
  const options = [...new Set([0.8, 0.85, 0.9, 0.95, settings.retention])].sort();     // a synced value off the list shows too
  return (
    <form className="settings" onSubmit={async (e) => { e.preventDefault(); setRaw({ newPerDay: String(parsed.newPerDay), reviewsPerDay: String(parsed.reviewsPerDay) }); await onSave(parsed); setSaved(true); }}>
      <label>New cards a day <input type="number" inputMode="numeric" min={0} max={200} {...field("newPerDay")} /></label>
      <label>Reviews a day, at most <input type="number" inputMode="numeric" min={10} max={2000} {...field("reviewsPerDay")} /></label>
      <label>Recall to aim for
        <select value={retention} onChange={(e) => { setSaved(false); setRetention(Number(e.target.value)); }}>
          {options.map((r) => <option key={r} value={r}>{Math.round(r * 100)}%{r === 0.9 ? " (Anki's default)" : ""}</option>)}
        </select>
      </label>
      <p className="small muted">Higher recall means shorter intervals and more reviews. Settings travel with Sync; the newer ones win.</p>
      <button type="submit" disabled={!changed}>{saved && !changed ? "Saved" : "Save"}</button>
    </form>
  );
}

function FeedbackForm({ leftToday }: { leftToday(): number }) {
  const [p, setP] = useState<FeedbackPrefs>(prefs);
  const set = async (k: keyof FeedbackPrefs, v: boolean) => {
    if (k === "badge" && v && "Notification" in window && Notification.permission === "default") {
      try { await Notification.requestPermission(); } catch { /* the badge may stay hidden */ }
    }
    if (k === "badge" && !v && "clearAppBadge" in navigator) navigator.clearAppBadge().catch(() => {});
    if (k === "badge" && v && "setAppBadge" in navigator) navigator.setAppBadge(leftToday()).catch(() => {});
    const next = { ...p, [k]: v };
    setPrefs(next);
    setP(next);
  };
  const row = (k: keyof FeedbackPrefs, label: string, note: string) => (
    <label className="toggle"><input type="checkbox" checked={p[k]} onChange={(e) => set(k, e.target.checked)} /> <span>{label}<span className="small muted"> — {note}</span></span></label>
  );
  return (
    <div className="settings">
      {row("motion", "Animations", "card flights, the +1, confetti (reduced motion in the system turns them off too)")}
      {row("haptics", "Haptic tick", "on a phone, as a swipe passes its point and on each grade")}
      {row("sound", "Sound", "a soft tick; the mute switch silences it")}
      {row("badge", "Count on the app icon", "the cards left today on the installed app's icon (asks for permission on an iPhone)")}
    </div>
  );
}
