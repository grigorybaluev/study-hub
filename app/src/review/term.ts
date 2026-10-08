// The term (#221): teaching weeks as dates, which units have been taught, and a plan per exam that
// brings every card of the exam in early (front-loaded, owner's request) so that the last days before
// it are reviews only. Pure; tests/review-term.test.mjs.
import type { Card } from "../data/types";
import { dayStart } from "./engine.ts";

const DAY = 86_400_000;

/** A term calendar from university.yaml: the Monday of week 1 and the Mondays of break weeks. */
export interface Calendar { start: string; breaks: string[] }

/** Local midnight of an ISO date. */
export function localDate(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}
const plusDays = (t: number, n: number) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };   // DST-safe
/** Local midnight of today's date. An exam is over once its date has passed, even before the review
 *  day turns at 4 am. */
const today = (now: number) => new Date(now).setHours(0, 0, 0, 0);

/** Local midnight of the Monday that starts teaching week `n` (break weeks are not counted). */
export function weekStart(cal: Calendar, n: number): number {
  const breaks = new Set(cal.breaks.map(localDate));
  let t = localDate(cal.start);
  for (let w = 1; w < n; w++) {
    t = plusDays(t, 7);
    while (breaks.has(t)) t = plusDays(t, 7);
  }
  return t;
}

/** A unit has been taught once its first week has begun; with no weeks or no calendar, always. */
export function taught(cal: Calendar | null, weeks: number[], now: number): boolean {
  return !cal || !weeks.length || weekStart(cal, Math.min(...weeks)) <= now;
}

export interface Exam {
  course: string;
  /** its place in the course's `exams` */
  index: number;
  name: string;
  /** local midnight of the exam day */
  date: number;
  weeks: [number, number];
}

/** Whether an exam covers a unit taught in these weeks (any of them inside its range). */
export function covers(e: Exam, weeks: number[]): boolean {
  return weeks.some((w) => w >= e.weeks[0] && w <= e.weeks[1]);
}

/** Days from today to the exam day (0 on the day itself). */
export function daysUntil(date: number, now: number): number {
  return Math.round((date - today(now)) / DAY);
}

/** Days to bring an exam's new cards in: the first 40 % of the days left, ending at least two days before
 *  it, so the last days are reviews only. 11 days -> 5, 17 -> 7, 20 -> 8; at least one. */
export function introWindow(days: number): number {
  return days <= 2 ? 1 : Math.max(1, Math.min(days - 2, Math.ceil(days * 0.4)));
}

export interface ExamPlan extends Exam {
  /** the exam's cards, in unit order */
  cards: string[];
  /** cards not started before today, in unit order (those started today stay in: the quota is the day's) */
  fresh: string[];
  /** started today */
  startedToday: number;
  days: number;
  window: number;
  /** new cards to start today: what is left, spread over the window */
  perDay: number;
}

export interface PlanInput {
  cards: Card[];
  exams: Exam[];
  unitWeeks(unit: string): number[];
  firstSeen(card: string): number | undefined;
  now: number;
}

/** A plan for each exam from today on, nearest first. */
export function examPlans(i: PlanInput): ExamPlan[] {
  const start = dayStart(i.now);
  return upcoming(i.exams, i.now).map((e) => {
    const cards = i.cards.filter((c) => c.course === e.course && c.unit && covers(e, i.unitWeeks(c.unit)));
    const fresh: string[] = [];
    let startedToday = 0;
    for (const c of cards) {
      const f = i.firstSeen(c.id);
      if (f === undefined || f >= start) fresh.push(c.id);
      if (f !== undefined && f >= start) startedToday++;
    }
    const days = daysUntil(e.date, i.now), window = introWindow(days);
    return { ...e, cards: cards.map((c) => c.id), fresh, startedToday, days, window, perDay: Math.ceil(fresh.length / window) };
  });
}

/** The daily deck under exam plans. New cards of units not taught yet leave the pool. Each exam's quota
 *  for today comes first, the next card always from the exam furthest behind on its quota (nearest first
 *  on a tie), so a short session touches every exam and the order holds from one grade to the next; then
 *  the rest in their usual order. `newLeft`: the new cards the plans still need today. */
export function examDaily(pool: Card[], plans: ExamPlan[], isTaught: (c: Card) => boolean, seen: (id: string) => boolean): { cards: Card[]; newLeft: number } {
  const byId = new Map(pool.map((c) => [c.id, c]));
  const queues = plans.map((p) => p.fresh
    .filter((id) => byId.has(id) && !seen(id) && isTaught(byId.get(id)!))
    .slice(0, Math.max(0, p.perDay - p.startedToday)));
  const first: Card[] = [], taken = new Set<string>(), next = queues.map(() => 0);
  for (;;) {
    let pick = -1, behind = Infinity;
    queues.forEach((q, i) => {
      if (next[i] >= q.length) return;
      const share = (plans[i].startedToday + next[i]) / plans[i].perDay;
      if (share < behind) { behind = share; pick = i; }
    });
    if (pick < 0) break;
    const id = queues[pick][next[pick]++];
    if (!taken.has(id)) { taken.add(id); first.push(byId.get(id)!); }
  }
  const rest = pool.filter((c) => !taken.has(c.id) && (seen(c.id) || isTaught(c)));
  return { cards: [...first, ...rest], newLeft: plans.reduce((n, p) => n + Math.max(0, p.perDay - p.startedToday), 0) };
}

/** Exams from today's date on, nearest first. */
export function upcoming<E extends { date: number }>(exams: E[], now: number): E[] {
  return exams.filter((e) => e.date >= today(now)).sort((a, b) => a.date - b.date);
}
