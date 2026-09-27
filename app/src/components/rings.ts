// Concentric-band layout for the DS relevance map (#155).
//
// Nodes carry a tier (0 = innermost band). Each band is an elliptical annulus, packed with rows
// of boxes, so the picture reads from the centre out: what data science is made of, what it
// rests on, what supports it, and what is taught but never reached. Within a band the boxes are
// ordered by group (domain) and dealt out along a clockwise sweep of the annulus, so a domain
// occupies one angular wedge and the colours cluster. Rows have one pitch for the whole map
// (the tallest box plus the gap), boxes in a row keep the gap, and every box stays inside its
// band's outer ellipse and outside the inner one, so nothing overlaps by construction; a final
// pairwise check confirms it. Each band grows just until its boxes fit. Deterministic.

export interface RingNode { id: string; tier: number; group: string; w: number; h: number; title: string; order?: number }
export interface RingOptions {
  groupOrder: string[];
  /** vertical radius / horizontal radius of every ellipse (screens are wide) */
  aspect?: number;
  /** clearance between neighbouring boxes */
  gap?: number;
  /** vertical space reserved at the bottom of each band for its label */
  labelSpace?: number;
}
export interface Band { tier: number; a: number; b: number; nodes: number }
export interface RingLayout { pos: Map<string, { x: number; y: number }>; bands: Band[]; overlaps: number }

interface Segment { y: number; x0: number; x1: number; key: number }

export function rings(nodes: RingNode[], opts: RingOptions): RingLayout {
  const { aspect = 0.58, gap = 12, labelSpace = 20 } = opts;
  const groupIndex = (g: string) => { const i = opts.groupOrder.indexOf(g); return i < 0 ? opts.groupOrder.length : i; };
  const tiers = [...new Set(nodes.map((n) => n.tier))].sort((a, b) => a - b);
  const pitch = Math.max(...nodes.map((n) => n.h)) + gap;
  const hh = (pitch - gap) / 2;                       // half the tallest box: every box fits in it
  const minW = Math.min(...nodes.map((n) => n.w));
  const pos = new Map<string, { x: number; y: number }>();
  const bands: Band[] = [];

  // half-width of the ellipse (a, b) at height y, 0 outside it
  const halfWidth = (a: number, b: number, y: number) => (Math.abs(y) >= b ? 0 : a * Math.sqrt(1 - (y / b) ** 2));

  // the free segments of an annulus, in clockwise sweep order starting at the top
  const segments = (a: number, b: number, ia: number, ib: number): Segment[] => {
    const out: Segment[] = [];
    for (let j = 0; ; j++) {
      const yAbs = (j + 0.5) * pitch;
      if (yAbs + hh > b) break;
      for (const y of [-yAbs, yAbs]) {
        const outerY = yAbs + hh + (y > 0 ? labelSpace : 0);   // farthest extent of a box in this row (label strip at the bottom)
        const xo = halfWidth(a, b, outerY);
        const xi = ib > 0 ? halfWidth(ia, ib, yAbs - hh) : 0;   // nearest extent must clear the inner ellipse
        if (xo < minW / 2) continue;
        if (xi > 0) {
          const right = { y, x0: xi + gap / 2, x1: xo, key: 0 }, left = { y, x0: -xo, x1: -xi - gap / 2, key: 0 };
          const mid = (xi + xo) / 2;
          right.key = Math.atan2(y, mid) + Math.PI / 2;                          // 0 at the top … π at the bottom
          left.key = 2 * Math.PI - (Math.atan2(y, mid) + Math.PI / 2);          // π at the bottom … 2π at the top
          if (right.x1 - right.x0 >= minW) out.push(right);
          if (left.x1 - left.x0 >= minW) out.push(left);
        } else {
          // a full row above or below the inner ellipse: top rows first (inner first), bottom rows at the sweep's middle
          out.push({ y, x0: -xo, x1: xo, key: y < 0 ? -1 + yAbs / (10 * b) : Math.PI + (yAbs / (10 * b)) });
        }
      }
    }
    return out.sort((p, q) => p.key - q.key);
  };

  const pack = (list: RingNode[], segs: Segment[]): Map<string, { x: number; y: number }> | null => {
    const placed = new Map<string, { x: number; y: number }>();
    let i = 0;
    for (const s of segs) {
      let x = s.x0;
      while (i < list.length && x + list[i].w <= s.x1 + 1e-6) {
        placed.set(list[i].id, { x: x + list[i].w / 2, y: s.y });
        x += list[i].w + gap;
        i++;
      }
      if (i >= list.length) break;
    }
    return i >= list.length ? placed : null;
  };

  let ia = 0, ib = 0;
  for (const tier of tiers) {
    const list = nodes.filter((n) => n.tier === tier)
      .sort((p, q) => groupIndex(p.group) - groupIndex(q.group) || (p.order ?? 0) - (q.order ?? 0) || p.title.localeCompare(q.title));
    // grow the band until its boxes fit; the start is what the area alone would need
    const area = list.reduce((acc, n) => acc + (n.w + gap) * pitch, 0);
    let a = Math.max(ia + pitch / aspect, Math.sqrt((Math.PI * ia * ia * aspect + area / 0.8) / (Math.PI * aspect)));
    for (let tries = 0; tries < 400; tries++, a += 8) {
      const b = a * aspect;
      const placed = pack(list, segments(a, b, ia, ib));
      if (placed) {
        for (const [id, p] of placed) pos.set(id, p);
        bands.push({ tier, a, b, nodes: list.length });
        ia = a; ib = b;
        break;
      }
    }
  }

  // pairwise check: boxes must keep their gap
  let overlaps = 0;
  for (let i = 0; i < nodes.length; i++) {
    const p = nodes[i], pp = pos.get(p.id)!;
    for (let k = i + 1; k < nodes.length; k++) {
      const q = nodes[k], pq = pos.get(q.id)!;
      if (Math.abs(pp.x - pq.x) < (p.w + q.w) / 2 + gap / 2 - 1e-6 && Math.abs(pp.y - pq.y) < (p.h + q.h) / 2 + gap / 2 - 1e-6) overlaps++;
    }
  }
  return { pos, bands, overlaps };
}
