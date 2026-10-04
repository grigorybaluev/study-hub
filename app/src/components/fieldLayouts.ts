// Layouts for DS map 2 (#173): where each concept goes, and the decorations that explain the space
// (guides, headers, domain titles). Every layout is deterministic, so the map is the same on every
// load; the network layout runs a force simulation with a seeded random generator for the same reason.
//
// Space encodes DS relevance and colour encodes the domain (the page colours the nodes):
//   radial  — angle = domain, distance from the centre = tier and score; each title just outside its cluster
//   network — force-directed: dependencies pull concepts together; each title in the middle of its cluster
//   grid    — tiers as rows, domains as columns: a table of the field
import cytoscape from "cytoscape";
import { boxLabel } from "./GraphView";
import { DOMAIN_LABEL, DOMAIN_ORDER, FAMILY_LABEL, FAMILY_OF, domainIndex, type Family } from "./domains";

export type LayoutName = "radial" | "network" | "grid";
export const LAYOUTS: { id: LayoutName; label: string; help: string }[] = [
  { id: "radial", label: "Radial", help: "Angle is the domain, distance from the centre is relevance: the tier, then the score inside it, so the most load-bearing concepts are nearest the middle." },
  { id: "network", label: "Network", help: "Force-directed: concepts that depend on each other are pulled together, so each domain forms a cluster, named in its middle." },
  { id: "grid", label: "Grid", help: "A table of the field: one row per tier, one column per domain, grouped by family. The most relevant concepts of each cell come first." },
];

/** domain titles are set in capitals; their width per character, in units of the font size */
const TITLE_CHAR = 0.68;

export interface FieldItem {
  id: string;
  title: string;
  /** display name: the short name if the concept has one */
  name: string;
  domain: string;
  tier: number;          // 0 application … 3 peripheral
  score: number;         // 0..1, within the field
}

export interface PlacedNode { x: number; y: number; w: number; h: number; label: string; fs: number }

export interface Decoration {
  id: string;
  kind: "band-label" | "region" | "header" | "guide" | "rowband";
  label: string;
  x: number; y: number; w: number; h: number;
  /** font size in model units; region labels are big so they read when zoomed out */
  fs?: number;
  shape?: "ellipse" | "rectangle" | "round-rectangle";
  /** "left": the label ends at (x, y) instead of being centred on it (row labels of the grid) */
  align?: "left";
  /** tier index for guides and row bands; family and domain for titles */
  tier?: number;
  family?: Family;
  domain?: string;
}

export interface FieldLayout {
  nodes: Map<string, PlacedNode>;
  decorations: Decoration[];
}

export interface FieldEdge { from: string; to: string }

export const TIER_NAMES = ["DS application", "core foundation", "supporting", "peripheral"];

/** box and text scale from the score: the most load-bearing concepts are drawn larger */
export const scaleOf = (score: number) => 0.82 + 0.62 * score;

const byRelevance = (a: FieldItem, b: FieldItem) => a.tier - b.tier || b.score - a.score || a.title.localeCompare(b.title);
const byDomain = (a: FieldItem, b: FieldItem) => domainIndex(a.domain) - domainIndex(b.domain);

function box(n: FieldItem, maxChars: number, scale = scaleOf(n.score)) {
  const b = boxLabel("", n.name, maxChars, scale);
  return { label: b.label, w: b.w, h: b.h, fs: b.fs };
}

// ---------------------------------------------------------------- grid
const CELL_W = 176, CELL_H = 62, CELL_GAP = 8, COL_GAP = 26, FAMILY_GAP = 70, ROW_GAP = 60;

