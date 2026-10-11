// The stats page's Anki sections (#225) in node: `npm test`. Each number as Anki computes it.
import assert from "node:assert/strict";
import { test } from "node:test";
import { buttons, counts, daysBack, forecast, retentionByCourse, today, trueRetention } from "../src/review/ankiStats.ts";
import { Engine, dayStart, nextDay } from "../src/review/engine.ts";
import { localDate } from "../src/review/term.ts";

const H = 3_600_000, D = 24 * H;
const at = (iso, h = 12) => localDate(iso) + h * H;
const entry = (card, ts, rating, type, lastIvl = 0) => ({ review: { id: `d-${ts}`, card, ts, rating, ms: 2000, type, hash: "h" }, ivl: 1, lastIvl });

test("today: grades since 4 am by type, Again count, mature correct", () => {
  const now = at("2026-10-10", 15);
  const log = [
    entry("x", at("2026-10-10", 3), 3, "review", 30),     // before 4 am: yesterday's review day
    entry("a", at("2026-10-10", 9), 1, "learn"),
    entry("a", at("2026-10-10", 9.1), 3, "learn"),
    entry("b", at("2026-10-10", 10), 3, "review", 5),
    entry("c", at("2026-10-10", 11), 1, "review", 40),
    entry("c", at("2026-10-10", 11.2), 3, "relearn"),
    entry("d", at("2026-10-10", 12), 4, "review", 21),
  ];
  assert.deepEqual(today(log, now), { graded: 6, ms: 12000, again: 2, learn: 2, review: 3, relearn: 1, mature: { correct: 1, total: 2 } });
});

test("card counts: new, learning, relearning, young and mature by interval", () => {
  const S = (state, days) => ({ due: at("2026-10-10") + days * D, last: at("2026-10-10"), state, stability: 1, difficulty: 5, reps: 1, lapses: 0, stepsLeft: 0, hash: "h" });
  const st = { a: S("learning", 0), b: S("relearning", 0), c: S("review", 20), d: S("review", 21), e: S("review", 300) };
  assert.deepEqual(counts(["a", "b", "c", "d", "e", "f"], (id) => st[id] ?? null), { new: 1, learning: 1, relearning: 1, young: 1, mature: 2 });
});

test("forecast: today holds the overdue and today's steps; later cards fall on their review day; by course", () => {
  const now = at("2026-10-10", 15);
  const due = { a: at("2026-10-05"), b: at("2026-10-10", 23), c: at("2026-10-11", 2), d: at("2026-10-11", 5), e: at("2026-10-30") };
  const st = (id) => (due[id] ? { due: due[id] } : null);
  const f = forecast(["a", "b", "c", "d", "e", "new"], st, (id) => (id === "d" ? "B" : "A"), now, 3);
  assert.deepEqual(f.map((x) => x.day), [dayStart(now), nextDay(now), nextDay(nextDay(now))]);
  assert.deepEqual(f.map((x) => x.total), [3, 1, 0]);     // c at 2 am on the 11th is still the 10th's review day; e is past the window
  assert.deepEqual(f[1].courses, { B: 1 });
});

test("true retention: review grades only, young or mature by the interval before, by period", () => {
  const now = at("2026-10-10", 15);
  const log = [
    entry("a", at("2026-10-10", 9), 3, "review", 5),
    entry("b", at("2026-10-10", 9), 1, "review", 30),
    entry("c", at("2026-10-10", 9), 1, "learn"),             // a learning step: not counted
    entry("d", at("2026-10-09", 9), 3, "review", 30),        // yesterday
    entry("e", at("2026-10-01", 9), 3, "review", 2),         // within the month, not the week
    entry("f", at("2025-12-01", 9), 1, "review", 2),         // within the year
    entry("g", at("2024-01-01", 9), 3, "review", 2),         // only all time
  ];
  const rows = Object.fromEntries(trueRetention(log, now).map((r) => [r.label, r]));
  assert.deepEqual(rows.Today, { label: "Today", young: { passed: 1, total: 1 }, mature: { passed: 0, total: 1 }, all: { passed: 1, total: 2 } });
  assert.deepEqual(rows.Yesterday.all, { passed: 1, total: 1 });
  assert.deepEqual(rows["Last week"].all, { passed: 2, total: 3 });
  assert.deepEqual(rows["Last month"].all, { passed: 3, total: 4 });
  assert.deepEqual(rows["Last year"].all, { passed: 3, total: 5 });
  assert.deepEqual(rows["All time"].all, { passed: 4, total: 6 });
  assert.deepEqual(trueRetention(log, now, (c) => c === "b")[0].mature, { passed: 0, total: 1 });
});

test("answer buttons: learning (learn and relearn), young and mature, over the last 30 review days", () => {
  const now = at("2026-10-10", 15);
  const log = [
    entry("a", at("2026-10-10", 9), 1, "learn"), entry("a", at("2026-10-10", 9), 3, "relearn"),
    entry("b", at("2026-10-10", 9), 2, "review", 3), entry("c", at("2026-10-10", 9), 4, "review", 21),
    entry("d", daysBack(now, 30) + H, 3, "review", 3),        // 31 review days ago: out
  ];
  assert.deepEqual(buttons(log, now), {
    learning: { 1: 1, 2: 0, 3: 1, 4: 0 }, young: { 1: 0, 2: 1, 3: 0, 4: 0 }, mature: { 1: 0, 2: 0, 3: 0, 4: 1 },
  });
});

test("from a real engine: the replay's intervals make the young/mature split", () => {
  const e = new Engine();
  let t = at("2026-01-01");
  e.grade("a", 3, { now: t, ms: 1, hash: "h", device: "d" });
  for (let i = 0; i < 6; i++) { t = e.state("a").due + H; e.grade("a", 3, { now: t, ms: 1, hash: "h", device: "d" }); }
  const log = e.revlog();
  const rows = trueRetention(log, t + H);
  const all = rows.find((r) => r.label === "All time");
  assert.equal(all.all.total, log.filter((x) => x.review.type === "review").length);
  assert.ok(all.mature.total >= 1, "the interval passes 21 days within six good reviews");
  assert.equal(counts(["a"], (id) => e.state(id)).mature, 1);
});

test("true retention by course: last month only, review grades only, one row per course", () => {
  const now = at("2026-10-10", 15);
  const log = [
    entry("A/1", at("2026-10-10", 9), 3, "review", 5), entry("A/2", at("2026-10-01", 9), 1, "review", 30),
    entry("B/1", at("2026-10-05", 9), 3, "review", 40), entry("B/1", at("2026-10-05", 9), 1, "learn"),
    entry("B/2", at("2026-08-01", 9), 3, "review", 40),       // older than a month
  ];
  const by = retentionByCourse(log, now, (id) => id.split("/")[0]);
  assert.deepEqual([...by.keys()], ["A", "B"]);
  assert.deepEqual(by.get("A"), { young: { passed: 1, total: 1 }, mature: { passed: 0, total: 1 }, all: { passed: 1, total: 2 } });
  assert.deepEqual(by.get("B").all, { passed: 1, total: 1 });
  assert.deepEqual(by.get("B").all, trueRetention(log, now, (c) => c.startsWith("B/"))[3].all);   // the same as the "Last month" row
});
