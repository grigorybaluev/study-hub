// What to study next (#222): each unit with cards as not taught yet, to start (taught cards never graded),
// weak (reviews overdue, or recall below the retention target) or solid, and the units most worth a
// session now: the cards likely forgotten by the next exam's morning, per day left. Pure;
// tests/review-coverage.test.mjs.
import type { Card } from "../data/types";
import { dayStart, nextDay } from "./engine.ts";
import { covers, daysUntil, examMorning, upcoming } from "./term.ts";
import type { StandingInput } from "./standing.ts";

export type UnitStatus = "untaught" | "start" | "weak" | "solid";

export interface UnitCoverage {
  unit: string;
  course: string;
  status: UnitStatus;
  cards: number;
  seen: number;
  /** taught cards never graded (none while the unit is not taught) */
  unstarted: number;
  /** seen cards due by the end of today's review day, overdue ones included */
  due: number;
  /** seen cards due before today's review day began */
  overdue: number;
  /** FSRS recall now, mean over the seen cards; null with none seen */
  recall: number | null;
  /** the nearest exam covering the unit */
  exam: { index: number; date: number; days: number } | null;
  /** with an exam: the cards likely forgotten on its morning (unstarted ones whole) per day left; without:
   *  the cards behind (overdue + unstarted) */
  priority: number;
}

export interface CoverageInput extends StandingInput {
  /** the retention target (settings): a unit's mean recall below it is weak */
  target: number;
}

/** One row per unit with cards, in card order (a course's units in teaching order). */
export function coverage(i: CoverageInput): UnitCoverage[] {
  const today = dayStart(i.now), tomorrow = nextDay(i.now);
  const byUnit = new Map<string, Card[]>();
  for (const c of i.cards) if (c.unit) { const l = byUnit.get(c.unit); if (l) l.push(c); else byUnit.set(c.unit, [c]); }
  const next = upcoming(i.exams, i.now);
  return [...byUnit].map(([unit, cards]): UnitCoverage => {
    const course = cards[0].course;
    const e = next.find((x) => x.course === course && covers(x, i.unitWeeks(unit)));
    const morning = e ? examMorning(e.date) : 0;
    let seen = 0, unstarted = 0, due = 0, overdue = 0, recall = 0, lost = 0;
    for (const c of cards) {
      const at = i.due(c.id);
      if (at === undefined) { if (i.isTaught(c)) unstarted++; continue; }
      seen++;
      if (at < tomorrow) due++;
      if (at < today) overdue++;
      recall += i.recallAt(c.id, i.now);
      if (e) lost += 1 - i.recallAt(c.id, morning);
    }
    const mean = seen ? recall / seen : null;
    const status: UnitStatus = !seen && !i.isTaught(cards[0]) ? "untaught" : unstarted ? "start"
      : overdue || (mean !== null && mean < i.target) ? "weak" : "solid";
    const days = e ? daysUntil(e.date, i.now) : 0;
    return {
      unit, course, status, cards: cards.length, seen, unstarted, due, overdue, recall: mean,
      exam: e ? { index: e.index, date: e.date, days } : null,
      priority: e ? (lost + unstarted) / Math.max(1, days) : overdue + unstarted,
    };
  });
}

/** The units most worth a session now: those to start or weak, the ones an exam covers first, each group
 *  by priority (the unit order on a tie). */
export function suggestions(rows: UnitCoverage[], n = 3): UnitCoverage[] {
  const open = rows.map((r, k) => ({ r, k })).filter((x) => x.r.status === "start" || x.r.status === "weak");
  return open.sort((a, b) => Number(!a.r.exam) - Number(!b.r.exam) || b.r.priority - a.r.priority || a.k - b.k)
    .slice(0, n).map((x) => x.r);
}
