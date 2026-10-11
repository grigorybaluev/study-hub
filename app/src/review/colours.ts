// Each course's colour on the stats page (#231, #225): one of the 8 categorical slots, in a fixed order
// by the course's first place in cards.json (the 14 days, the forecast and retention share it; the
// colours are in base.css, .activity and .anki). A ninth course on folds into "other".
import type { Card } from "../data/types";

export const SLOTS = 8;
export const OTHER = "other";

/** `slot`: course -> 1..8; `courseOf`: a card's course, or "other" (a card removed since: its id starts
 *  with its course). */
export function courseColours(cards: Card[]) {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const order = [...new Set(cards.map((c) => c.course))];
  const slot = new Map(order.slice(0, SLOTS).map((c, i) => [c, i + 1]));
  const courseOf = (id: string) => {
    const c = byId.get(id)?.course ?? id.split("/").slice(0, 2).join("/");
    return slot.has(c) ? c : OTHER;
  };
  return { byId, slot, courseOf };
}
