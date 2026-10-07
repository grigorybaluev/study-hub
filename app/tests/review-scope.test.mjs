// Review scopes (#197) in node: `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Engine } from "../src/review/engine.ts";
import { ALL, examOrder, inScope, parseScope, scopeCards, scopeQuery } from "../src/review/scope.ts";

const card = (id, course, unit, concepts, order = 1) => ({ id, course: `concordia/${course}`, unit: `concordia/${course}/${unit}`, concepts, kind: "definition", front: id, back: "", order, part: null, part_title: null, hash: "h" });
const cards = [
  card("a", "STAT280", "vectors", ["vector"], 2),
  card("b", "STAT280", "matrices", ["matrix", "matrix-product"], 3),
  card("c", "STAT280", "matrices", ["inverse-matrix"], 3),
  card("d", "MAST221", "probability", ["probability"], 1),
];
const ctx = {
  termCourses: (i) => (i === 2 ? ["concordia/STAT280"] : ["concordia/MAST221"]),
  areaConcepts: (id) => new Set(id === "study-hub/ds-core/linear-algebra" ? ["matrix", "inverse-matrix"] : ["probability"]),
};

test("the URL names the scope, and the scope gives back its URL", () => {
  for (const q of ["", "?course=concordia%2FSTAT280", "?term=2", "?unit=concordia%2FSTAT280%2Fvectors", "?concept=matrix", "?area=study-hub%2Fds-core%2Flinear-algebra"]) {
    assert.equal(scopeQuery(parseScope(new URLSearchParams(q))), q);
  }
  assert.deepEqual(parseScope(new URLSearchParams("?term=x")), ALL);
});

test("each scope picks its cards", () => {
  const ids = (s) => cards.filter((c) => inScope(c, s, ctx)).map((c) => c.id).join("");
  assert.equal(ids(ALL), "abcd");
  assert.equal(ids({ kind: "course", id: "concordia/STAT280" }), "abc");
  assert.equal(ids({ kind: "course", id: "other/STAT280" }), "");          // same code, another university
  assert.equal(ids({ kind: "term", index: 2 }), "abc");
  assert.equal(ids({ kind: "unit", id: "concordia/STAT280/matrices" }), "bc");
  assert.equal(ids({ kind: "concept", id: "matrix" }), "b");
  assert.equal(ids({ kind: "area", id: "study-hub/ds-core/linear-algebra" }), "bc");      // interview prep, across courses
});

test("exam prep puts first the cards whose concepts later units require most, keeping course order otherwise", () => {
  // units requiring each concept, by order: vector by units 1 and 2 (before or at the card's unit: they do not count)
  const requiredBy = { "inverse-matrix": [4, 5, 6], "matrix": [4], "vector": [1, 2] };
  const weight = (k, after) => (requiredBy[k] ?? []).filter((o) => o > after).length;
  assert.deepEqual(examOrder(cards, weight).map((c) => c.id), ["c", "b", "a", "d"]);
  assert.deepEqual(scopeCards(cards, { kind: "course", id: "concordia/STAT280" }, ctx, weight).map((c) => c.id), ["c", "b", "a"]);
  assert.deepEqual(scopeCards(cards, { kind: "concept", id: "matrix" }, ctx, weight).map((c) => c.id), ["b"]);   // not exam: no reorder
});

test("a scope filters what is due, it does not schedule: the engine queue of a scope is the queue of its cards", () => {
  const e = new Engine();
  const T = new Date(2026, 9, 7, 9).getTime();
  for (const c of cards) e.grade(c.id, 4, { now: T - 30 * 86_400_000, ms: 1, hash: "h", device: "d" });
  const scoped = scopeCards(cards, { kind: "course", id: "concordia/STAT280" }, ctx).map((c) => c.id);
  assert.deepEqual(e.queue(scoped, T).due.sort(), e.queue(cards.map((c) => c.id), T).due.filter((id) => scoped.includes(id)).sort());
});
