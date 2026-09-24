// Line-break variants for a display formula that is too wide for its column (#89).
// Breaks only at top level — never inside braces, \left…\right or an environment — and only at
// meaningful points, in this order of preference:
//   1. between independent formulas (a top-level \qquad or \quad), each on its own centred line;
//   2. before each relation of a chain (=, ≤, ⇒, …), aligned on the relation.
// variants(tex)[0] is the formula as written; each later entry breaks more.

const SPACERS = ["\\qquad", "\\quad"];
const RELATIONS = [
  "\\Longleftrightarrow", "\\Longrightarrow", "\\Rightarrow", "\\implies", "\\iff",
  "\\longrightarrow", "\\rightarrow", "\\to", "\\mapsto", "\\vdash",
  "\\approx", "\\equiv", "\\leq", "\\geq", "\\neq", "\\le", "\\ge", "\\ne", "=", "<", ">",
];

/** Top-level cut points: [start, end] of each separator found by `match`. */
function cuts(tex: string, match: (at: number) => number): [number, number][] {
  const out: [number, number][] = [];
  let depth = 0;
  for (let i = 0; i < tex.length; i++) {
    const c = tex[i];
    if (c === "\\") {
      const word = /^\\([A-Za-z]+)/.exec(tex.slice(i))?.[1] ?? "";
      if (word === "left" || word === "begin") depth++;
      else if (word === "right" || word === "end") depth--;
      if (depth === 0 && word) {
        const n = match(i);
        if (n) { out.push([i, i + n]); i += n - 1; continue; }
      }
      i += word ? word.length : 1;   // skip the command name, or an escaped symbol like \{ or \\
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (depth === 0) {
      const n = match(i);
      if (n) { out.push([i, i + n]); i += n - 1; }
    }
  }
  return out;
}

/** Length of the command `name` at `at` if it is there and not the prefix of a longer command. */
function commandAt(tex: string, at: number, name: string): number {
  return tex.startsWith(name, at) && !/[A-Za-z]/.test(tex[at + name.length] ?? "") ? name.length : 0;
}

export function splitSpacers(tex: string): string[] {
  const at = cuts(tex, (i) => SPACERS.reduce((n, s) => n || commandAt(tex, i, s), 0));
  if (!at.length) return [tex];
  const parts: string[] = [];
  let from = 0;
  for (const [s, e] of at) { parts.push(tex.slice(from, s)); from = e; }
  parts.push(tex.slice(from));
  // a piece that is only a relation (`A \quad\Longrightarrow\quad B`) starts the next line
  const out: string[] = [];
  for (const p of parts.map((x) => x.trim()).filter(Boolean)) {
    const prev = out[out.length - 1];
    if (prev !== undefined && RELATIONS.includes(prev)) out[out.length - 1] = `${prev} ${p}`;
    else out.push(p);
  }
  return out;
}

/** Top-level relation cut points of `tex`. */
function relationCuts(tex: string): [number, number][] {
  return cuts(tex, (i) => RELATIONS.reduce((n, r) => n || (r.startsWith("\\") ? commandAt(tex, i, r) : tex.startsWith(r, i) ? r.length : 0), 0));
}

/** Last resort for a single relation `A = B`: the right side on its own line, indented. */
function breakAtRelation(tex: string): string | null {
  const at = relationCuts(tex);
  if (at.length !== 1) return null;
  const [s] = at[0];
  return `\\begin{aligned} &${tex.slice(0, s).trim()} \\\\ &\\quad ${tex.slice(s).trim()} \\end{aligned}`;
}

/** `a = b \le c` -> `\begin{aligned} a &= b \\ &\le c \end{aligned}`, or null with fewer than two relations. */
function alignChain(tex: string): string | null {
  const at = relationCuts(tex);
  if (at.length < 2) return null;
  const lines: string[] = [];
  let from = 0;
  at.forEach(([s], k) => {
    if (k === 0) return;
    lines.push(tex.slice(from, s).trim());
    from = s;
  });
  lines.push(tex.slice(from).trim());
  const [first, ...rest] = lines;
  const [s0, e0] = at[0];
  const head = `${first.slice(0, s0).trim()} &${first.slice(s0, e0)} ${first.slice(e0).trim()}`;
  return `\\begin{aligned} ${[head, ...rest.map((l) => `&${l}`)].join(" \\\\ ")} \\end{aligned}`;
}

/** An authored top-level `aligned`: break each row before its `&relation` too (`A &= B` -> `A \\ &= B`). */
function breakAligned(tex: string): string | null {
  const m = /^\s*\\begin\{aligned\}([\s\S]*)\\end\{aligned\}\s*([.,;]?)\s*$/.exec(tex);
  if (!m) return null;
  const rows = m[1].split(/\\\\(?:\[[^\]]*\])?/);
  if (rows.some((r) => /\\begin\{/.test(r))) return null;   // nested environments: leave as written
  const out = rows.map((r) => {
    const at = r.indexOf("&");
    return at > 0 && r.slice(0, at).trim() ? `${r.slice(0, at).trim()} \\\\ ${r.slice(at).trim()}` : r.trim();
  });
  return `\\begin{aligned} ${out.join(" \\\\ ")} \\end{aligned}${m[2]}`;
}

/** The rows of an authored top-level `gathered` (they are independent formulas), or null. */
function gatheredRows(tex: string): string[] | null {
  const m = /^\\begin\{gathered\}([\s\S]*)\\end\{gathered\}\s*([.,;]?)$/.exec(tex);
  if (!m || /\\begin\{/.test(m[1])) return null;   // nested environments: leave as written
  const rows = m[1].split(/\\\\(?:\[[^\]]*\])?/).map((r) => r.trim()).filter(Boolean);
  if (m[2] && rows.length) rows[rows.length - 1] += ` ${m[2]}`;
  return rows.length > 1 ? rows : null;
}

export function variants(raw: string): string[] {
  const tex = raw.trim();   // cut offsets below are positions in the trimmed string
  const out = [tex];
  const rows = gatheredRows(tex);
  const parts = rows ? rows.flatMap(splitSpacers) : splitSpacers(tex);
  if (parts.length > 1) out.push(`\\begin{gathered} ${parts.join(" \\\\ ")} \\end{gathered}`);
  const chained = parts.map((p) => alignChain(p) ?? p);
  if (chained.some((p, i) => p !== parts[i])) {
    out.push(chained.length > 1 ? `\\begin{gathered} ${chained.join(" \\\\[4pt] ")} \\end{gathered}` : chained[0]);
  }
  const rebroken = breakAligned(tex);
  if (rebroken) out.push(rebroken);
  // last resort: a piece with a single relation breaks before it
  const pieces = parts.map((p) => breakAtRelation(p) ?? alignChain(p) ?? p);
  const last = pieces.length > 1 ? `\\begin{gathered} ${pieces.join(" \\\\[4pt] ")} \\end{gathered}` : pieces[0];
  if (!out.includes(last)) out.push(last);
  return out;
}
