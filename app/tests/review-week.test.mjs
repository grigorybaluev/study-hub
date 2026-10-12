// Sessions and the week (#243) in node: `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { dayStart } from "../src/review/engine.ts";
import { localDate } from "../src/review/term.ts";
import { duration, sessions, weekLine, reviewWeekStart, weeks } from "../src/review/week.ts";

const MIN = 60_000, H = 60 * MIN;
const at = (iso, h) => localDate(iso) + h * H;
let n = 0;
// when each card was first graded, as Engine.firstSeen gives it
const seenIn = (log) => { const m = new Map(); for (const r of log) if (!m.has(r.card)) m.set(r.card, r.ts); return (id) => m.get(id); };
const grade = (card, ts, rating = 3, type = "review", ms = 10_000) => ({ id: `d-${n++}`, card, ts, rating, ms, type, hash: "h" });

test("the review week starts on Monday's review day, 4 am", () => {
  const mon = dayStart(at("2026-10-12", 9));
  assert.equal(reviewWeekStart(at("2026-10-12", 9)), mon);
  assert.equal(reviewWeekStart(at("2026-10-18", 23)), mon);           // Sunday night
  assert.equal(reviewWeekStart(at("2026-10-19", 2)), mon);            // Monday before 4 am: still Sunday's review day
  assert.equal(reviewWeekStart(at("2026-10-19", 5)), dayStart(at("2026-10-19", 5)));
});

test("grades less than five minutes apart are one session, from the first card shown", () => {
  const t = at("2026-10-12", 10);
  const log = [grade("a", t), grade("b", t + 2 * MIN), grade("a", t + 6 * MIN), grade("c", t + 12 * MIN)];
  assert.deepEqual(sessions(log), [
    { start: t - 10_000, end: t + 6 * MIN, grades: 3, cards: 2 },
    { start: t + 12 * MIN - 10_000, end: t + 12 * MIN, grades: 1, cards: 1 },
  ]);
});

test("a week: days closed, cards, new cards, time, sessions, recall and reminders acted on", () => {
  const mon = at("2026-10-12", 10), tue = at("2026-10-13", 18);
  const log = [
    grade("old", at("2026-10-05", 10), 3, "learn"),                     // last week: not new this week
    grade("old", mon, 1), grade("a", mon + MIN, 3, "learn"), grade("old", mon + 2 * MIN, 3, "relearn"),
    grade("b", tue, 4, "learn"), grade("old", tue + MIN, 3),
  ];
  const arrivals = [mon - 3 * MIN, tue - 40 * MIN, at("2026-10-14", 12)];   // acted on, not, not
  const [last, w] = weeks(log, [dayStart(mon)], arrivals, seenIn(log), at("2026-10-14", 13), 2);
  assert.equal(last.cards, 1);
  assert.equal(w.closed, 1);
  assert.deepEqual(w.days.map((d) => d.closed), [true, false, false, false, false, false, false]);
  assert.equal(w.cards, 3);
  assert.equal(w.grades, 5);
  assert.equal(w.fresh, 2);
  assert.equal(w.ms, 50_000);
  assert.equal(w.sessions, 2);
  assert.deepEqual(w.recall, { passed: 1, total: 2 });
  assert.deepEqual(w.reminders, { arrived: 3, acted: 1 });
  assert.deepEqual(w.days[1].reminders, [tue - 40 * MIN]);
  assert.equal(w.days[0].sessions.length, 1);
  assert.equal(weekLine(w).until, w.to);
  assert.equal(weekLine(w).time, "1 min");
  assert.deepEqual([duration(45 * MIN), duration(192 * MIN)], ["45 min", "3 h 12 min"]);
});

test("the weeks run oldest first and cover empty weeks", () => {
  const ws = weeks([], [], [], () => undefined, at("2026-10-14", 12), 8);
  assert.equal(ws.length, 8);
  for (let i = 1; i < 8; i++) assert.equal(ws[i].from, ws[i - 1].to);
  assert.deepEqual([ws[7].cards, ws[7].sessions, ws[7].typical], [0, 0, 0]);
});
