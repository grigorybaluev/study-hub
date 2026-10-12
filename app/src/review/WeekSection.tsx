// This week (#243), at the top of the stats: the week against the one before (days closed, cards, new
// cards, time, sessions, recall, reminders acted on), when in each day the cards were reviewed (a bar per
// session, a tick per reminder), and the last eight weeks' trend.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { nextDay, type Review } from "./engine";
import { reminderArrivals } from "./push";
import { weeks, type Session, type Week, type WeekDay } from "./week";

const MIN = 60_000, HOUR = 60 * MIN;

/** "45 min", "3 h 12 min". */
export function duration(ms: number): string {
  const m = Math.round(Math.abs(ms) / MIN);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}
const signed = (n: number, unit = "") => (n > 0 ? `+${n}${unit}` : n < 0 ? `−${-n}${unit}` : "same");
const share = (p: { passed: number; total: number }) => (p.total ? Math.round((100 * p.passed) / p.total) : null);
const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const range = (w: Week) => {
  const a = new Date(w.from), b = new Date(w.days[6].day);
  return `${a.toLocaleDateString([], { month: "short", day: "numeric" })} – ${b.toLocaleDateString([], { month: a.getMonth() === b.getMonth() ? undefined : "short", day: "numeric" })}`;
};

export default function WeekSection({ log, cleared }: { log: Review[]; cleared: number[] }) {
  const [arrivals, setArrivals] = useState<number[]>([]);
  useEffect(() => {
    let live = true;
    reminderArrivals().then((a) => { if (live) setArrivals(a); });
    return () => { live = false; };
  }, []);
  const ws = useMemo(() => weeks(log, cleared, arrivals, Date.now(), 8), [log, cleared, arrivals]);
  const w = ws[ws.length - 1], prev = ws[ws.length - 2];
  const now = Date.now();

  const recall = share(w.recall), recallBefore = share(prev.recall);
  const acted = (x: Week) => (x.reminders.arrived ? Math.round((100 * x.reminders.acted) / x.reminders.arrived) : null);
  const rows: { label: string; value: ReactNode; delta: string }[] = [
    { label: "Days closed", value: <><Dots days={w.days} now={now} /> {w.closed} / 7</>, delta: signed(w.closed - prev.closed) },
    { label: "Cards reviewed", value: w.cards, delta: signed(w.cards - prev.cards) },
    { label: "New cards started", value: w.fresh, delta: signed(w.fresh - prev.fresh) },
    { label: "Time", value: duration(w.ms), delta: duration(w.ms) === duration(prev.ms) ? "same" : `${w.ms > prev.ms ? "+" : "−"}${duration(w.ms - prev.ms)}` },
    { label: "Sessions", value: w.sessions ? `${w.sessions} · typical ${w.typical} min` : 0, delta: signed(w.sessions - prev.sessions) },
    { label: "Recalled", value: recall === null ? "—" : `${recall} %`, delta: recall === null || recallBefore === null ? "" : signed(recall - recallBefore, " pts") },
    {
      label: "Reminders acted on", value: w.reminders.arrived ? `${w.reminders.acted} / ${w.reminders.arrived}` : "—",
      delta: acted(w) === null || acted(prev) === null ? "" : signed(acted(w)! - acted(prev)!, " pts"),
    },
  ];

  return (
    <div className="week">
      <p className="small muted">{range(w)}, against the week before. A session: cards graded less than 5 minutes apart. A reminder is acted on when a card is graded within 15 minutes of it.</p>
      <table className="week-table">
        <tbody>
          {rows.map((r) => <tr key={r.label}><th scope="row">{r.label}</th><td>{r.value}</td><td className="muted">{r.delta}</td></tr>)}
        </tbody>
      </table>
      <h3>When you reviewed</h3>
      <Timeline days={w.days} now={now} />
      <h3>The last 8 weeks</h3>
      <Trend weeks={ws} />
    </div>
  );
}

function Dots({ days, now }: { days: WeekDay[]; now: number }) {
  return (
    <span className="week-dots" aria-hidden="true">
      {days.map((d) => <i key={d.day} className={d.closed ? "on" : d.day > now ? "later" : ""} />)}
    </span>
  );
}

