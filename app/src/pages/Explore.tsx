import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ElementDefinition, LayoutOptions } from "cytoscape";
import GraphView, { boxLabel, clearSaved, tint, useTheme } from "../components/GraphView";
import { compactRows } from "../components/layered";
import { rings } from "../components/rings";
import { FONT } from "../components/GraphView";
import { Badge, ConceptChip, CourseChip, UnitLink } from "../components/Chips";
import { edgesIn, edgesOut, href, node, useData, type Data } from "../data/load";
import type { ConceptNode, CourseNode, DsTier, UnitNode } from "../data/types";

type View = "courses" | "concepts" | "units";
/** concept view: layered rows (foundations at the bottom) or the concentric DS map (#155) */
type ConceptLayout = "layers" | "map";
/** which tiers to show: everything, the DS cluster (application + core), or that plus supporting */
type TierFilter = "all" | "ds" | "ds+";

const DOMAIN_COLOR: Record<string, string> = {
  "math.calculus": "#3b6fd6", "math.linear-algebra": "#5b8def", "math.discrete": "#7c5cd6", theory: "#a04fb5",
  probability: "#d65c8c", statistics: "#d67f3b", programming: "#2f9e7a", algorithms: "#3f8f4f", systems: "#7a8a3b",
  data: "#2f8fa3", ml: "#c9a227",
};
const DOMAIN_ORDER = ["math.discrete", "math.calculus", "math.linear-algebra", "probability", "statistics", "theory", "algorithms", "programming", "systems", "data", "ml"];
const TERM_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#a855f7"];
const NEUTRAL = "#94a3b8";
export const TIERS: DsTier[] = ["application", "core", "supporting", "peripheral"];
export const TIER_COLOR: Record<DsTier, string> = { application: "#d4a017", core: "#3f9e6e", supporting: "#6f8fc0", peripheral: "#9a9a9a" };
export const TIER_LABEL: Record<DsTier, string> = { application: "DS application", core: "core foundation", supporting: "supporting", peripheral: "peripheral" };
const TIER_INDEX: Record<DsTier, number> = { application: 0, core: 1, supporting: 2, peripheral: 3 };

const PRESET: LayoutOptions = { name: "preset", padding: 24, fit: true } as LayoutOptions;

