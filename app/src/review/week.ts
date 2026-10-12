// Review sessions and the week (#243): when and how long the cards were reviewed, the week against the
// one before, and the last weeks' trend, from the log, the days the deck was cleared and the times
// reminders arrived (recorded by public/push-sw.js). Pure; tests/review-week.test.mjs runs it in node.
import { dayStart, nextDay, type Review } from "./engine.ts";

const MIN = 60_000, HOUR = 60 * MIN;
/** Grades further apart than this start a new session. */
export const SESSION_GAP = 5 * MIN;
/** A reminder counts as acted on when a card is graded this soon after it. */
export const ACTED_WITHIN = 15 * MIN;

export interface Session {
  /** when its first card was shown (its first grade less the time on it) */
  start: number;
  /** its last grade */
  end: number;
  grades: number;
  cards: number;
}

export interface WeekDay {
  day: number;
  closed: boolean;
  sessions: Session[];
  /** when reminders arrived */
  reminders: number[];
}

export interface Week {
  /** the review week: Monday's review day (4 am) to the next Monday's */
  from: number;
  to: number;
  days: WeekDay[];
  /** days the deck was cleared */
  closed: number;
  /** cards graded (each once), grades, cards graded for the first time ever */
  cards: number;
  grades: number;
  fresh: number;
  /** time on the cards (each capped at a minute when graded) */
  ms: number;
  sessions: number;
  /** the median session's length, minutes (0 with no sessions) */
  typical: number;
  /** review-type grades and those not Again (true retention) */
  recall: { passed: number; total: number };
  reminders: { arrived: number; acted: number };
}

/** "45 min", "3 h 12 min" (the stats and the Sunday push, through WeekLine.time). */
export function duration(ms: number): string {
  const m = Math.round(Math.abs(ms) / MIN);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

/** The review week of a time: Monday's review day start (not term.ts's weekStart, a teaching week). */
export function reviewWeekStart(now: number): number {
  let d = dayStart(now);
  while (new Date(d).getDay() !== 1) d = dayStart(d - 12 * HOUR);
  return d;
}

/** The first index of a sorted log at or after a time. */
function seek(log: Review[], t: number): number {
  let lo = 0, hi = log.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (log[mid].ts < t) lo = mid + 1; else hi = mid; }
  return lo;
}

/** The grades in [from, to) of a sorted log. */
export const between = (log: Review[], from: number, to: number) => log.slice(seek(log, from), seek(log, to));

/** Grades into sessions. `log` sorted by time. */
export function sessions(log: Review[]): Session[] {
  const out: Session[] = [];
  let cur: (Session & { ids: Set<string> }) | null = null;
  let last = -Infinity;
  for (const r of log) {
    if (!cur || r.ts - last > SESSION_GAP) {
      cur = { start: r.ts - r.ms, end: r.ts, grades: 0, cards: 0, ids: new Set() };
      out.push(cur);
    }
    cur.end = r.ts; cur.grades++; cur.ids.add(r.card); cur.cards = cur.ids.size;
    last = r.ts;
  }
  return out.map(({ start, end, grades, cards }) => ({ start, end, grades, cards }));
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Minutes a session lasted, at least one. */
export const minutes = (s: Session) => Math.max(1, Math.round((s.end - s.start) / MIN));

/** When a card was first graded ever (Engine.firstSeen). */
export type FirstSeen = (card: string) => number | undefined;

/** The week starting at `from` (a reviewWeekStart). */
function weekOf(log: Review[], cleared: Set<number>, arrivals: number[], firstSeen: FirstSeen, from: number): Week {
  const days: WeekDay[] = [];
  for (let d = from, i = 0; i < 7; i++, d = nextDay(d)) days.push({ day: d, closed: cleared.has(d), sessions: [], reminders: [] });
  const to = nextDay(days[6].day);
  const dayOf = (t: number) => days.find((x) => t >= x.day && t < nextDay(x.day));
  const graded = between(log, from, to), all = sessions(graded);
  for (const s of all) dayOf(s.end)?.sessions.push(s);
  const inWeek = arrivals.filter((t) => t >= from && t < to);
  for (const t of inWeek) dayOf(t)?.reminders.push(t);
  const ids = new Set(graded.map((r) => r.card));
  const reviews = graded.filter((r) => r.type === "review");
  let fresh = 0;
  for (const id of ids) { const t = firstSeen(id); if (t !== undefined && t >= from && t < to) fresh++; }
  const times = graded.map((r) => r.ts);
  return {
    from, to, days, closed: days.filter((x) => x.closed).length,
    cards: ids.size, grades: graded.length, fresh, ms: graded.reduce((n, r) => n + r.ms, 0),
    sessions: all.length, typical: Math.round(median(all.map(minutes))),
    recall: { passed: reviews.filter((r) => r.rating > 1).length, total: reviews.length },
    reminders: { arrived: inWeek.length, acted: inWeek.filter((t) => times.some((g) => g >= t && g <= t + ACTED_WITHIN)).length },
  };
}

/** The last `n` weeks up to the one of `now`, oldest first. `log` sorted by time; `cleared`: day starts. */
export function weeks(log: Review[], cleared: number[], arrivals: number[], firstSeen: FirstSeen, now: number, n = 8): Week[] {
  const done = new Set(cleared.map(dayStart));
  const starts = [reviewWeekStart(now)];
  while (starts.length < n) starts.unshift(reviewWeekStart(starts[0] - 12 * HOUR));
  return starts.map((from) => weekOf(log, done, arrivals, firstSeen, from));
}

/** What the Sunday push says of the week (public/push-sw.js), saved with the day's progress: `from` and
 *  `until`, the week, after which it says nothing (the worker counts the reminders that arrived in it
 *  itself, since the app last saved); `time`, as the stats write it. */
export interface WeekLine { from: number; until: number; closed: number; cards: number; ms: number; time: string; passed: number; total: number; arrived: number; acted: number }
export const weekLine = (w: Week): WeekLine => ({
  from: w.from, until: w.to, closed: w.closed, cards: w.cards, ms: w.ms, time: duration(w.ms),
  passed: w.recall.passed, total: w.recall.total, arrived: w.reminders.arrived, acted: w.reminders.acted,
});
