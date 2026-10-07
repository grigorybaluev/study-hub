// Export to Anki (#198) in node: `npm test`. The full import into Anki itself is checked by hand with
// Anki's python library (see the PR); here, the .apkg's shape and contents.
import assert from "node:assert/strict";
import { test } from "node:test";
import initSqlJs from "sql.js";
import { Engine } from "../src/review/engine.ts";
import { buildApkg, fields, stableId, toHtml } from "../src/review/anki.ts";

const T0 = new Date(2026, 9, 7, 9).getTime();
const card = (id, kind, front, back, extra = {}) => ({ id: `concordia/STAT280/${kind}/${id}`, kind, front, back, course: "concordia/STAT280", unit: "concordia/STAT280/u", order: 1, part: null, part_title: "Part", concepts: ["c"], hash: "h", ...extra });

/** the stored files of a zip, by name */
function unzip(b) {
  const out = {}, v = new DataView(b.buffer, b.byteOffset);
  for (let at = 0; v.getUint32(at, true) === 0x04034b50;) {
    const size = v.getUint32(at + 18, true), n = v.getUint16(at + 26, true), extra = v.getUint16(at + 28, true);
    const name = new TextDecoder().decode(b.subarray(at + 30, at + 30 + n));
    out[name] = b.subarray(at + 30 + n + extra, at + 30 + n + extra + size);
    at += 30 + n + extra + size;
  }
  return out;
}

test("markdown becomes HTML with MathJax delimiters Anki renders", () => {
  assert.match(toHtml("If $x < 0$ then"), /^<p>If \\\(x (&lt;|&#x3C;) 0\\\) then<\/p>$/);   // < escaped; MathJax reads the text
  assert.match(toHtml("$$\nE = mc^2\n$$"), /\\\[E = mc\^2\\\]/);
  assert.match(toHtml("```r\nx <- 1\n```"), /<pre><code class="language-r">x (&lt;|&#x3C;)- 1\n<\/code><\/pre>/);
  assert.match(toHtml(":::note[Aside]\nText\n:::"), /<div class="blk blk-note">/);
});

test("a method quiz becomes its options and its worked steps", () => {
  const m = card("m", "method", "Task $t$", "```solution-map\nid: m\nsteps:\n  - node: a\n    text: 'First step'\n```", { options: ["One", "Two"], answer: 1 });
  const f = fields(m, "where");
  assert.match(f.front, /<ol class="options"><li>One<\/li><li>Two<\/li><\/ol>/);
  assert.match(f.back, /<b>Two<\/b>.*First step/s);
});

test("ids are stable and positive", () => {
  assert.equal(stableId("a"), stableId("a"));
  assert.notEqual(stableId("a"), stableId("b"));
  assert.ok(stableId("x") > 0 && Number.isSafeInteger(stableId("x")));
});

test("the .apkg holds the notes, cards with their schedule, and every review", async () => {
  const cards = [card("a", "definition", "A", "a"), card("b", "definition", "B", "b"), card("n", "definition", "N", "n")];
  const e = new Engine();
  let now = T0;
  for (let i = 0; i < 4; i++) { e.grade(cards[0].id, 3, { now, ms: 5000, hash: "h", device: "d" }); now = e.state(cards[0].id).due + 60_000; }
  e.grade(cards[1].id, 1, { now: T0 + 1000, ms: 90_000, hash: "h", device: "d" });
  e.grade("concordia/STAT280/definition/gone", 3, { now: T0 + 2000, ms: 1, hash: "h", device: "d" });   // a card no longer exported
  const SQL = await initSqlJs();
  const files = unzip(await buildApkg(SQL, { cards, engine: e, now, courseCode: () => "STAT280", where: () => "STAT280 › u" }));
  assert.deepEqual(Object.keys(files).sort(), ["collection.anki2", "media"]);
  const db = new SQL.Database(files["collection.anki2"]);
  const one = (sql) => db.exec(sql)[0].values;
  assert.equal(one("select count(*) from notes")[0][0], 3);
  assert.deepEqual(one("select type, queue from cards order by id").map(String).sort(), ["0,0", "1,1", "2,2"]);   // new, learning, review
  assert.equal(one("select count(*) from revlog")[0][0], 5);                                                    // the gone card's grade left out
  assert.equal(one("select max(time) from revlog")[0][0], 60_000);                                              // time capped as Anki does
  assert.deepEqual(one("select ease from revlog order by id").map((r) => r[0]), [3, 1, 3, 3, 3]);
  assert.equal(one("select guid from notes where sfld = 'A'")[0][0], cards[0].id);                              // re-imports update this note
  const decks = JSON.parse(one("select decks from col")[0][0]);
  assert.ok(Object.values(decks).some((d) => d.name === "Study Hub::STAT280"));
});
