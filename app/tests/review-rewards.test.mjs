// Rewards (#195) in node: `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Engine } from "../src/review/engine.ts";
import { EMPTY_TALLY, quarterCrossed, rewardOf, tally } from "../src/review/rewards.ts";

const MIN = 60_000;
const T0 = new Date(2026, 9, 7, 9, 0).getTime();
const opts = (now) => ({ now, ms: 3000, hash: "h", device: "d" });

/** grade like the deck does: state and tier before, tier after, then the reward */
function graded(e, card, rating, now) {
  const before = { state: e.state(card), tier: e.mastery(card).tier };
  e.grade(card, rating, opts(now));
  return rewardOf(before, { tier: e.mastery(card).tier }, rating);
}

test("Again and Good earn the same feedback on the same card: only memory over time differs", () => {
  for (const history of [[], [3], [3, 3], [3, 3, 4]]) {
    const run = (last) => {
      const e = new Engine();
      let now = T0;
      for (const r of history) { e.grade("c", r, opts(now)); now = e.state("c").due + MIN; }
      return graded(e, "c", last, now);
    };
    const again = run(1), good = run(3);
    assert.equal(again.point, good.point);
    assert.equal(again.comeback, false);
    assert.equal(again.levelUp, null);                     // Again never levels a card up
    assert.deepEqual({ ...good, levelUp: null }, { ...again, levelUp: null });
  }
});

test("a level-up needs real intervals: grading Good within minutes does not reach Bronze", () => {
  const e = new Engine();
  let now = T0;
  const ups = [];
  for (let i = 0; i < 6; i++) { const r = graded(e, "c", 3, now); if (r.levelUp) ups.push(r.levelUp); now += MIN; }
  assert.deepEqual(ups, []);
});

test("Easy on a new card is not a level-up: that would reward the button, not the memory", () => {
  const e = new Engine();
  const r = graded(e, "c", 4, T0);
  assert.notEqual(e.mastery("c").tier, "learning");         // FSRS does give it a long first interval
  assert.equal(r.levelUp, null);
});

test("coming back when due lifts a card through the tiers, one level-up at a time", () => {
  const e = new Engine();
  let now = T0;
  const ups = [];
  for (let i = 0; i < 10; i++) { const r = graded(e, "c", 3, now); if (r.levelUp) ups.push(r.levelUp); now = e.state("c").due + MIN; }
  assert.ok(ups.length >= 2, ups.join(","));
  assert.equal(ups[0], "bronze");
  assert.equal(new Set(ups).size, ups.length);             // each tier once
});

test("a comeback is a lapsed card recalled, not a new card's second try", () => {
  const e = new Engine();
  let now = T0;
  assert.equal(graded(e, "new", 1, now).comeback, false);
  assert.equal(graded(e, "new", 3, now + MIN).comeback, false);   // still learning: no comeback
  for (const r of [3, 3, 3]) { graded(e, "c", r, now); now = e.state("c").due + MIN; }
  assert.equal(e.state("c").state, "review");
  graded(e, "c", 1, now);                                            // forgotten: relearning
  now = e.state("c").due + MIN;
  assert.equal(graded(e, "c", 3, now).comeback, true);
});

test("the ring pulses once per quarter crossed", () => {
  assert.equal(quarterCrossed(0, 1, 20), 0);
  assert.equal(quarterCrossed(4, 5, 20), 1);
  assert.equal(quarterCrossed(9, 10, 20), 2);
  assert.equal(quarterCrossed(14, 15, 20), 3);
  assert.equal(quarterCrossed(19, 20, 20), 0);                       // the end is the done screen, not a pulse
  assert.equal(quarterCrossed(5, 6, 20), 0);
});

test("the session tally counts level-ups and comebacks", () => {
  let t = EMPTY_TALLY;
  t = tally(t, { point: 1, levelUp: null, comeback: false });
  t = tally(t, { point: 1, levelUp: "bronze", comeback: false });
  t = tally(t, { point: 1, levelUp: null, comeback: true });
  assert.deepEqual(t, { levelUps: 1, comebacks: 1 });
});

test("a lapsed card recalled with Hard is a comeback too: any recall counts, not the button", () => {
  const e = new Engine();
  let now = T0;
  for (const r of [3, 3, 3]) { graded(e, "c", r, now); now = e.state("c").due + MIN; }
  graded(e, "c", 1, now);
  now = e.state("c").due + MIN;
  assert.equal(graded(e, "c", 2, now).comeback, true);
});

test("five more new cards are an allowance for the day, not a change of settings", () => {
  const cards = Array.from({ length: 30 }, (_, i) => `n${i}`);
  const e = new Engine();
  assert.equal(e.queue(cards, T0).fresh.length, 15);
  assert.equal(e.queue(cards, T0, 5).fresh.length, 20);
  assert.equal(e.settings.newPerDay, 15);
});
