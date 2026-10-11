// The reminder times of a day (#235) in node: `npm test`. scripts/remind-slots.mjs, which the reminder
// workflow runs.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FALLBACK, RULE, due, parseDay, slots, timeOf } from "../../scripts/remind-slots.mjs";

const hm = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const show = (ts) => ts.map((t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
const MIN = 60_000;

test("the phone's value: the date and its busy blocks, past midnight to the day's end, else null", () => {
  assert.deepEqual(parseDay("2026-10-12 09:45-11:00,18:30-21:30"), { date: "2026-10-12", busy: [[hm("09:45"), hm("11:00")], [hm("18:30"), hm("21:30")]] });
  assert.deepEqual(parseDay("2026-10-12 9:00 – 10:15\n23:00-01:00"), { date: "2026-10-12", busy: [[540, 615], [1380, 1440]] });
  assert.deepEqual(parseDay("2026-10-12"), { date: "2026-10-12", busy: [] });
  assert.equal(parseDay("2026-10-12 lunch"), null);
  assert.equal(parseDay(""), null);
  assert.equal(parseDay(undefined), null);
});

test("a reminder into each break, a few minutes after the event before it", () => {
  // class 9:45-11:00, lab 13:00-15:00, French 18:30-21:30
  const day = [[hm("09:45"), hm("11:00")], [hm("13:00"), hm("15:00")], [hm("18:30"), hm("21:30")]];
  assert.deepEqual(show(slots(day)), ["08:30", "11:05", "15:05", "17:35", "21:35"]);
});

test("a break too short for a few cards gets none; overlapping events are one", () => {
  const day = [[hm("09:00"), hm("10:00")], [hm("10:15"), hm("12:00")], [hm("11:30"), hm("12:30")], [hm("12:40"), hm("22:00")]];
  assert.deepEqual(show(slots(day)), ["08:30"]);     // 10:00-10:15 and 12:30-12:40 are too short
});

test("a day with no events: one long break, a reminder every two and a half hours", () => {
  assert.deepEqual(show(slots([])), ["08:30", "11:00", "13:30", "16:00", "18:30", "21:00"]);
});

test("never two within an hour, never more than the most in a day", () => {
  // many short breaks: 30-minute events with 30-minute breaks all day
  const day = Array.from({ length: 14 }, (_, i) => [hm("08:30") + i * 60, hm("09:00") + i * 60]);
  const ts = slots(day);
  assert.ok(ts.length <= RULE.most);
  for (let i = 1; i < ts.length; i++) assert.ok(ts[i] - ts[i - 1] >= RULE.apart);
  assert.equal(ts[0], hm("09:05"));
});

test("due: a time in (from, to], from the phone's day or the fallback hours", () => {
  const value = "2026-10-12 09:45-11:00";
  const at = (s) => timeOf("2026-10-12", hm(s));
  assert.equal(due(value, at("11:00"), at("11:10")), true);        // 11:05
  assert.equal(due(value, at("11:05"), at("11:15")), false);       // 11:05 was the previous run's
  assert.equal(due(value, at("08:59"), at("09:01")), false);       // the phone sent today: no 9:00
  // yesterday's value, a malformed one, none: 9:00 and 20:00
  for (const v of ["2026-10-11 09:45-11:00", "today", undefined]) {
    assert.equal(due(v, at("08:55"), at("09:05")), true);
    assert.equal(due(v, at("11:00"), at("11:10")), false);
  }
  assert.deepEqual(FALLBACK, [hm("09:00"), hm("20:00")]);
  assert.equal(due(value, at("11:04") - MIN / 2, at("11:05")), true);       // the end of the span counts
});