function gridLayout(items: FieldItem[]): FieldLayout {
  const domains = DOMAIN_ORDER.filter((dm) => items.some((n) => n.domain === dm));
  const tiers = [0, 1, 2, 3];
  const cell = new Map<string, FieldItem[]>();
  for (const n of [...items].sort(byRelevance)) {
    const k = `${n.domain}|${n.tier}`;
    (cell.get(k) ?? cell.set(k, []).get(k)!).push(n);
  }
  const count = (dm: string, t: number) => cell.get(`${dm}|${t}`)?.length ?? 0;
  // columns per domain: widen the tallest domain until the table is about twice as wide as it is tall
  const k = new Map(domains.map((dm) => [dm, 1]));
  const rowsOf = (dm: string, t: number) => Math.ceil(count(dm, t) / k.get(dm)!);
  const size = () => {
    const w = domains.reduce((acc, dm) => acc + k.get(dm)! * (CELL_W + CELL_GAP), 0);
    const h = tiers.reduce((acc, t) => acc + Math.max(1, ...domains.map((dm) => rowsOf(dm, t))) * (CELL_H + CELL_GAP) + ROW_GAP, 0);
    return { w, h };
  };
  for (let guard = 0; guard < 200; guard++) {
    const { w, h } = size();
    if (w / h >= 2.1) break;
    const tallest = domains.reduce((best, dm) => (Math.max(...tiers.map((t) => rowsOf(dm, t))) > Math.max(...tiers.map((t) => rowsOf(best, t))) ? dm : best), domains[0]);
    if (Math.max(...tiers.map((t) => rowsOf(tallest, t))) <= 1) break;
    k.set(tallest, k.get(tallest)! + 1);
  }
  // x of each domain column, with wider gaps between families
  const colX = new Map<string, number>();
  let x = 0;
  domains.forEach((dm, i) => {
    if (i > 0) x += FAMILY_OF[dm] !== FAMILY_OF[domains[i - 1]] ? FAMILY_GAP : COL_GAP;
    colX.set(dm, x);
    x += k.get(dm)! * (CELL_W + CELL_GAP) - CELL_GAP;
  });
  const width = x;
  const headerH = 120;
  const rowY: number[] = [];
  const rowH: number[] = [];
  let y = headerH;
  for (const t of tiers) {
    const rows = Math.max(1, ...domains.map((dm) => rowsOf(dm, t)));
    rowY.push(y);
    rowH.push(rows * (CELL_H + CELL_GAP) - CELL_GAP);
    y += rowH[rowH.length - 1] + ROW_GAP;
  }
  const nodes = new Map<string, PlacedNode>();
  for (const dm of domains) {
    for (const t of tiers) {
      (cell.get(`${dm}|${t}`) ?? []).forEach((n, i) => {
        const col = i % k.get(dm)!, row = Math.floor(i / k.get(dm)!);
        const b = boxLabel("", n.name, 22, 0.9 + 0.3 * n.score);
        const lines = b.label.split("\n");
        const label = lines.length > 3 ? [...lines.slice(0, 2), lines.slice(2).join(" ").slice(0, 20) + "…"].join("\n") : b.label;
        nodes.set(n.id, { x: colX.get(dm)! + col * (CELL_W + CELL_GAP) + CELL_W / 2, y: rowY[t] + row * (CELL_H + CELL_GAP) + CELL_H / 2, w: CELL_W, h: CELL_H, label, fs: b.fs });
      });
    }
  }
  const decorations: Decoration[] = [];
  const pad = 24;
  tiers.forEach((t) => {
    decorations.push({ id: `row:${t}`, kind: "rowband", label: "", x: width / 2, y: rowY[t] + rowH[t] / 2, w: width + 2 * pad + 300, h: rowH[t] + ROW_GAP * 0.7, shape: "rectangle", tier: t });
    decorations.push({ id: `rowlabel:${t}`, kind: "band-label", label: TIER_NAMES[t], x: -pad, y: rowY[t] + 20, w: 1, h: 30, fs: 26, tier: t, align: "left" });
  });
  // family headers over their domains, domain headers over their columns
  let fStart = 0;
  domains.forEach((dm, i) => {
    const last = i === domains.length - 1 || FAMILY_OF[domains[i + 1]] !== FAMILY_OF[dm];
    const cx = colX.get(dm)! + (k.get(dm)! * (CELL_W + CELL_GAP) - CELL_GAP) / 2;
    decorations.push({ id: `head:${dm}`, kind: "header", label: DOMAIN_LABEL[dm] ?? dm, x: cx, y: headerH - 14, w: k.get(dm)! * (CELL_W + CELL_GAP) - COL_GAP / 2, h: 4, fs: 19, domain: dm, family: FAMILY_OF[dm] });
    if (last) {
      const x0 = colX.get(domains[fStart])!, x1 = colX.get(dm)! + k.get(dm)! * (CELL_W + CELL_GAP) - CELL_GAP;
      decorations.push({ id: `fam:${FAMILY_OF[dm]}`, kind: "region", label: FAMILY_LABEL[FAMILY_OF[dm]], x: (x0 + x1) / 2, y: headerH - 90, w: x1 - x0, h: 40, fs: 34, family: FAMILY_OF[dm] });
      fStart = i + 1;
    }
  });
  return { nodes, decorations };
}

