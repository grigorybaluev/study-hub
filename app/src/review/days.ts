// Days and the long run (#195): the streak with its freezes, the calendar of review days, milestones,
// and the mastery of a concept (what the map will colour, #197). Pure, from the log and the engine;
// tests/review-days.test.mjs runs it in node.
import { TIER_RANK, dayStart, nextDay, type Engine, type Review, type Tier } from "./engine.ts";

/** A day counts for the streak when the deck was cleared that day, or when this many cards were graded. */
export const DAY_GOAL = 10;
const FREEZE_EVERY = 7;      // a freeze is earned for every 7 days in a row
const MAX_FREEZES = 2;

/** Grades per review day (keyed by the day's start). */
export function perDay(log: Review[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const r of log) { const d = dayStart(r.ts); out.set(d, (out.get(d) ?? 0) + 1); }
  return out;
}

export interface Streak {
  /** days in a row, freezes included, up to yesterday, plus today once today counts */
  current: number;
  best: number;
  /** freezes held, used by themselves on a missed day */
  freezes: number;
  /** whether today counts yet */
  today: boolean;
  /** days a freeze covered */
  frozen: number[];
}

/** Walk the days from the first review to today. Missing today does not break the run (the day is
 *  not over); a missed past day uses a freeze if one is held, else the run starts again. */
export function streak(log: Review[], cleared: number[], now: number): Streak {
  const counts = perDay(log), done = new Set(cleared.map(dayStart));
  const counted = (d: number) => done.has(d) || (counts.get(d) ?? 0) >= DAY_GOAL;
  const today = dayStart(now);
  const first = Math.min(...[...counts.keys(), ...done].filter((d) => d <= today), today);
  let run = 0, best = 0, freezes = 0, earned = 0;
  const frozen: number[] = [];
  for (let d = first; d < today; d = nextDay(d)) {
    if (counted(d)) {
      run++;
      earned++;
      if (earned % FREEZE_EVERY === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);
    } else if (run > 0 && freezes > 0) {
      freezes--;
      frozen.push(d);                     // covered: the run goes on, but the day adds nothing
    } else {
      run = 0;
      earned = 0;
    }
    best = Math.max(best, run);
  }
  const t = counted(today);
  const current = run + (t ? 1 : 0);
  return { current, best: Math.max(best, current), freezes, today: t, frozen };
}

/** The last `weeks` weeks of grades, oldest first, as columns of 7 days (Monday first); null before the range. */
export function calendar(log: Review[], now: number, weeks = 26): { day: number; count: number }[][] {
  const counts = perDay(log);
  const today = dayStart(now);
  const dow = (new Date(today).getDay() + 6) % 7;            // 0 = Monday
  let d = today;
  for (let i = 0; i < dow + 7 * (weeks - 1); i++) d = dayStart(d - 12 * 3_600_000);
  const cols: { day: number; count: number }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { day: number; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      col.push({ day: d, count: d <= today ? counts.get(d) ?? 0 : -1 });
      d = nextDay(d);
    }
    cols.push(col);
  }
  return cols;
}

/** A concept's mastery: the mean stability of its cards, unseen cards counting 0 days, read on the same
 *  tiers as a card (7, 30, 90, 365 days). "new" when none of its cards was seen. */
export function conceptMastery(engine: Engine, cards: { id: string; concepts: string[] }[]): Map<string, { tier: Tier; cards: number; seen: number; stability: number }> {
  const acc = new Map<string, { sum: number; cards: number; seen: number }>();
  for (const c of cards) {
    const m = engine.mastery(c.id), seen = engine.seen(c.id);
    for (const k of c.concepts) {
      const a = acc.get(k) ?? { sum: 0, cards: 0, seen: 0 };
      a.sum += seen ? m.stability : 0;
      a.cards++;
      if (seen) a.seen++;
      acc.set(k, a);
    }
  }
  const out = new Map<string, { tier: Tier; cards: number; seen: number; stability: number }>();
  for (const [k, a] of acc) {
    const s = a.sum / a.cards;
    out.set(k, { tier: a.seen ? tierOfStability(s) : "new", cards: a.cards, seen: a.seen, stability: s });
  }
  return out;
}

export function tierOfStability(s: number): Tier {
  return s >= 365 ? "diamond" : s >= 90 ? "gold" : s >= 30 ? "silver" : s >= 7 ? "bronze" : "learning";
}

/** How many cards of a set sit in each tier. */
export function tierCounts(engine: Engine, ids: string[]): Record<Tier, number> {
  const out: Record<Tier, number> = { new: 0, learning: 0, bronze: 0, silver: 0, gold: 0, diamond: 0 };
  for (const id of ids) out[engine.mastery(id).tier]++;
  return out;
}

export interface Milestone { id: string; title: string; hint: string; reached: boolean }

/** Small badges for the stats page; each is earned by memory or by days, never by one sitting. */
export function milestones(engine: Engine, cards: { id: string; course: string }[], s: Streak): Milestone[] {
  const reviews = engine.log.length;
  const tiers = cards.map((c) => engine.mastery(c.id).tier);
  const atLeast = (t: Tier) => tiers.some((x) => TIER_RANK[x] >= TIER_RANK[t]);
  const byCourse = new Map<string, Tier[]>();
  cards.forEach((c, i) => byCourse.set(c.course, [...(byCourse.get(c.course) ?? []), tiers[i]]));
  const halfSilver = [...byCourse.values()].some((ts) => ts.filter((t) => TIER_RANK[t] >= TIER_RANK.silver).length * 2 >= ts.length);
  return [
    { id: "first", title: "First review", hint: "Grade a card", reached: reviews > 0 },
    { id: "bronze", title: "First Bronze card", hint: "A card remembered for a week", reached: atLeast("bronze") },
    { id: "gold", title: "First Gold card", hint: "A card remembered for three months", reached: atLeast("gold") },
    { id: "week", title: "A week in a row", hint: "7 days in a row", reached: s.best >= 7 },
    { id: "month", title: "A month in a row", hint: "30 days in a row", reached: s.best >= 30 },
    { id: "thousand", title: "1,000 reviews", hint: "1,000 grades in all", reached: reviews >= 1000 },
    { id: "half-silver", title: "Half a course at Silver", hint: "Half of one course's cards at Silver or above", reached: halfSilver },
  ];
}
