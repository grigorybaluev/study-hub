// Progress transfer (#193) in node: `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_SETTINGS, Engine } from "../src/review/engine.ts";
import { ProgressError, decode, encode, fileName, makeFile, missing } from "../src/review/transfer.ts";

const T0 = new Date(2026, 9, 7, 9, 0).getTime();
const HOUR = 3_600_000;

function device(name, cards, start) {
  const e = new Engine();
  let now = start;
  for (let i = 0; i < 12; i++) { e.grade(cards[i % cards.length], [3, 1, 3, 4][i % 4], { now, ms: 4000, hash: "h", device: name }); now += 5 * HOUR; }
  return e;
}

/** What the deck does on import: merge only what is missing, and return how many were new. */
function importInto(e, file) {
  const add = missing(e.log, file);
  return e.merge(add);
}

test("the clipboard form round-trips exactly", async () => {
  const e = device("phone", ["a", "b"], T0);
  const file = makeFile("phone", e.log, DEFAULT_SETTINGS, 0, T0);
  const text = await encode(file);
  assert.ok(text.startsWith("SHP1:"));
  assert.deepEqual(await decode(text), file);
  assert.deepEqual(await decode(`  ${text}\n`), file);                    // pasted with stray whitespace
  assert.deepEqual(await decode(JSON.stringify(file, null, 1)), file);    // a saved file: plain JSON
});

test("phone to Mac and Mac to phone give both devices the same log and the same schedule", async () => {
  const phone = device("phone", ["a", "b", "c"], T0);
  const mac = device("mac", ["b", "d"], T0 + HOUR);
  const toMac = await decode(await encode(makeFile("phone", phone.log, DEFAULT_SETTINGS, 0, T0)));
  assert.equal(importInto(mac, toMac), 12);
  const toPhone = await decode(await encode(makeFile("mac", mac.log, DEFAULT_SETTINGS, 0, T0)));
  assert.equal(importInto(phone, toPhone), 12);
  assert.equal(phone.log.length, 24);
  for (const c of ["a", "b", "c", "d"]) assert.deepEqual(phone.state(c), mac.state(c));
});

test("importing the same progress twice changes nothing", async () => {
  const phone = device("phone", ["a"], T0);
  const mac = new Engine();
  const file = await decode(await encode(makeFile("phone", phone.log, DEFAULT_SETTINGS, 0, T0)));
  assert.equal(importInto(mac, file), 12);
  const before = mac.state("a");
  assert.equal(importInto(mac, file), 0);
  assert.deepEqual(mac.state("a"), before);
});

test("damaged, foreign or newer progress is refused with a message", async () => {
  const good = await encode(makeFile("phone", device("phone", ["a"], T0).log, DEFAULT_SETTINGS, 0, T0));
  const refuses = (text, re) => assert.rejects(decode(text), (e) => e instanceof ProgressError && re.test(e.message));
  await refuses(good.slice(0, good.length - 40), /incomplete or damaged/);
  await refuses("hello", /not Study Hub progress/);
  await refuses(JSON.stringify({ format: "something-else" }), /not Study Hub progress/);
  await refuses(JSON.stringify({ format: "study-hub-progress", version: 99, device: "x", reviews: [] }), /newer version/);
  await refuses(JSON.stringify({ format: "study-hub-progress", version: 1, device: "x", reviews: [{ id: "1", card: "a", ts: 1, rating: 7, ms: 1, type: "learn", hash: "h" }] }), /malformed/);
});

test("a 5,000-review export stays small enough for the clipboard", async () => {
  const reviews = [];
  for (let i = 0; i < 5000; i++) {
    reviews.push({ id: `a1b2c3d4e5-${T0 + i * 60_000}`, card: `concordia/STAT280/definition/card-number-${i % 300}`, ts: T0 + i * 60_000,
      rating: [1, 3, 3, 4][i % 4], ms: 3000 + (i % 7) * 900, type: "review", hash: (i * 2654435761 >>> 0).toString(16).slice(0, 8) });
  }
  const text = await encode(makeFile("a1b2c3d4e5", reviews, DEFAULT_SETTINGS, 0, T0));
  console.log(`  5,000 reviews: JSON ${JSON.stringify(reviews).length} chars, clipboard text ${text.length} chars`);
  assert.ok(text.length < 300_000);
});

test("a saved file is named by device and day", () => {
  assert.equal(fileName(makeFile("phone1", [], DEFAULT_SETTINGS, 0, new Date(2026, 9, 7, 9).getTime())), "study-hub-progress-phone1-2026-10-07.json");
});