// ---------------------------------------------------------------- radial
function radialLayout(items: FieldItem[]): FieldLayout {
  const domains = DOMAIN_ORDER.filter((dm) => items.some((n) => n.domain === dm));
  const sized = new Map(items.map((n) => [n.id, box(n, 20)]));
  // wedge per domain: angle grows with the square root of its size, families separated by a small gap
  const familyGap = 0.05;
  const families = domains.filter((dm, i) => i === 0 || FAMILY_OF[dm] !== FAMILY_OF[domains[i - 1]]).length;
  const weight = new Map(domains.map((dm) => [dm, Math.sqrt(items.filter((n) => n.domain === dm).length)]));
  const total = [...weight.values()].reduce((a, b) => a + b, 0);
  const avail = 2 * Math.PI - families * familyGap;
  const wedge = new Map<string, [number, number]>();
  let a0 = -Math.PI / 2;
  domains.forEach((dm, i) => {
    if (i > 0 && FAMILY_OF[dm] !== FAMILY_OF[domains[i - 1]]) a0 += familyGap;
    const span = (avail * weight.get(dm)!) / total;
    wedge.set(dm, [a0, a0 + span]);
    a0 += span;
  });
  // tier rings sized to the area their boxes need
  const tierArea = [0, 1, 2, 3].map((t) => items.filter((n) => n.tier === t).reduce((acc, n) => acc + (sized.get(n.id)!.w + 14) * (sized.get(n.id)!.h + 14), 0) * 1.9);
  const rIn: number[] = [], rOut: number[] = [];
  let r = 120;
  for (const t of [0, 1, 2, 3]) {
    rIn.push(r);
    const outer = Math.sqrt(r * r + tierArea[t] / Math.PI);
    rOut.push(outer);
    r = outer + 60;
  }
  // ideal spot: inside the domain's wedge, at a radius set by the tier and the rank of the score in it
  const ideal = new Map<string, { r: number; a: number }>();
  for (const dm of domains) {
    for (const t of [0, 1, 2, 3]) {
      const list = items.filter((n) => n.domain === dm && n.tier === t).sort(byRelevance);
      const [w0, w1] = wedge.get(dm)!;
      list.forEach((n, i) => {
        const frac = list.length === 1 ? 0.5 : i / (list.length - 1);
        const ang = w0 + (w1 - w0) * (((i * 0.618034) % 1) * 0.84 + 0.08);
        ideal.set(n.id, { r: rIn[t] + (rOut[t] - rIn[t]) * frac * 0.85, a: ang });
      });
    }
  }
  // place in order of distance from the centre; push outwards until the box is free
  const order = [...items].sort((p, q) => ideal.get(p.id)!.r - ideal.get(q.id)!.r || byDomain(p, q));
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const grid = new Map<string, number[]>();
  const CELL = 140;
  const keyOf = (gx: number, gy: number) => `${gx},${gy}`;
  const free = (x: number, y: number, w: number, h: number) => {
    const gx0 = Math.floor((x - w / 2 - 40) / CELL), gx1 = Math.floor((x + w / 2 + 40) / CELL);
    const gy0 = Math.floor((y - h / 2 - 40) / CELL), gy1 = Math.floor((y + h / 2 + 40) / CELL);
    for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
      for (const i of grid.get(keyOf(gx, gy)) ?? []) {
        const p = placed[i];
        if (Math.abs(p.x - x) < (p.w + w) / 2 + 8 && Math.abs(p.y - y) < (p.h + h) / 2 + 6) return false;
      }
    }
    return true;
  };
  const add = (x: number, y: number, w: number, h: number) => {
    placed.push({ x, y, w, h });
    const i = placed.length - 1;
    for (let gx = Math.floor((x - w / 2) / CELL); gx <= Math.floor((x + w / 2) / CELL); gx++)
      for (let gy = Math.floor((y - h / 2) / CELL); gy <= Math.floor((y + h / 2) / CELL); gy++)
        (grid.get(keyOf(gx, gy)) ?? grid.set(keyOf(gx, gy), []).get(keyOf(gx, gy))!).push(i);
  };
  const nodes = new Map<string, PlacedNode>();
  for (const n of order) {
    const b = sized.get(n.id)!;
    const { r: r0, a } = ideal.get(n.id)!;
    const [w0, w1] = wedge.get(n.domain)!;
    let done = false;
    for (let step = 0; step < 4000 && !done; step++) {
      const rr = r0 + step * 5;
      // try the ideal angle first, then nearby angles inside the wedge
      for (const da of [0, 0.25, -0.25, 0.5, -0.5]) {
        const ang = Math.min(w1 - 0.01, Math.max(w0 + 0.01, a + (da * (w1 - w0)) / Math.max(1, rr / 400)));
        const x = rr * Math.cos(ang), y = rr * Math.sin(ang) * 0.82;
        if (free(x, y, b.w, b.h)) { add(x, y, b.w, b.h); nodes.set(n.id, { x, y, ...b }); done = true; break; }
      }
    }
  }
  const decorations: Decoration[] = [];
  const maxR = Math.max(...[...nodes.values()].map((p) => Math.hypot(p.x, p.y / 0.82))) + 80;
  [0, 1, 2].forEach((t) => {
    const outer = (rOut[t] + rIn[t + 1]) / 2;
    decorations.push({ id: `guide:${t}`, kind: "guide", label: "", x: 0, y: 0, w: 2 * outer, h: 2 * outer * 0.82, shape: "ellipse", tier: t });
  });
  // each domain's title sits just outside its own cluster, on the wedge's middle line, pushed further
  // out only if it would touch another title; where it crosses a neighbouring wedge, its halo keeps it legible
  const fs = Math.max(32, maxR * 0.036);
  const taken: { x: number; y: number; w: number; h: number }[] = [];
  const clear = (x: number, y: number, w: number, h: number) =>
    taken.every((q) => Math.abs(q.x - x) >= (q.w + w) / 2 + fs * 0.3 || Math.abs(q.y - y) >= (q.h + h) / 2 + fs * 0.15);
  for (const dm of domains) {
    const [w0, w1] = wedge.get(dm)!;
    const mid = (w0 + w1) / 2;
    const members = items.filter((n) => n.domain === dm).map((n) => nodes.get(n.id)!);
    const edge = Math.max(...members.map((q) => Math.hypot(q.x, q.y / 0.82)));
    const label = DOMAIN_LABEL[dm] ?? dm;
    const w = label.length * fs * TITLE_CHAR, h = fs * 1.25;
    for (let rr = edge + fs * 0.6; rr < edge + 30 * fs; rr += fs * 0.25) {
      const x = rr * Math.cos(mid) + (Math.cos(mid) * w) / 2, y = rr * Math.sin(mid) * 0.82 + (Math.sin(mid) * h) / 2;
      if (clear(x, y, w, h)) {
        taken.push({ x, y, w, h });
        decorations.push({ id: `region:${dm}`, kind: "region", label, x, y, w, h: fs, fs, family: FAMILY_OF[dm], domain: dm });
        break;
      }
    }
  }
  return { nodes, decorations };
}

