// Layouts for DS map 2 (#173): where each concept goes, and the decorations that explain the space
// (bands, headers, region labels). Every layout is deterministic, so the map is the same on every
// load; the network layout runs a force simulation with a seeded random generator for the same reason.
//
// Space encodes DS relevance and colour encodes the domain (the page colours the nodes):
//   rings   — concentric tier bands, domains in wedges (the original DS map's picture)
//   grid    — tiers as rows, domains as columns: a table of the field
//   islands — one island per domain, each a small rings map; DS-heavy islands sit in the middle
//   radial  — angle = domain, distance from the centre = tier and score, continuous
//   network — force-directed: dependencies pull concepts together, each domain named at its centre
import cytoscape from "cytoscape";
import { boxLabel } from "./GraphView";
import { rings } from "./rings";
import { DOMAIN_LABEL, DOMAIN_ORDER, FAMILY_LABEL, FAMILY_OF, domainIndex, type Family } from "./domains";

export type LayoutName = "rings" | "grid" | "islands" | "radial" | "network";
export const LAYOUTS: { id: LayoutName; label: string; help: string }[] = [
  { id: "rings", label: "Rings", help: "Concentric bands from the centre out: the DS work itself, the core foundations it rests on, supporting material, and the periphery. Domains sit in wedges." },
  { id: "grid", label: "Grid", help: "A table of the field: one row per tier, one column per domain, grouped by family. The most relevant concepts of each cell come first." },
  { id: "islands", label: "Islands", help: "One island per domain, each with its DS work at the centre and its periphery outside. Islands whose concepts matter most for DS sit in the middle." },
  { id: "radial", label: "Radial", help: "Angle is the domain, distance from the centre is relevance: the tier, then the score inside it, so the most load-bearing concepts are nearest the middle." },
  { id: "network", label: "Network", help: "Force-directed: concepts that depend on each other are pulled together, and each domain is drawn as a cluster around its concepts." },
];

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
  kind: "band" | "band-label" | "region" | "header" | "guide" | "rowband" | "island";
  label: string;
  x: number; y: number; w: number; h: number;
  /** font size in model units; region labels are big so they read when zoomed out */
  fs?: number;
  shape?: "ellipse" | "rectangle" | "round-rectangle";
  /** "left": the label ends at (x, y) instead of being centred on it (row labels of the grid) */
  align?: "left";
  /** tier index for bands, family for islands */
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

