// Where each course stands (#231) in node: `npm test`. Seen, behind, recall and exam readiness from a log.
import assert from "node:assert/strict";
import { test } from "node:test";
import { standing, summary } from "../src/review/standing.ts";
import { Engine } from "../src/review/engine.ts";
import { localDate } from "../src/review/term.ts";

const H = 3_600_000, D = 24 * H;
const at = (iso, h = 12) => localDate(iso) + h * H;
const card = (id, course, unit) => ({ id, course, unit, kind: "definition", front: id, back: "", order: 1, part: null, part_title: null, concepts: [], hash: "h" });
const WEEKS = { u1: [1], u2: [2], u6: [6], v1: [1] };
const CARDS = [card("a1", "A", "u1"), card("a2", "A", "u1"), card("a3", "A", "u2"), card("a6", "A", "u6"), card("b1", "B", "v1"), card("b2", "B", "v1")];
const TAUGHT = new Set(["u1", "u2", "v1"]);         // u6 is not taught yet

function input(engine, now, exams = []) {
  return {
    cards: CARDS, exams, isTaught: (c) => TAUGHT.has(c.unit), unitWeeks: (u) => WEEKS[u] ?? [],
    due: (id) => engine.state(id)?.due, recallAt: (id, t) => engine.recallAt(id, t), now,
  };
}
const grade = (e, id, ts, r = 3) => e.grade(id, r, { now: ts, ms: 1000, hash: "h", device: "d" });

test("nothing graded: every taught card is unstarted and behind; untaught cards are not counted", () => {
  const rows = standing(input(new Engine(), at("2026-10-10")));
  const a = rows.find((r) => r.course === "A");
  assert.deepEqual({ taught: a.taught, seen: a.seen, unstarted: a.unstarted, overdue: a.overdue, behind: a.behind, recall: a.recall },
    { taught: 3, seen: 0, unstarted: 3, overdue: 0, behind: 3, recall: null });
  assert.equal(rows.find((r) => r.course === "B").behind, 2);
});

test("a review due on an earlier day and not done is overdue; one due today is not", () => {
  const e = new Engine();
  grade(e, "a1", at("2026-10-01"));
  grade(e, "a1", at("2026-10-01", 12.2));            // out of learning: in review, due in a few days
  const due = e.state("a1").due;
  const onDue = standing(input(e, due + H))[0];      // the day it falls due: due, not overdue
  const later = standing(input(e, due + 2 * D))[0];  // two days on
  assert.equal(onDue.overdue, 0);
  assert.equal(later.overdue, 1);
  assert.equal(later.seen, 1);
  assert.equal(later.behind, 1 + 2);                 // overdue + a2, a3 unstarted
});

test("a card seen ahead of its unit counts as taught and seen, never as unstarted", () => {
  const e = new Engine();
  grade(e, "a6", at("2026-10-01"));
  const a = standing(input(e, at("2026-10-01", 13)))[0];
  assert.equal(a.taught, 4);
  assert.equal(a.seen, 1);
  assert.equal(a.unstarted, 3);
});

test("recall is the mean over seen cards, now", () => {
  const e = new Engine();
  grade(e, "b1", at("2026-10-01"));
  grade(e, "b2", at("2026-10-01"));
  const now = at("2026-10-03");
  const b = standing(input(e, now)).find((r) => r.course === "B");
  assert.ok(Math.abs(b.recall - (e.recallAt("b1", now) + e.recallAt("b2", now)) / 2) < 1e-12);
});

test("exam readiness: the mean recall on its morning, unstarted cards at 0; rows sort by the nearest exam", () => {
  const e = new Engine();
  for (const id of ["b1", "b2"]) { grade(e, id, at("2026-10-08")); grade(e, id, at("2026-10-08", 12.2), 4); }
  const exams = [
    { course: "A", index: 0, name: "Midterm", date: localDate("2026-10-28"), weeks: [1, 2] },
    { course: "B", index: 0, name: "Midterm", date: localDate("2026-10-12"), weeks: [1, 1] },
    { course: "B", index: 1, name: "Final", date: localDate("2026-12-12"), weeks: [1, 12] },
  ];
  const rows = standing(input(e, at("2026-10-10"), exams));
  assert.deepEqual(rows.map((r) => r.course), ["B", "A"]);
  const [b, a] = rows;
  assert.equal(b.exam.name, "Midterm");
  assert.equal(b.exam.days, 2);
  assert.equal(b.exam.cards, 2);
  const morning = localDate("2026-10-12") + 9 * H;
  assert.ok(Math.abs(b.exam.ready - (e.recallAt("b1", morning) + e.recallAt("b2", morning)) / 2) < 1e-12);
  assert.ok(b.exam.ready > 0.9);                     // two Easy cards hold two days on
  assert.equal(a.exam.cards, 3);                     // u1, u2: the exam's weeks
  assert.equal(a.exam.ready, 0);
  assert.deepEqual(summary(rows), { courses: 1, behind: 3, next: b });
});

test("an exam with no card in its weeks has no readiness", () => {
  const exams = [{ course: "A", index: 0, name: "Final", date: localDate("2026-12-12"), weeks: [9, 12] }];
  const a = standing(input(new Engine(), at("2026-10-10"), exams))[0];
  assert.equal(a.exam.cards, 0);
  assert.equal(a.exam.ready, null);
});

test("a past exam is not the next one", () => {
  const exams = [{ course: "A", index: 0, name: "Midterm", date: localDate("2026-10-01"), weeks: [1, 2] }];
  assert.equal(standing(input(new Engine(), at("2026-10-10"), exams))[0].exam, null);
});