// ---------------------------------------------------------------- network
/** Push overlapping boxes apart along the axis of least overlap until none touch (a force layout leaves a few). */
function separate(nodes: Map<string, PlacedNode>, gap = 8) {
  const list = [...nodes.values()];
  for (let iter = 0; iter < 200; iter++) {
    let moved = false;
    for (let i = 0; i < list.length; i++) {
      for (let k = i + 1; k < list.length; k++) {
        const p = list[i], q = list[k];
        const ox = (p.w + q.w) / 2 + gap - Math.abs(p.x - q.x);
        const oy = (p.h + q.h) / 2 + gap - Math.abs(p.y - q.y);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        if (ox < oy) { const d = (ox / 2 + 0.5) * (p.x <= q.x ? 1 : -1); p.x -= d; q.x += d; }
        else { const d = (oy / 2 + 0.5) * (p.y <= q.y ? 1 : -1); p.y -= d; q.y += d; }
      }
    }
    if (!moved) break;
  }
}

/** mulberry32: a small seeded generator, so the force layout lands the same way on every load */
function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function networkLayout(items: FieldItem[], edges: FieldEdge[]): FieldLayout {
  const ids = new Set(items.map((n) => n.id));
  const sized = new Map(items.map((n) => [n.id, box(n, 22)]));
  const domains = DOMAIN_ORDER.filter((dm) => items.some((n) => n.domain === dm));
  const els: cytoscape.ElementDefinition[] = [
    ...domains.map((dm) => ({ data: { id: `dom:${dm}` } })),
    ...items.map((n) => ({ data: { id: n.id, parent: `dom:${n.domain}`, w: sized.get(n.id)!.w, h: sized.get(n.id)!.h } })),
    ...edges.filter((e) => ids.has(e.from) && ids.has(e.to) && e.from !== e.to).map((e, i) => ({ data: { id: `e${i}`, source: e.to, target: e.from } })),
  ];
  const cy = cytoscape({ headless: true, styleEnabled: true, elements: els,
    style: [{ selector: "node[w]", style: { width: "data(w)", height: "data(h)" } as never },
      { selector: ":parent", style: { "padding-top": "30px", "padding-bottom": "30px", "padding-left": "30px", "padding-right": "30px" } as never }] });
  const rnd = Math.random;
  Math.random = seeded(173);
  try {
    cy.layout({ name: "fcose", quality: "default", randomize: true, animate: false, fit: false, nodeDimensionsIncludeLabels: false,
      nodeRepulsion: () => 6000, idealEdgeLength: () => 80, edgeElasticity: () => 0.3, nestingFactor: 0.1, gravity: 0.35,
      gravityCompound: 1.6, gravityRangeCompound: 1.0, numIter: 2500, tile: true, packComponents: true, nodeSeparation: 60 } as cytoscape.LayoutOptions).run();
  } finally {
    Math.random = rnd;
  }
  const nodes = new Map<string, PlacedNode>();
  for (const n of items) {
    const p = cy.getElementById(n.id).position();
    nodes.set(n.id, { x: p.x, y: p.y, ...sized.get(n.id)! });
  }
  cy.destroy();
  separate(nodes);
  const xs = [...nodes.values()];
  const extent = Math.max(...xs.map((p) => Math.abs(p.x))) + Math.max(...xs.map((p) => Math.abs(p.y)));
  const fs = Math.max(28, extent * 0.021);
  const decorations: Decoration[] = [];
  const taken: { x: number; y: number; w: number; h: number }[] = [];
  for (const dm of domains) {
    const members = items.filter((n) => n.domain === dm).map((n) => nodes.get(n.id)!);
    const cx = members.reduce((a, p) => a + p.x, 0) / members.length;
    const cy = members.reduce((a, p) => a + p.y, 0) / members.length;
    const label = DOMAIN_LABEL[dm] ?? dm;
    const w = label.length * fs * TITLE_CHAR, h = fs * 1.25;
    // in the middle of the cluster; two clusters with nearly the same centre stack their titles
    for (let k = 0; k < 12; k++) {
      const y = cy + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * h;
      if (taken.every((q) => Math.abs(q.x - cx) >= (q.w + w) / 2 || Math.abs(q.y - y) >= (q.h + h) / 2)) {
        taken.push({ x: cx, y, w, h });
        decorations.push({ id: `region:${dm}`, kind: "region", label, x: cx, y, w, h: fs, fs, family: FAMILY_OF[dm], domain: dm });
        break;
      }
    }
  }
  return { nodes, decorations };
}

// ---------------------------------------------------------------- entry
export function layoutField(name: LayoutName, items: FieldItem[], edges: FieldEdge[]): FieldLayout {
  if (name === "grid") return gridLayout(items);
  if (name === "network") return networkLayout(items, edges);
  return radialLayout(items);
}

/** Pairwise check used by the overlap test: boxes that intrude on each other's gap. */
export function overlaps(layout: FieldLayout, gap = 2): [string, string][] {
  const list = [...layout.nodes.entries()];
  const out: [string, string][] = [];
  for (let i = 0; i < list.length; i++) {
    const [a, p] = list[i];
    for (let k = i + 1; k < list.length; k++) {
      const [b, q] = list[k];
      if (Math.abs(p.x - q.x) < (p.w + q.w) / 2 + gap / 2 - 1e-6 && Math.abs(p.y - q.y) < (p.h + q.h) / 2 + gap / 2 - 1e-6) out.push([a, b]);
    }
  }
  return out;
}
