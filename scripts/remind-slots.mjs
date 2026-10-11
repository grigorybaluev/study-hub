// Reminder times of a day (#235), from the busy blocks the owner's phone sends each morning (the repo
// variable REMIND_DAY, "2026-10-12 09:45-11:00,18:30-21:30": no titles, only times; remind.mjs reads
// it). A reminder goes into each break between events, a few minutes after the event before it ends, so
// that 5-10 cards in every break finish the day. Times are minutes after midnight, in the zone the runner is set to
// (America/Toronto). Used by scripts/remind.mjs; tested in app/tests/remind-slots.test.mjs.

/** The rule, in minutes: the day reminders may fall in, the shortest break worth one, how long into a
 *  break it comes, how often within a long one, the least time between two, and the most in a day. */
export const RULE = { from: 8 * 60 + 30, to: 22 * 60, minBreak: 20, intoBreak: 5, every: 150, apart: 60, most: 6 };

/** When the phone sent nothing for today (#224's hours). */
export const FALLBACK = [9 * 60, 20 * 60];

/** The phone's value, or null when it is not one (any block malformed, a time out of range). A block
 *  ending before its start runs past midnight; one ending at its start (a moment, "00:00-00:00") takes no time. */
export function parseDay(value) {
  const m = /^(\d{4}-\d{2}-\d{2})(?:\s+([\s\S]*))?$/.exec((value ?? "").trim());
  if (!m) return null;
  const busy = [];
  for (const part of (m[2] ?? "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean)) {
    const t = /^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/.exec(part);
    if (!t || +t[1] > 23 || +t[3] > 23 || +t[2] > 59 || +t[4] > 59) return null;
    const a = +t[1] * 60 + +t[2], b = +t[3] * 60 + +t[4];
    if (b !== a) busy.push([a, b > a ? b : 24 * 60]);
  }
  return { date: m[1], busy };
}

/** The day's reminder times: one into each break, more every `every` minutes in a long one, never two
 *  within `apart`, at most `most` (the first, the last and evenly between them). A day with no events is
 *  one long break. */
export function slots(busy, rule = RULE) {
  const merged = [];
  for (const [a, b] of [...busy].sort((x, y) => x[0] - y[0])) {
    const last = merged[merged.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  // the free stretches of the day; `afterEvent`: one starts as an event ends, so its reminder waits a little
  const free = [];
  let at = rule.from;
  for (const [a, b] of merged) {
    if (a > at) free.push({ a: at, b: Math.min(a, rule.to), afterEvent: at > rule.from });
    at = Math.max(at, b);
  }
  free.push({ a: at, b: rule.to, afterEvent: at > rule.from });
  const out = [];
  for (const { a, b, afterEvent } of free) {
    if (b - a < rule.minBreak) continue;
    // half the shortest break still ahead, so there is time for a few cards
    for (let t = a + (afterEvent ? rule.intoBreak : 0); t <= b - rule.minBreak / 2; t += rule.every) {
      if (!out.length || t - out[out.length - 1] >= rule.apart) out.push(t);
    }
  }
  if (out.length <= rule.most) return out;
  return Array.from({ length: rule.most }, (_, i) => out[Math.round((i * (out.length - 1)) / (rule.most - 1))]);
}

/** The local date of a time, "2026-10-12". */
export function localDate(ms) {
  const d = new Date(ms), p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** A time of a local date, minutes after its midnight. */
export function timeOf(date, minutes) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 0, minutes).getTime();
}

/** Whether a reminder falls in (from, to]: today's times from the phone, or the fallback hours when it sent
 *  nothing for today (no value, a malformed one, yesterday's). */
export function due(value, from, to) {
  return dueIn(parseDay(value), from, to);
}

/** due() for a value already parsed. */
export function dueIn(day, from, to) {
  const date = localDate(to);
  const times = day && day.date === date ? slots(day.busy) : FALLBACK;
  return times.some((m) => { const t = timeOf(date, m); return t > from && t <= to; });
}
