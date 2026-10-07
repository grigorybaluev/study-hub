// Days, streaks and mastery (#195) in node: `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Engine, dayStart, tierOf } from "../src/review/engine.ts";
import { DAY_GOAL, calendar, conceptMastery, milestones, perDay, streak } from "../src/review/days.ts";

const DAY = 86_400_000;
const T0 = new Date(2026, 9, 7, 10, 0).getTime();       // a Wednesday, 10 am
/** n grades on the day `back` days before T0 */
const day = (back, n) => Array.from({ length: n }, (_, i) => ({ id: `d-${back}-${i}`, card: `c${i}`, ts: T0 - back * DAY + i * 1000, rating: 3, ms: 2000, type: "review", hash: "h" }));

test("grades are counted per review day (the day turns at 4 am)", () => {
  const late = new Date(2026, 9, 7, 2, 0).getTime();      // 2 am belongs to the day before
  const m = perDay([{ id: "a", card: "c", ts: late, rating: 3, ms: 1, type: "learn", hash: "h" }, ...day(0, 2)]);
  assert.equal(m.get(dayStart(late)), 1);
  assert.equal(m.get(dayStart(T0)), 2);
});

test("a run of days counts, and today adds once it reaches the goal", () => {
  const log = [...day(3, DAY_GOAL), ...day(2, DAY_GOAL), ...day(1, DAY_GOAL), ...day(0, 3)];
  const s = streak(log, [], T0);
  assert.deepEqual([s.current, s.today], [3, false]);         // today not yet: the run is not broken
  assert.equal(streak([...log, ...day(0, DAY_GOAL)], [], T0).current, 4);
});

test("a cleared deck counts even with fewer grades than the goal", () => {
  const log = [...day(1, 3), ...day(0, 2)];
  assert.equal(streak(log, [], T0).current, 0);
  assert.equal(streak(log, [T0 - DAY, T0], T0).current, 2);
});

test("a freeze earned by 7 days covers one missed day; without one the run starts again", () => {
  const week = Array.from({ length: 7 }, (_, i) => day(10 - i, DAY_GOAL)).flat();   // days 10..4 ago
  const missOne = [...week, ...day(2, DAY_GOAL), ...day(1, DAY_GOAL)];             // day 3 ago missed
  const s = streak(missOne, [], T0);
  assert.equal(s.frozen.length, 1);
  assert.equal(s.current, 9);                                 // 7 + 2, the frozen day adds nothing
  assert.equal(s.freezes, 0);
  const shortRun = [...day(5, DAY_GOAL), ...day(4, DAY_GOAL), ...day(2, DAY_GOAL), ...day(1, DAY_GOAL)];
  assert.equal(streak(shortRun, [], T0).current, 2);          // no freeze held: day 3 broke it
  assert.equal(streak(shortRun, [], T0).best, 2);
});

test("at most two freezes are held", () => {
  const long = Array.from({ length: 28 }, (_, i) => day(28 - i, DAY_GOAL)).flat();   // 28 days ending yesterday
  assert.equal(streak(long, [], T0).freezes, 2);
});

test("the calendar is 26 columns of 7 days, Monday first, ending with today's week", () => {
  const cols = calendar([...day(0, 4), ...day(1, 2)], T0);
  assert.equal(cols.length, 26);
  assert.ok(cols.every((c) => c.length === 7));
  assert.equal(new Date(cols[0][0].day).getDay(), 1);         // Monday
  const flat = cols.flat();
  assert.equal(flat.find((x) => x.day === dayStart(T0)).count, 4);
  assert.equal(flat.find((x) => x.day === dayStart(T0 - DAY)).count, 2);
  assert.ok(flat.filter((x) => x.count === -1).length < 7);  // only the rest of this week is in the future
});

test("a concept takes the mean stability of its cards; unseen cards pull it down", () => {
  const e = new Engine();
  let now = T0;
  for (let i = 0; i < 8; i++) { e.grade("a", 3, { now, ms: 1, hash: "h", device: "d" }); now = e.state("a").due + 60_000; }
  const cards = [{ id: "a", concepts: ["k"] }, { id: "b", concepts: ["k"] }, { id: "c", concepts: ["j"] }];
  const m = conceptMastery(e, cards);
  assert.equal(m.get("j").tier, "new");
  assert.equal(m.get("k").seen, 1);
  assert.equal(m.get("k").stability, e.mastery("a").stability / 2);
  assert.equal(m.get("k").tier, tierOf(e.mastery("a").stability / 2));
});

test("milestones come from memory and days, not from one sitting", () => {
  const e = new Engine();
  for (let i = 0; i < 30; i++) e.grade(`c${i}`, 4, { now: T0 + i, ms: 1, hash: "h", device: "d" });
  const ms = milestones(e, Array.from({ length: 30 }, (_, i) => ({ id: `c${i}`, course: "x" })), streak(e.log, [], T0));
  const reached = Object.fromEntries(ms.map((m) => [m.id, m.reached]));
  assert.equal(reached.first, true);
  assert.equal(reached.gold, false);
  assert.equal(reached.week, false);
  assert.equal(reached.thousand, false);
});

test("a gap longer than the freezes held spends none and breaks the run", () => {
  const twoWeeks = Array.from({ length: 14 }, (_, i) => day(20 - i, DAY_GOAL)).flat();   // days 20..7 ago: 2 freezes
  const log = [...twoWeeks, ...day(3, DAY_GOAL), ...day(2, DAY_GOAL), ...day(1, DAY_GOAL)]; // days 6..4 missed: 3 > 2
  const s = streak(log, [], T0);
  assert.deepEqual(s.frozen, []);
  assert.equal(s.current, 3);
  assert.equal(s.freezes, 2);                                  // too few to bridge 3 days: none spent, both kept
  assert.equal(s.best, 14);
});

test("a card back in its relearning steps counts 0 days for its concept", () => {
  const e = new Engine();
  let now = T0;
  for (let i = 0; i < 8; i++) { e.grade("a", 3, { now, ms: 1, hash: "h", device: "d" }); now = e.state("a").due + 60_000; }
  e.grade("a", 1, { now, ms: 1, hash: "h", device: "d" });     // forgotten: relearning, stability still high
  assert.equal(e.mastery("a").tier, "learning");
  assert.equal(conceptMastery(e, [{ id: "a", concepts: ["k"] }]).get("k").tier, "learning");
});
