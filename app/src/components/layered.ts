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
  colGap?: number;   // horizontal space between columns
  rowGap?: number;   // vertical space between boxes in a band
  bandGap?: number;  // vertical space between bands
}

export function layered(nodes: LNode[], edges: LEdge[], opts: LayeredOptions): Map<string, { x: number; y: number }> {
  const { colGap = 80, rowGap = 22, bandGap = 40 } = opts;
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

  // column x positions from the widest box in each column
  const colW = Array(ncols).fill(0);
  for (const n of nodes) colW[rank.get(n.id)!] = Math.max(colW[rank.get(n.id)!], n.w);
  const colX: number[] = [];
  let x = 0;
  for (let c = 0; c < ncols; c++) { colX.push(x + colW[c] / 2); x += colW[c] + colGap; }

  // band heights: the tallest stack of that group in any column
  const groupIndex = (g: string) => { const i = opts.groupOrder.indexOf(g); return i < 0 ? opts.groupOrder.length : i; };
  const groups = [...new Set(nodes.map((n) => n.group))].sort((a, b) => groupIndex(a) - groupIndex(b) || a.localeCompare(b));
  const stackH = (list: LNode[]) => list.reduce((acc, n) => acc + n.h, 0) + Math.max(0, list.length - 1) * rowGap;
  const bandH = new Map<string, number>();
  for (const g of groups) {
    let h = 0;
    for (let c = 0; c < ncols; c++) h = Math.max(h, stackH(nodes.filter((n) => n.group === g && rank.get(n.id) === c)));
    bandH.set(g, h);
  }
  const bandY = new Map<string, number>();
  let y = 0;
  for (const g of groups) { bandY.set(g, y); y += bandH.get(g)! + bandGap; }

  // place column by column; within a band, order by barycentre of dependencies
  const pos = new Map<string, { x: number; y: number }>();
  for (let c = 0; c < ncols; c++) {
    for (const g of groups) {
      const list = nodes.filter((n) => n.group === g && rank.get(n.id) === c);
      if (!list.length) continue;
      const bary = (n: LNode) => {
        const ys = deps.get(n.id)!.map((d) => pos.get(d)?.y).filter((v): v is number => v !== undefined);
        return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : Number.POSITIVE_INFINITY;
      };
      list.sort((a, b) => bary(a) - bary(b) || a.title.localeCompare(b.title));
      let cy = bandY.get(g)! + (bandH.get(g)! - stackH(list)) / 2;   // centre the stack in its band
      for (const n of list) {
        pos.set(n.id, { x: colX[c], y: cy + n.h / 2 });
        cy += n.h + rowGap;
      }
    }
  }
  return pos;
}
