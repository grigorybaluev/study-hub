// The stats page's Anki sections (#225), each number computed as Anki computes it, so they match after an
// export (#198): today's totals, the future-due forecast, card counts, true retention and the answer
// buttons. Days are review days (they turn at 4 am); a card is mature once its interval reaches 21 days.
// Pure; tests/review-anki-stats.test.mjs.
import { dayStart, nextDay, type CardState, type Rating, type Review } from "./engine.ts";

export const MATURE_DAYS = 21;
const DAY = 86_400_000;

/** A grade with the interval the replay gave it and the one before (Engine.revlog). */
export interface Entry { review: Review; ivl: number; lastIvl: number }

/** The start of the review day `n` days before today's (0: today), stepping by calendar days. */
export function daysBack(now: number, n: number): number {
  let d = dayStart(now);
  for (let i = 0; i < n; i++) d = dayStart(d - 12 * 3_600_000);
  return d;
}

export interface Today {
  /** grades today ("Studied N cards" counts grades, as Anki does) */
  graded: number;
  ms: number;
  again: number;
  learn: number;
  review: number;
  relearn: number;
  /** review-type grades of mature cards today, and how many were not Again */
  mature: { correct: number; total: number };
}

export function today(log: Entry[], now: number): Today {
  const from = dayStart(now);
  const t: Today = { graded: 0, ms: 0, again: 0, learn: 0, review: 0, relearn: 0, mature: { correct: 0, total: 0 } };
  for (const { review: r, lastIvl } of log) {
    if (r.ts < from) continue;
    t.graded++;
    t.ms += r.ms;
    if (r.rating === 1) t.again++;
    t[r.type]++;
    if (r.type === "review" && lastIvl >= MATURE_DAYS) { t.mature.total++; if (r.rating > 1) t.mature.correct++; }
  }
  return t;
}

/** A review card's interval in whole days, as Anki stores it. */
const ivlOf = (s: CardState) => Math.max(1, Math.round((s.due - s.last) / DAY));

export interface Counts { new: number; learning: number; relearning: number; young: number; mature: number }

/** The cards of the deck by state: never graded, in learning steps, relearning, and in review by interval. */
export function counts(ids: string[], state: (id: string) => CardState | null): Counts {
  const c: Counts = { new: 0, learning: 0, relearning: 0, young: 0, mature: 0 };
  for (const id of ids) {
    const s = state(id);
    if (!s) c.new++;
    else if (s.state === "review") c[ivlOf(s) >= MATURE_DAYS ? "mature" : "young"]++;
    else c[s.state]++;
  }
  return c;
}

export interface DueDay { day: number; total: number; courses: Record<string, number> }

/** Cards due on each of the next `days` review days, by course; today's row includes everything overdue
 *  and the learning steps still to come today. */
export function forecast(ids: string[], state: (id: string) => CardState | null, courseOf: (id: string) => string, now: number, days = 14): DueDay[] {
  const out: DueDay[] = [];
  const ends: number[] = [];
  for (let d = dayStart(now), i = 0; i < days; i++, d = nextDay(d)) { out.push({ day: d, total: 0, courses: {} }); ends.push(nextDay(d)); }
  for (const id of ids) {
    const s = state(id);
    if (!s) continue;
    const i = ends.findIndex((end) => s.due < end);
    if (i < 0) continue;
    const c = courseOf(id), x = out[i];
    x.total++;
    x.courses[c] = (x.courses[c] ?? 0) + 1;
  }
  return out;
}

export interface Pass { passed: number; total: number }
export interface RetentionRow { label: string; young: Pass; mature: Pass; all: Pass }

/** Anki's true retention: review-type grades only (no learning or relearning steps), passed unless Again,
 *  young or mature by the interval before the grade; over today, yesterday, the last week, month, year and
 *  all time. `keep` narrows the cards (a course). */
export function trueRetention(log: Entry[], now: number, keep: (card: string) => boolean = () => true): RetentionRow[] {
  const today0 = dayStart(now);
  const periods: [string, number, number][] = [
    ["Today", today0, Infinity], ["Yesterday", daysBack(now, 1), today0], ["Last week", daysBack(now, 6), Infinity],
    ["Last month", daysBack(now, 29), Infinity], ["Last year", daysBack(now, 364), Infinity], ["All time", -Infinity, Infinity],
  ];
  const rows = periods.map(([label]) => ({ label, young: { passed: 0, total: 0 }, mature: { passed: 0, total: 0 }, all: { passed: 0, total: 0 } }));
  for (const { review: r, lastIvl } of log) {
    if (r.type !== "review" || !keep(r.card)) continue;
    const group = lastIvl >= MATURE_DAYS ? "mature" : "young", pass = r.rating > 1 ? 1 : 0;
    periods.forEach(([, from, until], i) => {
      if (r.ts < from || r.ts >= until) return;
      for (const p of [rows[i][group], rows[i].all]) { p.total++; p.passed += pass; }
    });
  }
  return rows;
}

export type ButtonGroup = "learning" | "young" | "mature";
export type Buttons = Record<ButtonGroup, Record<Rating, number>>;

/** Anki's answer buttons over the last `days` review days: grades per button, for cards in learning steps
 *  (learn and relearn), young and mature cards. */
export function buttons(log: Entry[], now: number, days = 30): Buttons {
  const from = daysBack(now, days - 1);
  const zero = () => ({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const b: Buttons = { learning: zero(), young: zero(), mature: zero() };
  for (const { review: r, lastIvl } of log) {
    if (r.ts < from) continue;
    const g: ButtonGroup = r.type !== "review" ? "learning" : lastIvl >= MATURE_DAYS ? "mature" : "young";
    b[g][r.rating]++;
  }
  return b;
}