/** A row per day, 8:00 to 22:00 or wider when a session or a reminder fell outside: a bar per session, a tick per reminder. */
function Timeline({ days, now }: { days: WeekDay[]; now: number }) {
  // hours after the review day's start (4 am), shown as clock hours: 0:30 is 24.5
  const hour = (d: WeekDay, t: number) => 4 + (t - d.day) / HOUR;
  const marks = days.flatMap((d) => [...d.sessions.flatMap((s) => [hour(d, s.start), hour(d, s.end)]), ...d.reminders.map((t) => hour(d, t))]);
  const lo = Math.min(8, ...marks.map(Math.floor)), hi = Math.max(22, ...marks.map(Math.ceil));
  const x = (h: number) => `${((h - lo) / (hi - lo)) * 100}%`;
  const ticks: number[] = [];
  for (let h = lo + (lo % 2); h <= hi; h += 2) ticks.push(h);
  const today = days.find((d) => now >= d.day && now < nextDay(d.day))?.day;
  const tip = (s: Session) => `${clock(s.start)}–${clock(s.end)} · ${s.cards} card${s.cards === 1 ? "" : "s"}`;
  return (
    <div className="week-timeline">
      <div className="week-trow week-hours" aria-hidden="true">
        <span />
        <span className="week-track">{ticks.map((h) => <b key={h} style={{ left: x(h) }}>{h % 24}</b>)}</span>
      </div>
      {days.map((d) => (
        <div key={d.day} className={`week-trow${d.day === today ? " today" : ""}${d.day > now ? " later" : ""}`}>
          <span className="week-tday">{new Date(d.day).toLocaleDateString([], { weekday: "short" })}</span>
          <span className="week-track" role="img" aria-label={d.sessions.length ? d.sessions.map(tip).join("; ") : "no reviews"}>
            {ticks.map((h) => <i key={h} className="week-grid" style={{ left: x(h) }} />)}
            {d.sessions.map((s) => (
              <i key={s.start} className="week-session" title={tip(s)}
                style={{ left: x(hour(d, s.start)), width: `${((hour(d, s.end) - hour(d, s.start)) / (hi - lo)) * 100}%` }} />
            ))}
            {d.reminders.map((t) => <i key={t} className="week-reminder" title={`Reminder ${clock(t)}`} style={{ left: x(hour(d, t)) }} />)}
          </span>
        </div>
      ))}
      <p className="week-legend small muted"><i className="week-session" /> a session <i className="week-reminder" /> a reminder arrived</p>
    </div>
  );
}

const TREND: { label: string; of(w: Week): number | null; show(v: number): string; max?: number }[] = [
  { label: "Time", of: (w) => w.ms, show: duration },
  { label: "Cards", of: (w) => w.cards, show: String },
  { label: "Days closed", of: (w) => w.closed, show: (v) => `${v} / 7`, max: 7 },
  { label: "Recalled", of: (w) => share(w.recall), show: (v) => `${v} %`, max: 100 },
];

/** A small bar chart per measure, a bar per week, this week on the right. */
function Trend({ weeks: ws }: { weeks: Week[] }) {
  return (
    <div className="week-trend">
      {TREND.map((m) => {
        const vals = ws.map(m.of), top = m.max ?? Math.max(1, ...vals.map((v) => v ?? 0));
        const last = vals[vals.length - 1];
        return (
          <figure key={m.label} className="week-chart">
            <figcaption><span>{m.label}</span> <b>{last === null ? "—" : m.show(last)}</b></figcaption>
            <div className="week-bars" role="img" aria-label={`${m.label} per week, oldest first: ${vals.map((v) => (v === null ? "none" : m.show(v))).join(", ")}`}>
              {ws.map((w, i) => (
                <i key={w.from} className={i === ws.length - 1 ? "now" : ""} title={`${range(w)}: ${vals[i] === null ? "—" : m.show(vals[i]!)}`}
                  style={{ height: `${((vals[i] ?? 0) / top) * 100}%` }} />
              ))}
            </div>
          </figure>
        );
      })}
      <p className="small muted week-trend-note">A bar per week, this week on the right.</p>
    </div>
  );
}
