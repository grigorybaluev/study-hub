// What to study next (#222) in node: `npm test`. Each unit's status, and which units come first.
import assert from "node:assert/strict";
import { test } from "node:test";
import { coverage, suggestions } from "../src/review/coverage.ts";
import { Engine } from "../src/review/engine.ts";
import { localDate } from "../src/review/term.ts";

const H = 3_600_000;
const at = (iso, h = 12) => localDate(iso) + h * H;
const card = (id, course, unit) => ({ id, course, unit, kind: "definition", front: id, back: "", order: 1, part: null, part_title: null, concepts: [], hash: "h" });
const WEEKS = { u1: [1], u2: [2], u3: [3], u6: [6], v1: [1] };
const CARDS = [
  card("a1", "A", "u1"), card("a2", "A", "u1"), card("a3", "A", "u2"), card("a4", "A", "u3"), card("a6", "A", "u6"),
  card("b1", "B", "v1"), card("b2", "B", "v1"), card("m1", "A", null),
];
const TAUGHT = new Set(["u1", "u2", "u3", "v1"]);   // u6 is not taught yet

function input(engine, now, exams = []) {
  return {
    cards: CARDS, exams, isTaught: (c) => !c.unit || TAUGHT.has(c.unit), unitWeeks: (u) => WEEKS[u] ?? [],
    due: (id) => engine.state(id)?.due, recallAt: (id, t) => engine.recallAt(id, t), now, target: 0.9,
  };
}
const grade = (e, id, ts, r = 3) => e.grade(id, r, { now: ts, ms: 1000, hash: "h", device: "d" });
const learn = (e, id, ts, r = 3) => { grade(e, id, ts); grade(e, id, ts + 0.2 * H, r); };   // out of learning
const by = (rows) => Object.fromEntries(rows.map((r) => [r.unit, r]));

test("statuses: not taught, to start (also when partly started), weak when overdue, solid", () => {
  const e = new Engine();
  learn(e, "a1", at("2026-10-01"));                    // u1 partly started
  learn(e, "a3", at("2026-10-01"));                    // u2: overdue by the 10th
  learn(e, "a4", at("2026-10-09"), 4);                 // u3: just learned, Easy
  const rows = by(coverage(input(e, at("2026-10-10"))));
  assert.deepEqual(Object.keys(rows), ["u1", "u2", "u3", "u6", "v1"]);   // units with cards only, in card order
  assert.equal(rows.u1.status, "start");
  assert.equal(rows.u1.unstarted, 1);
  assert.equal(rows.u2.status, "weak");
  assert.equal(rows.u2.overdue, 1);
  assert.equal(rows.u2.due, 1);
  assert.equal(rows.u3.status, "solid");
  assert.equal(rows.u6.status, "untaught");
  assert.equal(rows.u6.unstarted, 0);
  assert.equal(rows.v1.status, "start");
});

test("a unit is weak when its mean recall falls below the target, even with nothing overdue", () => {
  const e = new Engine();
  learn(e, "a4", at("2026-10-01"));
  const due = e.state("a4").due;
  const now = due - H;                                  // just before it falls due: recall near 0.9, not overdue
  const lo = by(coverage({ ...input(e, now), target: 0.99 })).u3;
  const hi = by(coverage({ ...input(e, now), target: 0.5 })).u3;
  assert.equal(lo.overdue, 0);
  assert.equal(lo.status, "weak");
  assert.equal(hi.status, "solid");
});

test("a unit seen ahead of its teaching is not 'not taught'", () => {
  const e = new Engine();
  learn(e, "a6", at("2026-10-09"), 4);
  assert.equal(by(coverage(input(e, at("2026-10-10")))).u6.status, "solid");
});

test("priority: cards likely lost by the exam's morning per day left; the units an exam covers come first", () => {
  const e = new Engine();
  learn(e, "a3", at("2026-10-01"));
  learn(e, "a4", at("2026-10-09"), 4);
  const exams = [
    { course: "A", index: 0, name: "Midterm", date: localDate("2026-10-20"), weeks: [1, 3] },
    { course: "B", index: 0, name: "Midterm", date: localDate("2026-11-30"), weeks: [9, 12] },   // covers no unit of B
  ];
  const now = at("2026-10-10");
  const rows = coverage(input(e, now, exams));
  const u = by(rows);
  assert.equal(u.u1.exam.days, 10);
  assert.equal(u.u1.priority, 2 / 10);                  // two cards not started
  const morning = localDate("2026-10-20") + 9 * H;
  assert.ok(Math.abs(u.u2.priority - (1 - e.recallAt("a3", morning)) / 10) < 1e-12);
  assert.equal(u.v1.exam, null);
  assert.equal(u.v1.priority, 2);                       // no exam: the cards behind
  // v1 has the largest number but no exam: it comes after u1 and u2; u3 is solid, u6 not taught
  assert.deepEqual(suggestions(rows).map((r) => r.unit), ["u1", "u2", "v1"]);
  assert.deepEqual(suggestions(rows, 1).map((r) => r.unit), ["u1"]);
});

test("a past exam does not count", () => {
  const exams = [{ course: "A", index: 0, name: "Midterm", date: localDate("2026-10-01"), weeks: [1, 3] }];
  const u = by(coverage(input(new Engine(), at("2026-10-10"), exams)));
  assert.equal(u.u1.exam, null);
  assert.equal(u.u1.priority, 2);
});