export default function Explore() {
  const d = useData();
  const nav = useNavigate();
  const [view, setView] = useState<View>("concepts");
  const [variantId, setVariantId] = useState(d.programs[0].variants.find((v) => v.coop)?.id ?? d.programs[0].variants[0].id);
  const [courseId, setCourseId] = useState<string>(d.courses.find((c) => c.code === "MAST221")?.id ?? d.courses[0].id);
  const [scope, setScope] = useState<string>("all");
  const [conceptLayout, setConceptLayout] = useState<ConceptLayout>("layers");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [resetToken, setResetToken] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const theme = useTheme();

  const built = useMemo(() => {
    if (view === "courses") return { elements: courseElements(d, variantId, theme), shown: new Set<string>() };
    if (view === "concepts") return conceptElements(d, theme, scope, conceptLayout, tierFilter);
    return { elements: unitElements(d, courseId, theme), shown: new Set<string>() };
  }, [d, view, variantId, courseId, scope, conceptLayout, tierFilter, theme]);
  const layout = PRESET;
  const positionsKey = view === "concepts" ? `explore:concepts:${scope}:${conceptLayout}:${tierFilter}` : undefined;

  const open = (id: string) => {
    const n = node(d, id);
    if (!n) return;
    if (n.type === "course") nav(href.course(id));
    else if (n.type === "unit") nav(href.unit(id));
    else if (n.type === "concept") nav(href.concept(id));
  };
  const pick = (v: View) => { setView(v); setSelected(null); };
  const find = (id: string) => { setSelected(id); setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 })); };

  const help = view === "courses"
    ? "One column per term of the selected variant (assumed-prior and external courses on the left). Solid arrows: official prerequisites; dashed: co-requisites; faint: derived reliance. Click to highlight, double-click to open."
    : view === "units"
    ? "The course's units top to bottom in teaching order (right); the units of other courses they depend on, one column per course (left); arcs beside the spine are dependencies within the course. Click to highlight, double-click to open."
    : conceptLayout === "map"
    ? "The DS map: concentric bands from the centre out — what data science is made of (concepts mapped to the roadmap's target skills), the core foundations they rest on, supporting material reached by a few paths, and the periphery nothing in DS reaches. Box size follows the relevance score; colours are domains, clustered in wedges. Arrows lead from a concept to the ones that require it. Drag to tidy (remembered per layout). Click to see why a concept matters, double-click to open."
    : "Foundations at the bottom, what builds on them above; colours are domains, clustered within each row. Arrows lead from a concept to the ones that require it; solid = hard, faint = soft, dashed = generalizes. Greyed boxes are concepts from outside the scope that these rest on. Drag to tidy (remembered per scope). Click to highlight, double-click to open.";

  return (
    <div className="explore">
      <div className="explore-graph">
        <GraphView elements={built.elements} layout={layout} highlight={selected} onSelect={setSelected} onOpen={open}
          positionsKey={positionsKey} resetToken={resetToken} height="100%" maxZoom={1.3} onZoom={setZoom} focus={focus}
          inset={{ top: 96, right: 12, bottom: 12, left: 12 }} />
      </div>
      <div className="explore-panel">
        <h1>Explore</h1>
        <div className="tabs">
          <button className={view === "concepts" ? "active" : ""} onClick={() => pick("concepts")}>Concepts</button>
          <button className={view === "courses" ? "active" : ""} onClick={() => pick("courses")}>Courses</button>
          <button className={view === "units" ? "active" : ""} onClick={() => pick("units")}>Units of a course</button>
        </div>
        {view === "courses" && (
          <select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
            {d.programs[0].variants.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}</option>)}
          </select>
        )}
        {view === "concepts" && (
          <>
            <select value={scope} onChange={(e) => { setScope(e.target.value); setSelected(null); }}>
              <option value="all">all concepts</option>
              <optgroup label="introduced by course">
                {d.courses.filter((c) => (d.unitsOf.get(c.id)?.length ?? 0) > 0).map((c) => <option key={c.id} value={"course:" + c.id}>{c.code} — {c.title}</option>)}
              </optgroup>
              <optgroup label="domain">
                {[...new Set(d.concepts.map((c) => c.domain))].sort().map((dm) => <option key={dm} value={"domain:" + dm}>{dm}</option>)}
              </optgroup>
            </select>
            <div className="tabs" title="Layout">
              <button className={conceptLayout === "layers" ? "active" : ""} onClick={() => setConceptLayout("layers")}>layers</button>
              <button className={conceptLayout === "map" ? "active" : ""} onClick={() => setConceptLayout("map")}>DS map</button>
            </div>
            <select value={tierFilter} onChange={(e) => { setTierFilter(e.target.value as TierFilter); setSelected(null); }} title="Which DS relevance tiers to show">
              <option value="all">all tiers</option>
              <option value="ds">DS cluster (application + core)</option>
              <option value="ds+">DS cluster + supporting</option>
            </select>
            <ConceptSearch shown={built.shown} onPick={find} />
            <button className="plain" onClick={() => { if (positionsKey) clearSaved(positionsKey); setResetToken((t) => t + 1); }} title="Forget dragged positions and re-run the layout">reset layout</button>
          </>
        )}
        {view === "units" && (
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {d.courses.filter((c) => (d.unitsOf.get(c.id)?.length ?? 0) > 0).map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
          </select>
        )}
      </div>
      <div className="explore-legend">
        {view === "concepts" && conceptLayout === "map" && TIERS.map((t) => (
          <span key={t} title={TIER_HELP[t]}><i style={{ background: band(TIER_COLOR[t], theme), borderColor: TIER_COLOR[t], borderRadius: "50%" }} />{TIER_LABEL[t]}</span>
        ))}
        {view === "concepts" && conceptLayout === "map" && <span className="explore-legend-sep" />}
        {view === "concepts" && DOMAIN_ORDER.filter((dm) => d.concepts.some((c) => c.domain === dm)).map((dm) => (
          <span key={dm}><i style={{ background: tint(DOMAIN_COLOR[dm], theme), borderColor: DOMAIN_COLOR[dm] }} />{dm}</span>
        ))}
        {view === "courses" && (
          <>
            {d.programs[0].variants.find((v) => v.id === variantId)!.terms.filter((t) => t.courses).map((t, i) => (
              <span key={t.index}><i style={{ background: tint(TERM_COLORS[i % TERM_COLORS.length], theme), borderColor: TERM_COLORS[i % TERM_COLORS.length] }} />Y{t.year} {SEASON[t.season]}</span>
            ))}
            <span><i style={{ background: tint(NEUTRAL, theme), borderColor: NEUTRAL }} />assumed / external</span>
          </>
        )}
        {view === "units" && (
          <>
            <span><i style={{ background: tint(TERM_COLORS[0], theme), borderColor: TERM_COLORS[0] }} />this course</span>
            <span><i style={{ background: tint(NEUTRAL, theme), borderColor: NEUTRAL }} />other courses</span>
          </>
        )}
      </div>
      <div className="explore-zoom" title="Effective label size at the current zoom">text {(FONT * zoom).toFixed(1)} px</div>
      <div className="explore-help" title={help}>?</div>
      {selected && <div className="explore-selected"><Selected id={selected} onPick={find} /></div>}
    </div>
  );
}

