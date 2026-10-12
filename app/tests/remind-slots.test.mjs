// The reminder times of a day (#235) in node: `npm test`. scripts/remind-slots.mjs, which the reminder
// workflow runs.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FALLBACK, RULE, WEEKLY, due, parseDay, slots, timeOf } from "../../scripts/remind-slots.mjs";

const hm = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const show = (ts) => ts.map((t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
const MIN = 60_000;

test("the phone's value: the date and its busy blocks, past midnight to the day's end, else null", () => {
  assert.deepEqual(parseDay("2026-10-12 09:45-11:00,18:30-21:30"), { date: "2026-10-12", busy: [[hm("09:45"), hm("11:00")], [hm("18:30"), hm("21:30")]] });
  assert.deepEqual(parseDay("2026-10-12 9:00 – 10:15\n23:00-01:00"), { date: "2026-10-12", busy: [[540, 615], [1380, 1440]] });
  assert.deepEqual(parseDay("2026-10-12"), { date: "2026-10-12", busy: [] });
  assert.deepEqual(parseDay("2026-10-12 00:00-00:00,10:00-10:00,12:00-13:00"), { date: "2026-10-12", busy: [[720, 780]] });   // moments take no time
  assert.equal(parseDay("2026-10-12 lunch"), null);
  assert.equal(parseDay("2026-10-12 09:00-10:00,25:70-26:00"), null);       // one bad block: not the phone's day
  assert.equal(parseDay("2026-10-12 9:45 AM-11:00 AM"), null);
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
  assert.equal(due(value, at("11:00"), at("11:10")), "remind");        // 11:05
  assert.equal(due(value, at("11:05"), at("11:15")), null);       // 11:05 was the previous run's
  assert.equal(due(value, at("08:59"), at("09:01")), null);       // the phone sent today: no 9:00
  // yesterday's value, a malformed one, none: 9:00 and 20:00
  for (const v of ["2026-10-11 09:45-11:00", "today", undefined]) {
    assert.equal(due(v, at("08:55"), at("09:05")), "remind");
    assert.equal(due(v, at("11:00"), at("11:10")), null);
  }
  assert.deepEqual(FALLBACK, [hm("09:00"), hm("20:00")]);
  assert.equal(due(value, at("11:04") - MIN / 2, at("11:05")), "remind");       // the end of the span counts
});

test("Sunday at 23:00: the week's summary, whatever the day held", () => {
  const sunday = "2026-10-18", at = (s) => timeOf(sunday, hm(s));
  assert.equal(new Date(timeOf(sunday, 0)).getDay(), WEEKLY.weekday);
  assert.equal(due(`${sunday} 22:00-23:59`, at("22:55"), at("23:05")), "week");
  assert.equal(due(undefined, at("22:55"), at("23:05")), "week");
  assert.equal(due(undefined, timeOf("2026-10-17", hm("22:55")), timeOf("2026-10-17", hm("23:05"))), null);   // a Saturday
});

test("a late run still sends the week's summary, after midnight too, within its own span", async () => {
  const { dueIn, parseDay } = await import("../../scripts/remind-slots.mjs");
  const sun = (s) => timeOf("2026-10-18", hm(s)), mon = (s) => timeOf("2026-10-19", hm(s));
  // the runs from 22:50 stalled until 0:40: past a reminder's half hour, within the week's span
  assert.equal(dueIn(null, mon("00:10"), mon("00:40"), sun("22:50")), "week");
  assert.equal(dueIn(null, mon("00:10"), mon("00:40"), sun("23:30")), null);       // sent by the run that started 23:30's span
  assert.equal(dueIn(parseDay("2026-10-19"), mon("08:20"), mon("08:40"), mon("08:20")), "remind");   // Monday 8:30: the week went out before
});
