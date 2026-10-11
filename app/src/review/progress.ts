// The day's progress for the reminders (#242): cards finished and left today, and tomorrow's cards, which
// the app saves (push.ts) so that a reminder can say "20 / 70 done" and the morning's first one "70 today"
// before the app is opened. public/push-sw.js turns it into words.
import { nextDay, type Engine } from "./engine.ts";

export interface DayProgress {
  /** cards graded today that are not left today (a card failed and still in its learning steps is left) */
  done: number;
  /** cards left today: due, new within the daily limit, learning steps due later today */
  left: number;
  /** the cards of the next review day, if nothing more is done today */
  next: number;
}

/** `cards`: every card id; `extraNew`: the deck's "5 more" for today. */
export function dayProgress(engine: Engine, cards: string[], now: number, extraNew = 0): DayProgress {
  const ids = (q: ReturnType<Engine["queue"]>) => [...q.due, ...q.fresh, ...q.later.map((l) => l.card)];
  const left = new Set(ids(engine.queue(cards, now, extraNew)));
  const graded = new Set(engine.log.slice(engine.log.length - engine.today(now).graded).map((r) => r.card));
  let done = 0;
  for (const id of graded) if (!left.has(id)) done++;
  // the queue at the next day's start: what is due by then, today's leftovers included, and a day's new cards
  return { done, left: left.size, next: ids(engine.queue(cards, nextDay(now))).length };
}
