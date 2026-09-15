import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ElementDefinition, LayoutOptions } from "cytoscape";
import GraphView, { boxLabel, clearSaved, tint, useTheme } from "../components/GraphView";
import { compactRows, layered } from "../components/layered";
import { FONT } from "../components/GraphView";
import { Badge, ConceptChip, CourseChip, UnitLink } from "../components/Chips";
import { edgesOut, href, node, useData, type Data } from "../data/load";
import type { ConceptNode, CourseNode, UnitNode } from "../data/types";

type View = "courses" | "concepts" | "units";

const DOMAIN_COLOR: Record<string, string> = {
  "math.calculus": "#3b6fd6", "math.linear-algebra": "#5b8def", "math.discrete": "#7c5cd6", theory: "#a04fb5",
  probability: "#d65c8c", statistics: "#d67f3b", programming: "#2f9e7a", algorithms: "#3f8f4f", systems: "#7a8a3b",
  data: "#2f8fa3", ml: "#c9a227",
};
const DOMAIN_ORDER = ["math.discrete", "math.calculus", "math.linear-algebra", "probability", "statistics", "theory", "algorithms", "programming", "systems", "data", "ml"];
const TERM_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#a855f7"];
const NEUTRAL = "#94a3b8";

const PRESET: LayoutOptions = { name: "preset", padding: 24, fit: true } as LayoutOptions;

export default function Explore() {
  const d = useData();
  const nav = useNavigate();
  const [view, setView] = useState<View>("concepts");
  const [variantId, setVariantId] = useState(d.programs[0].variants.find((v) => v.coop)?.id ?? d.programs[0].variants[0].id);
  const [courseId, setCourseId] = useState<string>(d.courses.find((c) => c.code === "MAST221")?.id ?? d.courses[0].id);
  const [scope, setScope] = useState<string>("all");
  const [resetToken, setResetToken] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const theme = useTheme();

  const elements = useMemo<ElementDefinition[]>(() => {
    if (view === "courses") return courseElements(d, variantId, theme);
    if (view === "concepts") return conceptElements(d, theme, scope);
    return unitElements(d, courseId, theme);
  }, [d, view, variantId, courseId, scope, theme]);
  const layout = PRESET;
  const positionsKey = view === "concepts" ? `explore:concepts:${scope}` : undefined;

  const open = (id: string) => {
    const n = node(d, id);
    if (!n) return;
    if (n.type === "course") nav(href.course(id));
    else if (n.type === "unit") nav(href.unit(id));
    else if (n.type === "concept") nav(href.concept(id));
  };
  const pick = (v: View) => { setView(v); setSelected(null); };

  const help = view === "courses"
    ? "One column per term of the selected variant (assumed-prior and external courses on the left). Solid arrows: official prerequisites; dashed: co-requisites; faint: derived reliance. Click to highlight, double-click to open."
    : view === "units"
    ? "The course's units top to bottom in teaching order (right); the units of other courses they depend on, one column per course (left); arcs beside the spine are dependencies within the course. Click to highlight, double-click to open."
    : scope === "all"
    ? "Foundations at the bottom, what builds on them above; colours are domains, clustered within each level. Arrows lead from a concept to the ones that require it; solid = hard, faint = soft, dashed = generalizes. Drag to tidy (remembered). Click to highlight, double-click to open."
    : "Foundations on the left, what builds on them to the right; each colour band is a domain. Arrows lead from a concept to the ones that require it; solid = hard, faint = soft, dashed = generalizes. Drag to tidy (remembered per scope). Click to highlight, double-click to open.";

  return (
    <div className="explore">
      <div className="explore-graph">
        <GraphView elements={elements} layout={layout} highlight={selected} onSelect={setSelected} onOpen={open}
          positionsKey={positionsKey} resetToken={resetToken} height="100%" maxZoom={1.3} onZoom={setZoom}
          inset={{ top: 64, right: 12, bottom: 12, left: 12 }} />
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
            <button className="plain" onClick={() => { if (positionsKey) clearSaved(positionsKey); setResetToken((t) => t + 1); }} title="Forget dragged positions and re-run the layout">reset layout</button>
          </>
        )}
        {view === "units" && (
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {d.courses.filter((c) => (d.unitsOf.get(c.id)?.length ?? 0) > 0).map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
          </select>
        )}
      </div>
      <div className="explore-zoom" title="Effective label size at the current zoom">text {(FONT * zoom).toFixed(1)} px</div>
      <div className="explore-help" title={help}>?</div>
      {selected && <div className="explore-selected"><Selected id={selected} /></div>}
    </div>
  );
}

function Selected({ id }: { id: string }) {
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
    return <div><ConceptChip id={c.id} /> {c.body} <span className="muted small">— introduced by {idx.introduced_by.length}, required by {idx.required_by.length} units</span></div>;
  }
  return null;
}

// ---------------------------------------------------------------- element builders

const COL_W = 230;   // horizontal distance between term columns
const ROW_GAP = 14;

type Theme = "light" | "dark";
const SEASON = { fall: "Fall", winter: "Winter", summer: "Summer" };

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

function conceptElements(d: Data, theme: Theme, scope: string): ElementDefinition[] {
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
  const deps = d.derived.concept_depends_on.filter((e) => focus.has(e.from));
  const shown = new Set([...focus, ...deps.map((e) => e.to)]);
  const gens = d.graph.edges.filter((e) => e.type === "generalizes" && shown.has(e.from) && shown.has(e.to));

  const boxes = d.concepts.filter((c) => shown.has(c.id)).map((c) => ({ c, box: boxLabel("", c.title, scope === "all" ? 26 : 20) }));
  const lnodes = boxes.map(({ c, box }) => ({ id: c.id, group: c.domain, w: box.w, h: box.h, title: c.title }));
  const ledges = [...deps.map((e) => ({ from: e.from, to: e.to })), ...gens.map((e) => ({ from: e.from, to: e.to }))];
  const pos = scope === "all"
    ? compactRows(lnodes, ledges, { groupOrder: DOMAIN_ORDER, maxWidth: 1716, gapX: 9, rowGap: 10 })
    : layered(lnodes, ledges, { groupOrder: DOMAIN_ORDER, direction: "right", colGap: 70, rowGap: 18, bandGap: 36 });

  const els: ElementDefinition[] = [];
  for (const { c, box } of boxes) {
    const color = DOMAIN_COLOR[c.domain] ?? NEUTRAL;
    els.push({ data: { id: c.id, ...box, fill: tint(color, theme), border: color, dim: !focus.has(c.id) }, position: pos.get(c.id) });
  }
  // arrows lead from the foundation to what builds on it, matching the left-to-right reading
  const dense = scope === "all";
  for (const e of deps) {
    els.push({ data: { id: `${e.from}>${e.to}:d`, source: e.to, target: e.from, width: (dense ? 0.6 : 0.8) + Math.min(e.weight, 6) * (dense ? 0.2 : 0.3), alpha: e.strength === "hard" ? (dense ? 0.45 : 0.7) : (dense ? 0.18 : 0.28) } });
  }
  for (const e of gens) {
    els.push({ data: { id: `${e.from}>${e.to}:g`, source: e.to, target: e.from, width: 1, alpha: 0.5, dashed: true, tinted: true, color: "#a04fb5" } });
  }
  return els;
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
