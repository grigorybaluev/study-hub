// The day's progress for the reminders (#242): cards finished and left today on the daily deck, and the
// next day's cards, which the app saves (push.ts) so that a reminder can say "20 / 70 done" and the
// morning's first one "70 cards today" before the app is opened. public/push-sw.js turns it into words.
import { nextDay, type Engine } from "./engine.ts";

export interface DayProgress {
  /** the daily deck's cards graded today and not left today (a failed card in its learning steps is left);
   *  a card reviewed ahead of its day counts too, so extra work grows the day's total */
  done: number;
  /** the daily deck's cards left today: due, new within the day's allowance, learning steps due later today */
  left: number;
  /** the next review day's cards, if nothing more is done today */
  next: number;
}

/** The daily deck at a time: its cards, and the new cards it may start beyond the daily setting (exam
 *  plans, the deck's "5 more"). The reminders count this deck whatever the scope being reviewed. */
export type DailyAt = (at: number) => { cards: string[]; extraNew: number };

const ids = (q: ReturnType<Engine["queue"]>) => [...q.due, ...q.fresh, ...q.later.map((l) => l.card)];

/** Today's done and left. */
export function dayProgress(engine: Engine, daily: DailyAt, now: number): Omit<DayProgress, "next"> {
  const { cards, extraNew } = daily(now);
  const left = new Set(ids(engine.queue(cards, now, extraNew)));
  const deck = new Set(cards), graded = new Set(engine.todayLog(now).map((r) => r.card));
  let done = 0;
  for (const id of graded) if (deck.has(id) && !left.has(id)) done++;
  return { done, left: left.size };
}

/** The next review day's cards: its queue at its start, today's leftovers included. */
export function nextDayCards(engine: Engine, daily: DailyAt, now: number): number {
  const at = nextDay(now), { cards, extraNew } = daily(at);
  return ids(engine.queue(cards, at, extraNew)).length;
}
