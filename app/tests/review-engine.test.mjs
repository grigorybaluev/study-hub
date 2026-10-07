// The review engine (#192) in node: `npm test`. Node 22.6+ runs the TypeScript source directly.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createEmptyCard, fsrs, generatorParameters } from "ts-fsrs";
import { DEFAULT_SETTINGS, Engine, dayStart } from "../src/review/engine.ts";

const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const T0 = new Date(2026, 9, 7, 9, 0).getTime();            // 9 am local, well inside a review day
const opts = (now, device = "dev1") => ({ now, ms: 4000, hash: "h", device });

test("a sequence of grades schedules exactly as ts-fsrs does", () => {
  const e = new Engine();
  const f = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: false }));
  let card = createEmptyCard(new Date(T0)), now = T0;
  for (const rating of [3, 3, 1, 3, 4, 2, 3]) {
    e.grade("c", rating, opts(now));
    card = f.next(card, new Date(now), rating).card;
    assert.equal(e.state("c").due, card.due.getTime());
    assert.equal(e.state("c").stability, card.stability);
    now = card.due.getTime() + MIN;                         // come back when it is due
  }
});

test("the review type follows Anki's revlog: learn, review, relearn", () => {
  const e = new Engine();
  let now = T0;
  const types = [];
  for (const rating of [3, 3, 3, 1, 3]) {
    types.push(e.grade("c", rating, opts(now)).type);
    now = e.state("c").due + MIN;
  }
  assert.deepEqual(types, ["learn", "learn", "review", "review", "relearn"]);
});

test("undo restores the state before the last grade", () => {
  const e = new Engine();
  e.grade("c", 3, opts(T0));
  const before = e.state("c");
  e.grade("c", 1, opts(T0 + 10 * MIN));
  const undone = e.undo();
  assert.equal(undone.rating, 1);
  assert.deepEqual(e.state("c"), before);
  assert.equal(e.undo().rating, 3);
  assert.equal(e.state("c"), null);
});

test("replay depends on time, not on the order records arrive in", () => {
  const e = new Engine();
  let now = T0;
  for (let i = 0; i < 30; i++) {
    const card = `c${i % 4}`;
    e.grade(card, [1, 2, 3, 4][i % 4], opts(now));
    now += 7 * HOUR;
  }
  const shuffled = [...e.log].sort(() => Math.random() - 0.5);
  const again = new Engine(shuffled);
  for (const c of ["c0", "c1", "c2", "c3"]) assert.deepEqual(again.state(c), e.state(c));
});

test("merge is commutative and idempotent (#193)", () => {
  const a = new Engine(), b = new Engine();
  let now = T0;
  for (let i = 0; i < 10; i++) {
    a.grade(`c${i % 3}`, 3, opts(now, "phone"));
    b.grade(`c${i % 2}`, 2, opts(now + 1, "mac"));
    now += 5 * HOUR;
  }
  const ab = new Engine(a.log); ab.merge(b.log);
  const ba = new Engine(b.log); ba.merge(a.log);
  for (const c of ["c0", "c1", "c2"]) assert.deepEqual(ab.state(c), ba.state(c));
  assert.equal(ab.merge(b.log), 0);
  assert.equal(ab.log.length, 20);
});

test("the queue keeps the daily new-card limit and lists due cards first", () => {
  const cards = Array.from({ length: 40 }, (_, i) => `c${i}`);
  const e = new Engine([], { ...DEFAULT_SETTINGS, newPerDay: 15 });
  assert.equal(e.queue(cards, T0).fresh.length, 15);
  for (let i = 0; i < 5; i++) e.grade(`c${i}`, 3, opts(T0 + i * 1000));
  const q = e.queue(cards, T0 + 5000);
  assert.equal(q.fresh.length, 10);                          // 5 of today's 15 are used
  assert.deepEqual(q.fresh.slice(0, 2), ["c5", "c6"]);       // new cards come in the given order
  assert.equal(q.later.length, 5);                           // in their learning steps later today
  const after = e.queue(cards, T0 + 20 * MIN);
  assert.equal(after.due.length, 5);                         // the learning steps are due now
});

test("the review limit holds back reviews but never learning steps", () => {
  const e = new Engine([], { ...DEFAULT_SETTINGS, reviewsPerDay: 3 });
  let now = T0 - 30 * DAY;
  for (let i = 0; i < 8; i++) { e.grade(`r${i}`, 4, opts(now + i)); }   // Easy: straight to review
  e.grade("l", 3, opts(T0 + 2 * DAY));                                     // in learning
  const q = e.queue([...Array.from({ length: 8 }, (_, i) => `r${i}`), "l"], T0 + 2 * DAY + 15 * MIN);
  assert.equal(q.due.filter((c) => c.startsWith("r")).length, 3);
  assert.ok(q.due.includes("l"));
});

test("a review day starts at 4 am", () => {
  const d = (h) => new Date(2026, 9, 7, h, 30).getTime();
  assert.equal(dayStart(d(3)), new Date(2026, 9, 6, 4).getTime());
  assert.equal(dayStart(d(4)), new Date(2026, 9, 7, 4).getTime());
  assert.equal(dayStart(d(23)), new Date(2026, 9, 7, 4).getTime());
});

test("preview gives the four next due times, in grade order", () => {
  const e = new Engine();
  const p = e.preview("new-card", T0);
  assert.ok(p[1] < p[2] && p[2] < p[3] && p[3] < p[4]);
});

test("mastery tiers follow stability", () => {
  const e = new Engine();
  assert.equal(e.mastery("x").tier, "new");
  let now = T0;
  e.grade("x", 3, opts(now));
  assert.equal(e.mastery("x").tier, "learning");
  for (let i = 0; i < 6; i++) { now = e.state("x").due + MIN; e.grade("x", 4, opts(now)); }
  const m = e.mastery("x");
  assert.ok(m.stability > 30 && ["silver", "gold", "diamond"].includes(m.tier), `${m.tier} ${m.stability}`);
});

// ~80 ms on a 2019 Mac; the bound only guards against a regression (CI machines vary)
test("replaying 5,000 reviews stays fast", () => {
  const log = [];
  let now = T0;
  for (let i = 0; i < 5000; i++) { log.push({ id: `d-${i}`, card: `c${i % 300}`, ts: now, rating: [1, 3, 3, 4][i % 4], ms: 3000, type: "review", hash: "h" }); now += 37 * MIN; }
  const t = performance.now();
  const e = new Engine(log);
  const took = performance.now() - t;
  assert.equal(e.stats(now).reviews, 5000);
  assert.ok(took < 300, `${took.toFixed(1)} ms`);
});