const TIER_HELP: Record<DsTier, string> = {
  application: "Mapped to a target skill of the DS roadmap: the data-science work itself.",
  core: "Not DS itself, but many DS units rest on it (depth-weighted reach ≥ the core threshold).",
  supporting: "Reached by DS through a few paths only.",
  peripheral: "No DS unit rests on it: taught for the degree, not for data science.",
};

/** Search box inside the graph window: type, pick, and the graph pans to the concept. */
function ConceptSearch({ shown, onPick }: { shown: Set<string>; onPick: (id: string) => void }) {
  const d = useData();
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    const score = (c: ConceptNode) => {
      const title = c.title.toLowerCase();
      if (title.startsWith(t)) return 0;
      if (title.includes(t)) return 1;
      if ((c.short ?? "").toLowerCase().includes(t) || c.aliases.some((a) => a.toLowerCase().includes(t))) return 2;
      return 9;
    };
    return d.concepts.map((c) => ({ c, s: score(c) })).filter((x) => x.s < 9)
      .sort((a, b) => a.s - b.s || a.c.title.localeCompare(b.c.title)).slice(0, 8).map((x) => x.c);
  }, [q, d]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setQ(""); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const choose = (c: ConceptNode) => { onPick(c.id); setQ(""); };
  return (
    <div className="explore-search" ref={box}>
      <input placeholder="Find a concept…" value={q} aria-label="Find a concept in the graph"
        onChange={(e) => { setQ(e.target.value); setHi(0); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setHi((h) => Math.min(h + 1, hits.length - 1));
          else if (e.key === "ArrowUp") setHi((h) => Math.max(h - 1, 0));
          else if (e.key === "Enter" && hits[hi]) choose(hits[hi]);
          else if (e.key === "Escape") setQ("");
        }} />
      {hits.length > 0 && (
        <div className="results">
          {hits.map((c, i) => (
            <button key={c.id} className={(i === hi ? "hi " : "") + (shown.has(c.id) ? "" : "hidden")} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(c)}
              title={shown.has(c.id) ? c.body : "Not in the current scope or tier filter"}>
              <i style={{ background: DOMAIN_COLOR[c.domain] ?? NEUTRAL }} />{c.title}
              {!shown.has(c.id) && <span className="small muted"> · hidden</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Selected({ id, onPick }: { id: string; onPick: (id: string) => void }) {
  const d = useData();
  const n = node(d, id);
  if (!n) return null;
  if (n.type === "course") {
    const c = n as CourseNode;
    return <div><CourseChip id={c.id} /> {c.title} <Badge kind={c.kind} /> · {d.unitsOf.get(c.id)?.length ?? 0} units</div>;
  }
  if (n.type === "unit") {
    const u = n as UnitNode;
    return <div><UnitLink id={u.id} /> <Badge kind={u.status} /> — introduces {edgesOut(d, u.id, "introduces").map((e) => <ConceptChip key={e.to} id={e.to} />)}</div>;
  }
  if (n.type === "concept") {
    const c = n as ConceptNode;
    const idx = d.derived.concepts[c.id];
    const ds = d.derived.ds_relevance.concepts[c.id];
    const why = ds ? whyItMatters(d, c.id) : null;
    return (
      <div>
        <ConceptChip id={c.id} /> {c.body}
        <div className="muted small">introduced by {idx.introduced_by.length}, required by {idx.required_by.length} units</div>
        {ds && (
          <div className="small explore-why">
            <Badge kind={`tier-${ds.tier}`}>{TIER_LABEL[ds.tier]}</Badge>{" "}
            <span className="muted">score {ds.score.toFixed(2)} · {ds.ds_units} DS unit{ds.ds_units === 1 ? "" : "s"} rest on it · {ds.ds_reach} DS concept{ds.ds_reach === 1 ? "" : "s"}</span>
            {why && why.kind === "path" && (
              <div className="explore-path">
                <span className="muted">why it matters: </span>
                {why.chain.map((cid, i) => (
                  <span key={cid}>
                    {i > 0 && <span className="muted"> → </span>}
                    {i === 0 ? <b>{c.title}</b> : <button className="linkish" onClick={() => onPick(cid)}>{node<ConceptNode>(d, cid)?.title ?? cid}</button>}
                  </span>
                ))}
                <span className="muted"> · required by </span><UnitLink id={why.unit} />
              </div>
            )}
            {why && why.kind === "taught" && <div className="explore-path"><span className="muted">a DS concept taught in </span><UnitLink id={why.unit} /></div>}
            {why && why.kind === "concept" && (
              <div className="explore-path">
                <span className="muted">no DS unit requires it directly, but these DS concepts rest on it: </span>
                {why.via.map((cid, i) => <span key={cid}>{i > 0 && ", "}<button className="linkish" onClick={() => onPick(cid)}>{node<ConceptNode>(d, cid)?.title ?? cid}</button></span>)}
              </div>
            )}
            {why && why.kind === "none" && <div className="explore-path muted">no DS unit rests on it — taught for the degree, not for data science.</div>}
          </div>
        )}
      </div>
    );
  }
  return null;
}

type Why = { kind: "path"; chain: string[]; unit: string } | { kind: "taught"; unit: string } | { kind: "concept"; via: string[] } | { kind: "none" };

/** Shortest chain of hard dependencies from a concept up to something a DS unit requires. */
function whyItMatters(d: Data, id: string): Why {
  const ds = d.derived.ds_relevance;
  const dsUnits = new Set(ds.ds_units);
  const requiredByDs = (cid: string) => edgesIn(d, cid, "requires").find((e) => dsUnits.has(e.from) && (e.strength ?? "hard") === "hard"
    && !edgesOut(d, e.from, "introduces").some((x) => x.to === id))?.from;
  const up = (cid: string) => [
    ...d.derived.concept_depends_on.filter((e) => e.to === cid && e.strength === "hard").map((e) => e.from),
    ...edgesIn(d, cid, "generalizes").map((e) => e.from),
  ];
  const prev = new Map<string, string | null>([[id, null]]);
  const queue = [id];
  while (queue.length) {
    const x = queue.shift()!;
    const u = requiredByDs(x);
    if (u) {
      const chain: string[] = [];
      for (let y: string | null = x; y; y = prev.get(y) ?? null) chain.push(y);
      return { kind: "path", chain: chain.reverse(), unit: u };
    }
    for (const y of up(x)) if (!prev.has(y)) { prev.set(y, x); queue.push(y); }
  }
  const taught = d.derived.concepts[id]?.introduced_by.find((u) => dsUnits.has(u));
  if (taught) return { kind: "taught", unit: taught };
  // no unit path, but a DS concept rests on it (through concept-level edges only)
  const via = ds.concepts[id]?.via ?? [];
  return via.length ? { kind: "concept", via } : { kind: "none" };
}

// ---------------------------------------------------------------- element builders

const COL_W = 230;   // horizontal distance between term columns
const ROW_GAP = 14;

type Theme = "light" | "dark";
const SEASON = { fall: "Fall", winter: "Winter", summer: "Summer" };

/** Pale band fill: the tier colour over the page background, fainter than a node tint. */
function band(hex: string, theme: Theme): string {
  const bg = theme === "dark" ? [0x1a, 0x1d, 0x22] : [0xff, 0xff, 0xff];
  const a = theme === "dark" ? 0.16 : 0.09;
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return "#" + c.map((v, i) => Math.round(v * a + bg[i] * (1 - a)).toString(16).padStart(2, "0")).join("");
}

function courseElements(d: Data, variantId: string, theme: Theme): ElementDefinition[] {
  const program = d.programs[0];
  const variant = program.variants.find((v) => v.id === variantId)!;
  const uni = d.universities.find((u) => u.id === program.university);
  const assumed = new Set(uni?.assumed_prior ?? []);

  // column per term; assumed-prior / external courses in column 0; work terms are skipped
  const columns: string[][] = [[]];
  const headers = ["Assumed / external"];
  const colOf = new Map<string, number>();
  for (const t of variant.terms) {
    if (!t.courses) continue;
    columns.push([...t.courses]);
    headers.push(`Y${t.year} ${SEASON[t.season]}`);
    for (const c of t.courses) colOf.set(c, columns.length - 1);
  }
  for (const c of d.courses) if (!colOf.has(c.id)) { columns[0].push(c.id); colOf.set(c.id, 0); }
  columns[0].sort((a, b) => Number(assumed.has(b)) - Number(assumed.has(a)) || a.localeCompare(b));

  // predecessors (prereq + coreq + uses) for barycentre ordering within a column
  const preds = new Map<string, string[]>();
  const addPred = (from: string, to: string) => (preds.get(from) ?? preds.set(from, []).get(from)!).push(to);
  for (const e of d.graph.edges) if (e.type === "prereq" || e.type === "coreq") addPred(e.from, e.to);
  for (const u of d.derived.course_uses) addPred(u.from, u.to);

  const boxes = new Map(d.courses.map((c) => [c.id, boxLabel(c.code, c.title, 22)]));
  const pos = new Map<string, { x: number; y: number }>();
  columns.forEach((col, ci) => {
    if (ci > 0) {
      const bary = (id: string) => {
        const ys = (preds.get(id) ?? []).map((p) => pos.get(p)?.y).filter((y): y is number => y !== undefined);
        return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : Number.POSITIVE_INFINITY;
      };
      col.sort((a, b) => bary(a) - bary(b) || a.localeCompare(b));
    }
    const total = col.reduce((acc, id) => acc + boxes.get(id)!.h + ROW_GAP, -ROW_GAP);
    let y = -total / 2;
    for (const id of col) {
      const b = boxes.get(id)!;
      pos.set(id, { x: ci * COL_W, y: y + b.h / 2 });
      y += b.h + ROW_GAP;
    }
  });

  const els: ElementDefinition[] = [];
  const top = Math.min(...[...pos.values()].map((p) => p.y)) - 50;
  headers.forEach((h, ci) => els.push({ classes: "header", data: { id: `hdr:${ci}`, label: h, w: COL_W - 20, h: 20, fill: NEUTRAL, border: NEUTRAL }, position: { x: ci * COL_W, y: top } }));
  for (const c of d.courses) {
    const b = boxes.get(c.id)!;
    const ci = colOf.get(c.id)!;
    const color = c.kind === "core" ? TERM_COLORS[(ci - 1) % TERM_COLORS.length] : NEUTRAL;
    els.push({ data: { id: c.id, ...b, fill: tint(color, theme), border: color, dim: c.kind !== "core" }, position: pos.get(c.id) });
  }
  for (const e of d.graph.edges) {
    if (e.type === "prereq") els.push({ data: { id: `${e.from}>${e.to}:p`, source: e.to, target: e.from, width: 1.4, alpha: 0.85 } });
    if (e.type === "coreq") els.push({ data: { id: `${e.from}>${e.to}:c`, source: e.to, target: e.from, width: 1.2, alpha: 0.7, dashed: true } });
  }
  for (const u of d.derived.course_uses) {
    els.push({ data: { id: `${u.from}>${u.to}:u`, source: u.to, target: u.from, width: 0.5 + Math.min(u.weight, 12) * 0.12, alpha: 0.18 } });
  }
  return els;
}

function conceptElements(d: Data, theme: Theme, scope: string, layout: ConceptLayout, tierFilter: TierFilter): { elements: ElementDefinition[]; shown: Set<string> } {
  const ds = d.derived.ds_relevance.concepts;
  const tierOf = (id: string): DsTier => ds[id]?.tier ?? "peripheral";
  const passes = (id: string) => tierFilter === "all" || tierOf(id) === "application" || tierOf(id) === "core" || (tierFilter === "ds+" && tierOf(id) === "supporting");
  // focus set: the concepts in scope; context set: what they directly build on
  let focus: Set<string>;
  if (scope.startsWith("course:")) {
    const cid = scope.slice(7);
    focus = new Set((d.unitsOf.get(cid) ?? []).flatMap((u) => edgesOut(d, u.id, "introduces").map((e) => e.to)));
  } else if (scope.startsWith("domain:")) {
    focus = new Set(d.concepts.filter((c) => c.domain === scope.slice(7)).map((c) => c.id));
  } else {
    focus = new Set(d.concepts.map((c) => c.id));
  }
  focus = new Set([...focus].filter(passes));
  const deps = d.derived.concept_depends_on.filter((e) => focus.has(e.from) && passes(e.to));
  const shown = new Set([...focus, ...deps.map((e) => e.to)]);
  const gens = d.graph.edges.filter((e) => e.type === "generalizes" && shown.has(e.from) && shown.has(e.to));
  const dense = scope === "all";
  const els: ElementDefinition[] = [];

  if (layout === "map") {
    // box size follows the relevance score; tiers are the bands, domains the wedges; one line per box keeps the rows even
    const boxes = d.concepts.filter((c) => shown.has(c.id)).map((c) => ({ c, box: boxLabel("", c.short ?? c.title, 40, 0.8 + 0.5 * (ds[c.id]?.score ?? 0)) }));
    const rnodes = boxes.map(({ c, box }) => ({ id: c.id, tier: TIER_INDEX[tierOf(c.id)], group: c.domain, w: box.w, h: box.h, title: c.title, order: -(ds[c.id]?.score ?? 0) }));
    const { pos, bands } = rings(rnodes, { groupOrder: DOMAIN_ORDER, aspect: 0.58, gap: 10 });
    // bands are drawn outermost first so each inner band paints over the one around it
    for (const b of [...bands].sort((x, y) => y.tier - x.tier)) {
      const tier = TIERS[b.tier];
      els.push({ classes: "band", data: { id: `band:${tier}`, label: "", w: 2 * b.a, h: 2 * b.b, fill: band(TIER_COLOR[tier], theme), border: TIER_COLOR[tier] }, position: { x: 0, y: 0 } });
    }
    for (const b of bands) {
      const tier = TIERS[b.tier];
      els.push({ classes: "band-label", data: { id: `bandlabel:${tier}`, label: `${TIER_LABEL[tier]} · ${b.nodes}`, w: 220, h: 14, fill: "#000", border: "#000", color: TIER_COLOR[tier] }, position: { x: 0, y: b.b - 11 } });
    }
    for (const { c, box } of boxes) {
      const color = DOMAIN_COLOR[c.domain] ?? NEUTRAL;
      els.push({ data: { id: c.id, ...box, fill: tint(color, theme), border: color, dim: !focus.has(c.id) }, position: pos.get(c.id) });
    }
  } else {
    const boxes = d.concepts.filter((c) => shown.has(c.id)).map((c) => ({ c, box: boxLabel("", c.title, 26) }));
    const lnodes = boxes.map(({ c, box }) => ({ id: c.id, group: c.domain, w: box.w, h: box.h, title: c.title }));
    const ledges = [...deps.map((e) => ({ from: e.from, to: e.to })), ...gens.map((e) => ({ from: e.from, to: e.to }))];
    // same bottom-up packing for every scope; smaller graphs get more air between rows
    const small = lnodes.length < 60;
    const pos = compactRows(lnodes, ledges, { groupOrder: DOMAIN_ORDER, maxWidth: 1716, gapX: small ? 18 : 9, rowGap: small ? 36 : 10 });
    for (const { c, box } of boxes) {
      const color = DOMAIN_COLOR[c.domain] ?? NEUTRAL;
      const { fs: _fs, ...rest } = box;
      els.push({ data: { id: c.id, ...rest, fill: tint(color, theme), border: color, dim: !focus.has(c.id) }, position: pos.get(c.id) });
    }
  }
  // arrows lead from the foundation to what builds on it, matching the left-to-right reading
  for (const e of deps) {
    els.push({ data: { id: `${e.from}>${e.to}:d`, source: e.to, target: e.from, width: (dense ? 0.6 : 0.8) + Math.min(e.weight, 6) * (dense ? 0.2 : 0.3), alpha: e.strength === "hard" ? (dense ? 0.45 : 0.7) : (dense ? 0.18 : 0.28) } });
  }
  for (const e of gens) {
    els.push({ data: { id: `${e.from}>${e.to}:g`, source: e.to, target: e.from, width: 1, alpha: 0.5, dashed: true, tinted: true, color: "#a04fb5" } });
  }
  return { elements: els, shown };
}

function unitElements(d: Data, courseId: string, theme: Theme): ElementDefinition[] {
  const own = d.unitsOf.get(courseId) ?? [];
  const ownIds = new Set(own.map((u) => u.id));
  const deps = d.derived.unit_depends_on.filter((e) => ownIds.has(e.from));

  // external units grouped by course, one column per course, in program order (course id)
  const byCourse = new Map<string, UnitNode[]>();
  for (const e of deps) {
    if (e.same_course || ownIds.has(e.to)) continue;
    const u = node<UnitNode>(d, e.to)!;
    const list = byCourse.get(u.course) ?? byCourse.set(u.course, []).get(u.course)!;
    if (!list.some((x) => x.id === u.id)) list.push(u);
  }
  const extCourses = [...byCourse.keys()].sort();
  for (const list of byCourse.values()) list.sort((a, b) => a.order - b.order);

  const els: ElementDefinition[] = [];
  const stack = (units: UnitNode[], x: number, header: string, color: string, ownCol: boolean) => {
    const boxes = units.map((u) => boxLabel(ownCol ? `${u.order}.` : "", u.title, 26));
    const total = boxes.reduce((a, b) => a + b.h + ROW_GAP, -ROW_GAP);
    let y = -total / 2;
    els.push({ classes: "header", data: { id: `hdr:${x}`, label: header, w: COL_W - 20, h: 20, fill: NEUTRAL, border: NEUTRAL }, position: { x, y: y - 40 } });
    units.forEach((u, i) => {
      const b = boxes[i];
      els.push({ data: { id: u.id, ...b, fill: tint(color, theme), border: color, dim: !ownCol }, position: { x, y: y + b.h / 2 } });
      y += b.h + ROW_GAP;
    });
  };
  extCourses.forEach((cid, i) => stack(byCourse.get(cid)!, i * COL_W, node<CourseNode>(d, cid)!.code, NEUTRAL, false));
  stack(own, extCourses.length * COL_W + 40, node<CourseNode>(d, courseId)!.code, TERM_COLORS[0], true);

  for (let i = 1; i < own.length; i++) {
    els.push({ data: { id: `${own[i - 1].id}>${own[i].id}:o`, source: own[i - 1].id, target: own[i].id, width: 1, alpha: 0.5, dashed: true, tinted: true, color: TERM_COLORS[0] } });
  }
  const orderOf = new Map(own.map((u) => [u.id, u.order]));
  for (const e of deps) {
    if (e.same_course) {
      const gap = (orderOf.get(e.from) ?? 0) - (orderOf.get(e.to) ?? 0);
      if (gap === 1) continue;                       // adjacent units: the teaching-order chain already shows it
      els.push({ data: { id: `${e.to}>${e.from}`, source: e.to, target: e.from, width: 1, alpha: e.strength === "hard" ? 0.6 : 0.3, tinted: true, color: TERM_COLORS[0], bulge: -(110 + gap * 18) } });
    } else {
      els.push({ data: { id: `${e.to}>${e.from}`, source: e.to, target: e.from, width: e.strength === "hard" ? 1.4 : 1, alpha: e.strength === "hard" ? 0.8 : 0.3 } });
    }
  }
  return els;
}
