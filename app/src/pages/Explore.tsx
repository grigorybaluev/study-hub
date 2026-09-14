import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ElementDefinition, LayoutOptions } from "cytoscape";
import GraphView, { boxLabel, tint, useTheme } from "../components/GraphView";
import { Badge, ConceptChip, CourseChip, UnitLink } from "../components/Chips";
import { edgesOut, href, node, useData, type Data } from "../data/load";
import type { ConceptNode, CourseNode, UnitNode } from "../data/types";

type View = "courses" | "concepts" | "units";

const DOMAIN_COLOR: Record<string, string> = {
  "math.calculus": "#3b6fd6", "math.linear-algebra": "#5b8def", "math.discrete": "#7c5cd6", theory: "#a04fb5",
  probability: "#d65c8c", statistics: "#d67f3b", programming: "#2f9e7a", algorithms: "#3f8f4f", systems: "#7a8a3b",
  data: "#2f8fa3", ml: "#c9a227",
};
const TERM_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#a855f7"];
const NEUTRAL = "#94a3b8";

const PRESET: LayoutOptions = { name: "preset", padding: 24, fit: true } as LayoutOptions;
const FCOSE: LayoutOptions = { name: "fcose", animate: false, nodeRepulsion: 9000, idealEdgeLength: 90, padding: 24 } as LayoutOptions;

export default function Explore() {
  const d = useData();
  const nav = useNavigate();
  const [view, setView] = useState<View>("courses");
  const [variantId, setVariantId] = useState(d.programs[0].variants.find((v) => v.coop)?.id ?? d.programs[0].variants[0].id);
  const [courseId, setCourseId] = useState<string>(d.courses.find((c) => c.code === "MAST221")?.id ?? d.courses[0].id);
  const [selected, setSelected] = useState<string | null>(null);
  const theme = useTheme();

  const elements = useMemo<ElementDefinition[]>(() => {
    if (view === "courses") return courseElements(d, variantId, theme);
    if (view === "concepts") return conceptElements(d, theme);
    return unitElements(d, courseId, theme);
  }, [d, view, variantId, courseId, theme]);
  const layout = view === "concepts" ? FCOSE : PRESET;

  const open = (id: string) => {
    const n = node(d, id);
    if (!n) return;
    if (n.type === "course") nav(href.course(id));
    else if (n.type === "unit") nav(href.unit(id));
    else if (n.type === "concept") nav(href.concept(id));
  };

  return (
    <>
      <h1>Explore</h1>
      <div className="tabs">
        <button className={view === "courses" ? "active" : ""} onClick={() => { setView("courses"); setSelected(null); }}>Courses</button>
        <button className={view === "concepts" ? "active" : ""} onClick={() => { setView("concepts"); setSelected(null); }}>Concepts</button>
        <button className={view === "units" ? "active" : ""} onClick={() => { setView("units"); setSelected(null); }}>Units of a course</button>
        <span className="spacer" style={{ flex: 1 }} />
        {view === "courses" && (
          <select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
            {d.programs[0].variants.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}</option>)}
          </select>
        )}
        {view === "units" && (
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {d.courses.filter((c) => (d.unitsOf.get(c.id)?.length ?? 0) > 0).map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
          </select>
        )}
      </div>
      <p className="muted small">
        {view === "courses" && "One column per term of the selected variant (assumed-prior and external courses on the left). Solid arrows: official prerequisites; dashed: co-requisites; faint arrows: derived reliance, thicker = more concepts. Click to highlight, double-click to open."}
        {view === "concepts" && "Concepts coloured by domain; size = how many units require them; arrows = generalizes. Click to highlight, double-click to open."}
        {view === "units" && "The course's units top to bottom in teaching order (right), and the units of other courses they depend on, one column per course (left). Solid arrows: hard requirements; faint: soft. Click to highlight, double-click to open."}
      </p>
      <GraphView elements={elements} layout={layout} highlight={selected} onSelect={setSelected} onOpen={open} />
      {selected && <Selected id={selected} />}
    </>
  );
}

function Selected({ id }: { id: string }) {
  const d = useData();
  const n = node(d, id);
  if (!n) return null;
  if (n.type === "course") {
    const c = n as CourseNode;
    return <p><CourseChip id={c.id} /> {c.title} <Badge kind={c.kind} /> · {d.unitsOf.get(c.id)?.length ?? 0} units</p>;
  }
  if (n.type === "unit") {
    const u = n as UnitNode;
    return <p><UnitLink id={u.id} /> <Badge kind={u.status} /> — introduces {edgesOut(d, u.id, "introduces").map((e) => <ConceptChip key={e.to} id={e.to} />)}</p>;
  }
  if (n.type === "concept") {
    const c = n as ConceptNode;
    const idx = d.derived.concepts[c.id];
    return <p><ConceptChip id={c.id} /> {c.body} <span className="muted small">— introduced by {idx.introduced_by.length}, required by {idx.required_by.length} units</span></p>;
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

function conceptElements(d: Data, theme: Theme): ElementDefinition[] {
  const els: ElementDefinition[] = [];
  for (const c of d.concepts) {
    const color = DOMAIN_COLOR[c.domain] ?? NEUTRAL;
    els.push({ data: { id: c.id, ...boxLabel("", c.title, 20), fill: tint(color, theme), border: color } });
  }
  for (const e of d.graph.edges) {
    if (e.type === "generalizes") els.push({ data: { id: `${e.from}>${e.to}`, source: e.to, target: e.from, width: 1.2, alpha: 0.6 } });
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
    if (byCourse.has(e.to) || ownIds.has(e.to)) continue;
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
  for (const e of deps) {
    els.push({ data: { id: `${e.to}>${e.from}`, source: e.to, target: e.from, width: e.strength === "hard" ? 1.4 : 1, alpha: e.strength === "hard" ? 0.8 : 0.3 } });
  }
  return els;
}
