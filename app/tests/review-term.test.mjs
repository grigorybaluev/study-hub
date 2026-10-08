// The term (#221) in node: `npm test`. Teaching weeks as dates, taught units, exam plans, the daily deck.
import assert from "node:assert/strict";
import { test } from "node:test";
import { covers, daysUntil, examDaily, examPlans, introWindow, localDate, taught, weakAt, weekStart } from "../src/review/term.ts";
import { Engine } from "../src/review/engine.ts";
import { parseScope, scopeQuery } from "../src/review/scope.ts";

const FALL = { start: "2026-09-07", breaks: ["2026-10-12"] };
const at = (iso, h = 12) => localDate(iso) + h * 3_600_000;
const iso = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

test("teaching weeks skip the break: week 5 starts 5 Oct, week 6 on 19 Oct", () => {
  assert.equal(iso(weekStart(FALL, 1)), "2026-09-07");
  assert.equal(iso(weekStart(FALL, 5)), "2026-10-05");
  assert.equal(iso(weekStart(FALL, 6)), "2026-10-19");
  assert.equal(iso(weekStart(FALL, 12)), "2026-11-30");
});

test("a unit is taught once its first week has begun; without weeks or a calendar, always", () => {
  assert.equal(taught(FALL, [6], at("2026-10-16")), false);   // the break: week 6 not begun
  assert.equal(taught(FALL, [6], at("2026-10-19")), true);
  assert.equal(taught(FALL, [5, 6], at("2026-10-08")), true);
  assert.equal(taught(FALL, [], at("2026-09-01")), true);
  assert.equal(taught(null, [12], at("2026-09-01")), true);
});

test("days left, and a window that front-loads new cards and leaves two days for reviews", () => {
  assert.equal(daysUntil(localDate("2026-10-19"), at("2026-10-08")), 11);
  assert.equal(daysUntil(localDate("2026-10-19"), at("2026-10-19", 2)), 0);   // the exam's date, even before the day turns at 4 am
  assert.equal(daysUntil(localDate("2026-10-19"), at("2026-10-19")), 0);
  assert.deepEqual([0, 1, 2, 3, 5, 11, 17, 20].map(introWindow), [1, 1, 1, 1, 2, 5, 7, 8]);
});

const card = (id, course, unit) => ({ id, course, unit, kind: "definition", front: id, back: "", order: 1, part: null, part_title: null, concepts: [], hash: "h" });
const WEEKS = { u1: [1], u2: [2], u5: [5], u6: [6], v1: [1], v3: [3] };
const exam = (course, date, weeks, index = 0) => ({ course, index, name: "Midterm", date: localDate(date), weeks });

test("covers: any of a unit's weeks inside the exam's range", () => {
  const e = exam("A", "2026-10-19", [1, 5]);
  assert.equal(covers(e, [5, 6]), true);
  assert.equal(covers(e, [6]), false);
});

test("an exam's plan: its cards, what is not started, and today's share over the window", () => {
  const cards = [...Array.from({ length: 10 }, (_, i) => card(`a${i}`, "A", i < 6 ? "u1" : "u6")), card("b0", "B", "v1")];
  const now = at("2026-10-08");
  const seen = new Map([["a0", now - 5 * 86_400_000], ["a1", now - 3600_000]]);      // a0 before today, a1 today
  const [p] = examPlans({ cards, exams: [exam("A", "2026-10-19", [1, 5]), exam("A", "2026-09-30", [1, 2], 1)], unitWeeks: (u) => WEEKS[u], firstSeen: (id) => seen.get(id), now });
  assert.deepEqual(p.cards, ["a0", "a1", "a2", "a3", "a4", "a5"]);    // week 6 is outside; the past exam has no plan
  assert.deepEqual(p.fresh, ["a1", "a2", "a3", "a4", "a5"]);          // a1, started today, is still today's work
  assert.equal(p.startedToday, 1);
  assert.equal(p.days, 11);
  assert.equal(p.window, 5);
  assert.equal(p.perDay, 1);
});

