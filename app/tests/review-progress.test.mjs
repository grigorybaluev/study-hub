// The day's progress in the reminders (#242) in node: `npm test`. The counts the app saves, and the words
// the service worker (public/push-sw.js) makes of them.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import { DEFAULT_SETTINGS, Engine, nextDay } from "../src/review/engine.ts";
import { dayProgress } from "../src/review/progress.ts";

const MIN = 60_000, HOUR = 60 * MIN;
const T0 = new Date(2026, 9, 7, 9, 0).getTime();            // 9 am local, well inside a review day
const opts = (now) => ({ now, ms: 4000, hash: "h", device: "dev1" });
const ids = (n) => Array.from({ length: n }, (_, i) => `c${i}`);

test("a fresh morning: nothing done, the day's new cards left, tomorrow's as many", () => {
  const e = new Engine([], { ...DEFAULT_SETTINGS, newPerDay: 5 });
  assert.deepEqual(dayProgress(e, ids(20), T0), { done: 0, left: 5, next: 5 });
});

test("a card is done once it leaves today's queue; a failed one is still left", () => {
  const e = new Engine([], { ...DEFAULT_SETTINGS, newPerDay: 3 });
  const cards = ids(10);
  e.grade("c0", 4, opts(T0));                 // Easy: out of today
  e.grade("c1", 1, opts(T0 + MIN));           // Again: a learning step later today
  const p = dayProgress(e, cards, T0 + 2 * MIN);
  assert.equal(p.done, 1);
  assert.equal(p.left, 2);                     // c1's step and c2, the third new card
  // the next day: c1, unfinished, and three new cards (c2 has not been started, so it is one of them)
  assert.equal(p.next, 4);
});

test("the next day counts today's leftovers once they are due", () => {
  const e = new Engine([], { ...DEFAULT_SETTINGS, newPerDay: 0 });
  e.grade("a", 3, opts(T0 - 10 * 24 * HOUR));
  e.grade("a", 3, opts(T0 - 10 * 24 * HOUR + 10 * MIN));   // graduated: due in a few days
  const due = e.state("a").due;
  const p = dayProgress(e, ["a"], due - 24 * HOUR);       // the day before it is due
  assert.deepEqual(p, { done: 0, left: 0, next: 1 });
  assert.equal(dayProgress(e, ["a"], due).left, 1);
});

// the service worker's functions, run as the worker would with caches holding `state`
function worker(state) {
  const self = { addEventListener() {}, registration: {} };
  const caches = { open: async () => ({ match: async () => state && { json: async () => state } }) };
  const ctx = vm.createContext({ self, caches, console });
  vm.runInContext(readFileSync(new URL("../public/push-sw.js", import.meta.url), "utf8"), ctx);
  return ctx;
}

test("the words: a count in the morning, done out of the total, what is left in the evening, done", () => {
  const { words } = worker(null);
  assert.equal(words({ done: 0, left: 70 }, 8).title, "70 cards today");
  assert.equal(words({ done: 20, left: 50 }, 13).title, "20 / 70 done · 50 to go");
  assert.equal(words({ done: 55, left: 15 }, 20).title, "Just 15 cards left to close today");
  assert.equal(words({ done: 20, left: 50 }, 20).title, "50 cards left to close today");
  assert.equal(words({ done: 70, left: 0 }, 21).title, "Done for today ✓");
  assert.equal(words({ done: 0, left: 1 }, 15).title, "1 card today");
  assert.equal(words({ done: 0, left: 0 }, 9).title, "Nothing to review today");
});

test("the saved state: today's until its end, then the next day's count, then nothing", async () => {
  const until = nextDay(T0), nextUntil = nextDay(until);
  const { progress } = worker({ done: 3, left: 7, next: 12, until, nextUntil });
  assert.deepEqual({ ...(await progress(T0)) }, { done: 3, left: 7 });
  assert.deepEqual({ ...(await progress(until + HOUR)) }, { done: 0, left: 12 });
  assert.equal(await progress(nextUntil + HOUR), null);
  // a state from before #242: no done, no next
  const old = worker({ left: 4, until });
  assert.deepEqual({ ...(await old.progress(T0)) }, { done: 0, left: 4 });
  assert.equal(await old.progress(until + HOUR), null);
});
