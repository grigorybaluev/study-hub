// Where each course stands (#231): how many taught cards are seen, how far behind it is (reviews overdue
// from an earlier day, plus taught cards not started: owner decision), the recall of what is seen, and
// how ready its next exam is. Pure; tests/review-standing.test.mjs.
import type { Card } from "../data/types";
import { dayStart } from "./engine.ts";
import { covers, daysUntil, examMorning, upcoming, type Exam } from "./term.ts";

export interface CourseStanding {
  course: string;
  /** cards of units taught by now, and cards seen ahead of their unit */
  taught: number;
  /** of those, graded at least once */
  seen: number;
  /** seen cards due before today's review day began and not graded since */
  overdue: number;
  /** taught cards never graded */
  unstarted: number;
  /** overdue + unstarted */
  behind: number;
  /** FSRS recall now, mean over the seen cards; null with none seen */
  recall: number | null;
  /** the course's next exam; `ready`: the share of its cards you would recall on its morning if you stopped
   *  reviewing now (FSRS recall, mean over all its cards, unstarted ones at 0); null when no card is in its weeks */
  exam: { index: number; name: string; date: number; days: number; cards: number; ready: number | null } | null;
}

export interface StandingInput {
  cards: Card[];
  exams: Exam[];
  isTaught(card: Card): boolean;
  unitWeeks(unit: string): number[];
  /** when a card falls due; undefined for a card never graded */
  due(id: string): number | undefined;
  recallAt(id: string, at: number): number;
  now: number;
}

/** One row per course with cards: the nearest exam first, courses without one after, in card order. */
export function standing(i: StandingInput): CourseStanding[] {
  const today = dayStart(i.now);
  const byCourse = new Map<string, Card[]>();
  for (const c of i.cards) { const l = byCourse.get(c.course); if (l) l.push(c); else byCourse.set(c.course, [c]); }
  const next = upcoming(i.exams, i.now);
  const rows = [...byCourse].map(([course, cards]): CourseStanding => {
    let taught = 0, seen = 0, overdue = 0, unstarted = 0, recall = 0;
    for (const c of cards) {
      const due = i.due(c.id);
      if (due === undefined) { if (i.isTaught(c)) { taught++; unstarted++; } continue; }
      taught++;
      seen++;
      if (due < today) overdue++;
      recall += i.recallAt(c.id, i.now);
    }
    const e = next.find((x) => x.course === course);
    let exam: CourseStanding["exam"] = null;
    if (e) {
      const of = cards.filter((c) => c.unit && covers(e, i.unitWeeks(c.unit)));
      const morning = examMorning(e.date);
      const ready = of.reduce((n, c) => n + (i.due(c.id) === undefined ? 0 : i.recallAt(c.id, morning)), 0);
      exam = { index: e.index, name: e.name, date: e.date, days: daysUntil(e.date, i.now), cards: of.length, ready: of.length ? ready / of.length : null };
    }
    return { course, taught, seen, overdue, unstarted, behind: overdue + unstarted, recall: seen ? recall / seen : null, exam };
  });
  const at = (r: CourseStanding) => r.exam?.date ?? Infinity;
  return rows.map((r, k) => ({ r, k })).sort((a, b) => at(a.r) - at(b.r) || a.k - b.k).map((x) => x.r);
}

/** The one line the panel shows closed: how many courses are behind, by how many cards, and the next exam. */
export function summary(rows: CourseStanding[]): { courses: number; behind: number; next: CourseStanding | null } {
  const late = rows.filter((r) => r.behind > 0);
  return { courses: late.length, behind: late.reduce((n, r) => n + r.behind, 0), next: rows.find((r) => r.exam) ?? null };
}