test("the daily deck: today's exam quotas first, exams taking turns; untaught new cards left out", () => {
  const cards = [card("x", "C", "u1"), ...["a0", "a1", "a2"].map((id) => card(id, "A", "u1")), ...["b0", "b1"].map((id) => card(id, "B", "v1")), card("late", "A", "u6")];
  const now = at("2026-10-08");
  const plans = examPlans({ cards, exams: [exam("B", "2026-10-25", [1, 1]), exam("A", "2026-10-19", [1, 6])], unitWeeks: (u) => WEEKS[u], firstSeen: () => undefined, now });
  assert.deepEqual(plans.map((p) => [p.course, p.perDay]), [["A", 1], ["B", 1]]);   // A: 4 cards over 5 days; B: 2 over 7
  const isTaught = (c) => taught(FALL, WEEKS[c.unit], now);
  const { cards: order, newLeft } = examDaily(cards, plans, isTaught, () => false);
  assert.deepEqual(order.map((c) => c.id), ["a0", "b0", "x", "a1", "a2", "b1"]);    // "late" (week 6) not yet
  assert.equal(newLeft, 2);
});

test("bigger exams take more today, and a card already started today counts against its quota", () => {
  const cards = Array.from({ length: 40 }, (_, i) => card(`a${i}`, "A", "u1"));
  const now = at("2026-10-08");
  const today = new Map(Array.from({ length: 3 }, (_, i) => [`a${i}`, now - 60_000]));
  const plans = examPlans({ cards, exams: [exam("A", "2026-10-19", [1, 5])], unitWeeks: (u) => WEEKS[u], firstSeen: (id) => today.get(id), now });
  assert.equal(plans[0].perDay, 8);                                    // 40 over 5 days
  const { cards: order, newLeft } = examDaily(cards, plans, () => true, (id) => today.has(id));
  assert.deepEqual(order.slice(0, 5).map((c) => c.id), ["a3", "a4", "a5", "a6", "a7"]);   // 8 - 3 started = 5 first
  assert.equal(newLeft, 5);
});

test("the exams take turns from one grade to the next, the one furthest behind its quota first", () => {
  const cards = [...Array.from({ length: 20 }, (_, i) => card(`a${i}`, "A", "u1")), ...Array.from({ length: 10 }, (_, i) => card(`b${i}`, "B", "v1"))];
  const now = at("2026-10-08"), first = new Map();
  const step = () => {
    const plans = examPlans({ cards, exams: [exam("A", "2026-10-19", [1, 5]), exam("B", "2026-10-19", [1, 5])], unitWeeks: (u) => WEEKS[u], firstSeen: (id) => first.get(id), now });
    const next = examDaily(cards, plans, () => true, (id) => first.has(id)).cards[0];
    first.set(next.id, now);
    return next.course;
  };
  assert.equal(Array.from({ length: 6 }, step).join(""), "ABAABA");   // A's quota is 4, B's 2: two A's per B
});

test("an exam is over once its date has passed, even before the review day turns", () => {
  const cards = [card("a0", "A", "u1")];
  const plans = examPlans({ cards, exams: [exam("A", "2026-10-07", [1, 5])], unitWeeks: (u) => WEEKS[u], firstSeen: () => undefined, now: at("2026-10-08", 1) });
  assert.equal(plans.length, 0);
});

test("an exam scope round-trips through the query string", () => {
  const s = { kind: "exam", course: "concordia/MAST218", index: 0 };
  assert.deepEqual(parseScope(new URLSearchParams(scopeQuery(s).slice(1))), s);
});

test("an exam's weakest cards: those FSRS expects below 90 % on its morning, weakest first", () => {
  const e = new Engine(), t0 = at("2026-10-08");
  e.grade("easy", 4, { now: t0, ms: 1000, hash: "h", device: "d" });                 // Easy: days of stability
  e.grade("hard", 3, { now: t0, ms: 1000, hash: "h", device: "d" });
  e.grade("hard", 1, { now: t0 + 60_000, ms: 1000, hash: "h", device: "d" });       // a lapse in learning: weak
  const exam = localDate("2026-10-19");
  assert.ok(e.recallAt("hard", exam) < e.recallAt("easy", exam));
  assert.equal(e.recallAt("new", exam), 0);
  const weak = weakAt(["easy", "hard", "new"], exam, (id, t) => e.recallAt(id, t), (id) => e.seen(id));
  assert.equal(weak[0], "hard");                    // weakest first; a new card is not "weak", it is new
  assert.ok(!weak.includes("new"));
});
