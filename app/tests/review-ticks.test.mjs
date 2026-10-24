// Checklist ticks of exam preps (#260) in node: `npm test`. Merging keeps the newer change of each item.
import assert from "node:assert/strict";
import { test } from "node:test";
import { countOn, mergeTicks, tickKey, ticksOf } from "../src/review/ticks.ts";
import { decode, encode, makeFile } from "../src/review/transfer.ts";
import { DEFAULT_SETTINGS } from "../src/review/engine.ts";

test("the newer change of an item wins, in either direction", () => {
  const phone = { a: { on: true, at: 10 }, b: { on: false, at: 30 } };
  const mac = { a: { on: false, at: 20 }, b: { on: true, at: 25 }, c: { on: true, at: 5 } };
  const m = mergeTicks(phone, mac);
  assert.deepEqual(m, { a: { on: false, at: 20 }, b: { on: false, at: 30 }, c: { on: true, at: 5 } });
  assert.deepEqual(mergeTicks(mac, phone), m);
  assert.deepEqual(mergeTicks(m, m), m);
});

test("malformed ticks are dropped", () => {
  assert.deepEqual(ticksOf({ a: { on: true, at: 1 }, b: { on: "yes", at: 1 }, c: null, d: { on: false } }), { a: { on: true, at: 1 } });
  assert.deepEqual(ticksOf(undefined), {});
});

test("keys come from the text, so a list can be reordered; math keeps its letters", () => {
  assert.equal(tickKey("concordia/COMP335/midterm", "traps", "Precedence: $ab^*$ is $a(b^*)$."), "concordia/COMP335/midterm/traps/precedence-ab-is-ab");
  const ticks = { [tickKey("p", "l", "One")]: { on: true, at: 1 }, [tickKey("p", "l", "Two")]: { on: false, at: 2 } };
  assert.equal(countOn(ticks, [tickKey("p", "l", "Two"), tickKey("p", "l", "One")]), 1);
});

test("ticks travel in the progress file; an older file without them reads as none", async () => {
  const ticks = { k: { on: true, at: 7 } };
  const file = makeFile("dev", [], DEFAULT_SETTINGS, 0, 100, [], ticks);
  assert.deepEqual((await decode(await encode(file))).ticks, ticks);
  const old = { ...file }; delete old.ticks;
  assert.deepEqual((await decode(JSON.stringify(old))).ticks, {});
});
