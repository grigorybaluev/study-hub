// Routes on a conversion map (#257): the cheapest way from one representation to another, and the hops
// of an authored route. Pure, so node tests it: tests/map-routes.test.mjs.
import type { ConversionMap, MapEdge } from "../data/types";

/** The route finder's weights per cost class; build/schema.py MAP_COSTS has the same numbers. */
export const COST: Record<MapEdge["cost"], number> = { free: 0, same: 1, shrinks: 1, linear: 2, design: 3, explodes: 6 };
/** A step along an edge, in the direction it is walked (an edge that runs both ways can be walked backwards). */
export interface Hop { edge: MapEdge; from: string; to: string }

/** The cheapest route from one node to another: least total cost, then fewest arrows. Pure. */
export function cheapest(map: ConversionMap, from: string, to: string): Hop[] | null {
  if (from === to) return [];
  const out = new Map<string, Hop[]>();
  const add = (h: Hop) => { const l = out.get(h.from); if (l) l.push(h); else out.set(h.from, [h]); };
  for (const e of map.edges) {
    add({ edge: e, from: e.from, to: e.to });
    if (e.both) add({ edge: e, from: e.to, to: e.from });
  }
  const best = new Map<string, [number, number]>([[from, [0, 0]]]);
  const prev = new Map<string, Hop>();
  const done = new Set<string>();
  for (;;) {
    let u: string | null = null;
    for (const [k, v] of best) if (!done.has(k) && (u === null || v[0] < best.get(u)![0] || (v[0] === best.get(u)![0] && v[1] < best.get(u)![1]))) u = k;
    if (u === null) return null;
    if (u === to) break;
    done.add(u);
    const [c, n] = best.get(u)!;
    for (const h of out.get(u) ?? []) {
      const cand: [number, number] = [c + COST[h.edge.cost], n + 1];
      const old = best.get(h.to);
      if (!done.has(h.to) && (!old || cand[0] < old[0] || (cand[0] === old[0] && cand[1] < old[1]))) { best.set(h.to, cand); prev.set(h.to, h); }
    }
  }
  const path: Hop[] = [];
  for (let at = to; at !== from; at = prev.get(at)!.from) path.unshift(prev.get(at)!);
  return path;
}

/** The hops of an authored route (a node path); each pair is joined by an edge, in either direction if it runs both ways. */
export function hopsOf(map: ConversionMap, path: string[]): Hop[] {
  return path.slice(1).map((to, k) => {
    const from = path[k];
    const e = map.edges.find((x) => (x.from === from && x.to === to) || (x.both && x.from === to && x.to === from))!;
    return { edge: e, from, to };
  });
}
