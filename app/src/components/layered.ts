// Left-to-right layered layout for dependency graphs, with horizontal colour bands.
//
// Rank (column) = longest path from the foundations: a node with no dependencies sits in
// column 0, a node sits one column right of the furthest thing it builds on. Within a
// column, nodes are grouped into bands by `group` (domain), bands stacked in a fixed order
// so each colour forms a horizontal stripe across the whole graph; inside a band, nodes are
// ordered by the average y of what they build on to reduce crossings. Deterministic, so the
// picture is identical on every load.

export interface LNode { id: string; group: string; w: number; h: number; title: string }
/** `from` builds on `to` */
export interface LEdge { from: string; to: string }
export interface LayeredOptions {
  groupOrder: string[];
  colGap?: number;   // space between rank columns (rows when direction is "up")
  rowGap?: number;   // space between boxes in a band
  bandGap?: number;  // space between bands
  /** "right": foundations on the left, bands are horizontal stripes.
   *  "up": foundations at the bottom, bands are vertical columns. */
  direction?: "right" | "up";
  /** at most this many boxes side by side within one band at one rank; the rest wrap.
   *  Keeps a band from growing very wide (direction "up") or very tall ("right"). */
  wrap?: number;
}

export function layered(nodes: LNode[], edges: LEdge[], opts: LayeredOptions): Map<string, { x: number; y: number }> {
  if (opts.direction === "up") {
    // lay out with width/height swapped, then rotate: rank axis becomes vertical (bottom = foundations)
    const t = layered(nodes.map((n) => ({ ...n, w: n.h, h: n.w })), edges, { ...opts, direction: "right" });
    return new Map([...t].map(([id, p]) => [id, { x: p.y, y: -p.x }]));
  }
  const { colGap = 80, rowGap = 22, bandGap = 40, wrap = Number.POSITIVE_INFINITY } = opts;
  // a (group, rank) list is arranged as a grid of up to `wrap` sub-columns; its footprint:
  const grid = (list: LNode[]) => {
    const cols = Math.max(1, Math.min(wrap, list.length));
    const rows = Math.ceil(list.length / cols);
    const colWidths = Array(cols).fill(0);
    const rowHeights = Array(rows).fill(0);
    list.forEach((n, i) => {
      colWidths[i % cols] = Math.max(colWidths[i % cols], n.w);
      rowHeights[Math.floor(i / cols)] = Math.max(rowHeights[Math.floor(i / cols)], n.h);
    });
    const w = colWidths.reduce((a, b) => a + b, 0) + (cols - 1) * rowGap;
    const h = rowHeights.reduce((a, b) => a + b, 0) + (rows - 1) * rowGap;
    return { cols, colWidths, rowHeights, w, h };
  };
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const deps = new Map<string, string[]>();
  for (const n of nodes) deps.set(n.id, []);
  for (const e of edges) if (byId.has(e.from) && byId.has(e.to) && e.from !== e.to) deps.get(e.from)!.push(e.to);

  // break cycles: drop back edges found by DFS (a cycle can arise from multi-introducers)
  const state = new Map<string, number>();
  const drop = new Set<string>();
  const dfs = (u: string) => {
    state.set(u, 1);
    for (const v of deps.get(u)!) {
      const s = state.get(v);
      if (s === 1) drop.add(`${u}>${v}`);
      else if (s === undefined) dfs(v);
    }
    state.set(u, 2);
  };
  for (const n of nodes) if (!state.has(n.id)) dfs(n.id);
  for (const [u, list] of deps) deps.set(u, list.filter((v) => !drop.has(`${u}>${v}`)));

  // rank = longest path to a foundation
  const rank = new Map<string, number>();
  const rankOf = (u: string): number => {
    const r = rank.get(u);
    if (r !== undefined) return r;
    const d = deps.get(u)!;
    const v = d.length ? 1 + Math.max(...d.map(rankOf)) : 0;
    rank.set(u, v);
    return v;
  };
  for (const n of nodes) rankOf(n.id);
  const ncols = Math.max(...rank.values()) + 1;

  // column x positions from the widest grid in each column
  const groupIndex = (g: string) => { const i = opts.groupOrder.indexOf(g); return i < 0 ? opts.groupOrder.length : i; };
  const groups = [...new Set(nodes.map((n) => n.group))].sort((a, b) => groupIndex(a) - groupIndex(b) || a.localeCompare(b));
  const cell = (g: string, c: number) => nodes.filter((n) => n.group === g && rank.get(n.id) === c);
  const colW = Array(ncols).fill(0);
  for (let c = 0; c < ncols; c++) for (const g of groups) colW[c] = Math.max(colW[c], grid(cell(g, c)).w);
  const colX: number[] = [];
  let x = 0;
  for (let c = 0; c < ncols; c++) { colX.push(x + colW[c] / 2); x += colW[c] + colGap; }

  // band heights: the tallest grid of that group in any column
  const bandH = new Map<string, number>();
  for (const g of groups) {
    let h = 0;
    for (let c = 0; c < ncols; c++) h = Math.max(h, grid(cell(g, c)).h);
    bandH.set(g, h);
  }
  const bandY = new Map<string, number>();
  let y = 0;
  for (const g of groups) { bandY.set(g, y); y += bandH.get(g)! + bandGap; }

  // place column by column; within a band, order by barycentre of dependencies, fill the grid
  const pos = new Map<string, { x: number; y: number }>();
  for (let c = 0; c < ncols; c++) {
    for (const g of groups) {
      const list = cell(g, c);
      if (!list.length) continue;
      const bary = (n: LNode) => {
        const ys = deps.get(n.id)!.map((d) => pos.get(d)?.y).filter((v): v is number => v !== undefined);
        return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : Number.POSITIVE_INFINITY;
      };
      list.sort((a, b) => bary(a) - bary(b) || a.title.localeCompare(b.title));
      const gr = grid(list);
      const x0 = colX[c] - gr.w / 2;                               // grid is centred in the column
      const y0 = bandY.get(g)! + (bandH.get(g)! - gr.h) / 2;       // and centred in its band
      list.forEach((n, i) => {
        const ci = i % gr.cols, ri = Math.floor(i / gr.cols);
        const x = x0 + gr.colWidths.slice(0, ci).reduce((a, b) => a + b, 0) + ci * rowGap + gr.colWidths[ci] / 2;
        const y = y0 + gr.rowHeights.slice(0, ri).reduce((a, b) => a + b, 0) + ri * rowGap + gr.rowHeights[ri] / 2;
        pos.set(n.id, { x, y });
      });
    }
  }
  return pos;
}