// ---------------------------------------------------------------- rings
function ringsLayout(items: FieldItem[]): FieldLayout {
  const sized = items.map((n) => ({ n, b: box(n, 40) }));
  const labelFs = 34;
  const { pos, bands } = rings(sized.map(({ n, b }) => ({ id: n.id, tier: n.tier, group: n.domain, w: b.w, h: b.h, title: n.title, order: -n.score })),
    { groupOrder: DOMAIN_ORDER, aspect: 0.58, gap: 10, labelSpace: labelFs + 14 });
  const nodes = new Map<string, PlacedNode>();
  for (const { n, b } of sized) nodes.set(n.id, { ...pos.get(n.id)!, ...b });
  const decorations: Decoration[] = [];
  for (const band of [...bands].sort((x, y) => y.tier - x.tier)) {
    decorations.push({ id: `band:${band.tier}`, kind: "band", label: "", x: 0, y: 0, w: 2 * band.a, h: 2 * band.b, shape: "ellipse", tier: band.tier });
  }
  for (const band of bands) {
    decorations.push({ id: `bandlabel:${band.tier}`, kind: "band-label", label: `${TIER_NAMES[band.tier]} · ${band.nodes}`, x: 0, y: band.b - labelFs / 2 - 6, w: 600, h: labelFs, fs: labelFs, tier: band.tier });
  }
  return { nodes, decorations };
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

// ---------------------------------------------------------------- islands
function islandsLayout(items: FieldItem[]): FieldLayout {
  const domains = DOMAIN_ORDER.filter((dm) => items.some((n) => n.domain === dm));
  const tierWeight = [3, 2, 1, 0];
  interface Island { dm: string; r: number; pos: Map<string, { x: number; y: number }>; bands: { tier: number; a: number; b: number }[]; weight: number; members: FieldItem[] }
  const islands: Island[] = domains.map((dm) => {
    const members = items.filter((n) => n.domain === dm);
    const sized = members.map((n) => ({ n, b: box(n, 26) }));
    const { pos, bands } = rings(sized.map(({ n, b }) => ({ id: n.id, tier: n.tier, group: dm, w: b.w, h: b.h, title: n.title, order: -n.score })),
      { groupOrder: [dm], aspect: 0.86, gap: 8, labelSpace: 0 });
    const outer = bands[bands.length - 1];
    const weight = members.reduce((acc, n) => acc + tierWeight[n.tier] + n.score, 0) / members.length;
    return { dm, r: Math.max(outer.a, outer.b) + 30, pos, bands, weight, members };
  });
  // the islands that matter most for DS first, packed outwards from the centre. Each island is a
  // disc of radius r with its name in a strip above it; the name is sized to read when the whole
  // map is fitted, so the packing runs twice: once to learn the map's extent, once with the strips.
  islands.sort((p, q) => q.weight - p.weight || domainIndex(p.dm) - domainIndex(q.dm));
  const GAP = 70;
  const pack = (labelFs: number) => {
    const placed: { x: number; y: number; r: number; top: number; half: number }[] = [];
    const centres = new Map<string, { x: number; y: number }>();
    const clear = (c: { x: number; y: number }, isl: Island, top: number, half: number) => placed.every((q) => {
      if (Math.hypot(c.x - q.x, c.y - q.y) < q.r + isl.r + GAP - 1e-6) return false;
      // the name strips (rectangles above each disc) must not touch the other island's disc or strip
      const strips = [{ x: c.x, y: c.y - isl.r - top / 2, w: 2 * half, h: top }, { x: q.x, y: q.y - q.r - q.top / 2, w: 2 * q.half, h: q.top }];
      const discs = [{ x: q.x, y: q.y, r: q.r }, { x: c.x, y: c.y, r: isl.r }];
      for (let i = 0; i < 2; i++) {
        const s = strips[i], o = discs[i];
        const dx = Math.max(Math.abs(o.x - s.x) - s.w / 2, 0), dy = Math.max(Math.abs(o.y - s.y) - s.h / 2, 0);
        if (Math.hypot(dx, dy) < o.r + GAP / 2) return false;
      }
      return Math.abs(strips[0].x - strips[1].x) >= (strips[0].w + strips[1].w) / 2 + GAP / 2 || Math.abs(strips[0].y - strips[1].y) >= (strips[0].h + strips[1].h) / 2 + GAP / 2;
    });
    for (const isl of islands) {
      const top = labelFs * 1.5, half = Math.max(isl.r * 0.6, ((DOMAIN_LABEL[isl.dm] ?? isl.dm).length * labelFs * 0.62) / 2 + 20);
      let best: { x: number; y: number } | null = placed.length === 0 ? { x: 0, y: 0 } : null;
      let bestD = Infinity;
      for (const p of placed) {
        for (let a = 0; a < 360; a += 3) {
          const t = (a * Math.PI) / 180;
          for (const extra of [0, labelFs, 2 * labelFs]) {
            const dd = p.r + isl.r + GAP + extra;
            const c = { x: p.x + dd * Math.cos(t), y: p.y + dd * Math.sin(t) };
            if (!clear(c, isl, top, half)) continue;
            const dist = Math.hypot(c.x, c.y * 1.4);
            if (dist < bestD) { bestD = dist; best = c; }
            break;
          }
        }
      }
      placed.push({ ...best!, r: isl.r, top, half });
      centres.set(isl.dm, best!);
    }
    const extent = Math.max(...placed.map((q) => Math.max(Math.abs(q.x) + q.r, (Math.abs(q.y) + q.r) * 1.6)));
    return { centres, extent };
  };
  const first = pack(0);
  const labelFs = Math.max(30, first.extent * 0.028);
  const { centres } = pack(labelFs);
  const nodes = new Map<string, PlacedNode>();
  const decorations: Decoration[] = [];
  for (const isl of islands) {
    const c = centres.get(isl.dm)!;
    const outer = isl.bands[isl.bands.length - 1];
    decorations.push({ id: `island:${isl.dm}`, kind: "island", label: "", x: c.x, y: c.y, w: 2 * outer.a + 40, h: 2 * outer.b + 40, shape: "ellipse", family: FAMILY_OF[isl.dm], domain: isl.dm });
    for (const band of isl.bands.slice(0, -1)) {
      decorations.push({ id: `guide:${isl.dm}:${band.tier}`, kind: "guide", label: "", x: c.x, y: c.y, w: 2 * band.a, h: 2 * band.b, shape: "ellipse", tier: band.tier });
    }
    decorations.push({ id: `region:${isl.dm}`, kind: "region", label: DOMAIN_LABEL[isl.dm] ?? isl.dm, x: c.x, y: c.y - isl.r - labelFs * 0.55, w: 2 * isl.r, h: labelFs, fs: labelFs, family: FAMILY_OF[isl.dm], domain: isl.dm });
    for (const n of isl.members) {
      const p = isl.pos.get(n.id)!;
      nodes.set(n.id, { x: c.x + p.x, y: c.y + p.y, ...box(n, 26) });
    }
  }
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
  // domain names on the rim, sized to read when fitted; a name that would touch another moves outwards
  const fs = Math.max(40, maxR * 0.045);
  const taken: { x: number; y: number; w: number; h: number }[] = [];
  for (const dm of domains) {
    const [w0, w1] = wedge.get(dm)!;
    const mid = (w0 + w1) / 2;
    const label = DOMAIN_LABEL[dm] ?? dm;
    const w = label.length * fs * 0.62, h = fs * 1.3;
    for (let rr = maxR + fs; rr < maxR + 12 * fs; rr += fs * 0.6) {
      const x = rr * Math.cos(mid) + (Math.cos(mid) * w) / 2, y = rr * Math.sin(mid) * 0.82;
      if (taken.every((q) => Math.abs(q.x - x) >= (q.w + w) / 2 + 10 || Math.abs(q.y - y) >= (q.h + h) / 2 + 6)) {
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
  const fs = Math.max(40, extent * 0.03);
  const decorations: Decoration[] = [];
  const taken: { x: number; y: number; w: number; h: number }[] = [];
  for (const dm of domains) {
    const members = items.filter((n) => n.domain === dm).map((n) => nodes.get(n.id)!);
    const cx = members.reduce((a, p) => a + p.x, 0) / members.length;
    const top = Math.min(...members.map((p) => p.y - p.h / 2));
    const label = DOMAIN_LABEL[dm] ?? dm;
    const w = label.length * fs * 0.62, h = fs * 1.3;
    for (let y = top - h / 2 - 10; y > top - 30 * h; y -= h * 0.5) {
      if (taken.every((q) => Math.abs(q.x - cx) >= (q.w + w) / 2 + 10 || Math.abs(q.y - y) >= (q.h + h) / 2 + 6)) {
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
  if (name === "islands") return islandsLayout(items);
  if (name === "radial") return radialLayout(items);
  if (name === "network") return networkLayout(items, edges);
  return ringsLayout(items);
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
