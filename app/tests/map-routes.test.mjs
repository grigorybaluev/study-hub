// Routes on a conversion map (#257) in node: `npm test`. Reads the authored map, as build_graph.py does.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import YAML from "yaml";
import { cheapest, hopsOf } from "../src/components/mapRoutes.ts";

const raw = YAML.parse(readFileSync(new URL("../../content/maps/regular-language-representations.yaml", import.meta.url), "utf8"));
const map = { ...raw, edges: raw.edges.map((e) => ({ ...e, both: !!e.both })), routes: raw.routes ?? [] };
const ids = (hops) => hops.map((h) => h.edge.id);

test("an expression from an NFA goes through state elimination, not the grammar", () => {
  assert.deepEqual(ids(cheapest(map, "nfa", "regex")), ["prepare", "eliminate"]);
});

test("a left-linear grammar reaches an expression by walking the reversal route backwards", () => {
  const r = cheapest(map, "llg", "regex");
  assert.deepEqual(ids(r), ["reverse-bodies", "reverse-rules", "reverse", "prepare", "eliminate"]);
  assert.deepEqual(r.map((h) => h.to), ["rlgr", "nfar", "nfa", "gtg", "regex"]);
});

test("the minimal DFA from an expression: build, subset, minimise", () => {
  assert.deepEqual(ids(cheapest(map, "regex", "min")), ["build", "subset", "minimise"]);
});

test("same node: an empty route; no way back from a context-free grammar", () => {
  assert.deepEqual(cheapest(map, "dfa", "dfa"), []);
  assert.equal(cheapest(map, "cfg", "nfa"), null);
});

test("every node reaches every other except through the context-free grammar", () => {
  for (const a of map.nodes) for (const b of map.nodes) {
    if (a.id === "cfg" || b.id === "words") continue;
    assert.ok(cheapest(map, a.id, b.id), `${a.id} -> ${b.id}`);
  }
});

test("ties go to the route with fewer arrows", () => {
  const m = {
    nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
    edges: [
      { id: "ab", from: "a", to: "b", cost: "free", both: false },
      { id: "bc", from: "b", to: "c", cost: "same", both: false },
      { id: "ac", from: "a", to: "c", cost: "same", both: false },
    ],
  };
  assert.deepEqual(ids(cheapest(m, "a", "c")), ["ac"]);
});

test("every authored route follows edges, in their direction or back along a two-way one", () => {
  for (const r of map.routes) {
    const hops = hopsOf(map, r.path);
    assert.equal(hops.length, r.path.length - 1, r.task);
    for (const h of hops) assert.ok(h.edge, r.task);
  }
});
