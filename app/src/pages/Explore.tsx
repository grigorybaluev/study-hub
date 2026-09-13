import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ElementDefinition, LayoutOptions } from "cytoscape";
import GraphView from "../components/GraphView";
import { Badge, ConceptChip, CourseChip, UnitLink } from "../components/Chips";
import { edgesOut, href, node, useData, type Data } from "../data/load";
import type { ConceptNode, CourseNode, UnitNode } from "../data/types";

type View = "courses" | "concepts" | "units";

const DOMAIN_COLOR: Record<string, string> = {
  "math.calculus": "#3b6fd6", "math.linear-algebra": "#5b8def", "math.discrete": "#7c5cd6", theory: "#a04fb5",
  probability: "#d65c8c", statistics: "#d67f3b", programming: "#2f9e7a", algorithms: "#3f8f4f", systems: "#7a8a3b",
  data: "#2f8fa3", ml: "#c9a227",
};
const TERM_COLORS = ["#bcd4ff", "#a7e3c4", "#ffe3a3", "#f6bcd0", "#d5c4f5", "#b9e6ef", "#f7c9a8", "#c8e3a0", "#e2c8ff"];

const DAGRE: LayoutOptions = { name: "dagre", rankDir: "LR", nodeSep: 18, rankSep: 70, padding: 20 } as LayoutOptions;
const FCOSE: LayoutOptions = { name: "fcose", animate: false, nodeRepulsion: 6000, idealEdgeLength: 70, padding: 20 } as LayoutOptions;

export default function Explore() {
  const d = useData();
  const nav = useNavigate();
  const [view, setView] = useState<View>("courses");
  const [variantId, setVariantId] = useState(d.programs[0].variants.find((v) => v.coop)?.id ?? d.programs[0].variants[0].id);
  const [courseId, setCourseId] = useState<string>(d.courses.find((c) => c.code === "MAST221")?.id ?? d.courses[0].id);
  const [selected, setSelected] = useState<string | null>(null);

  const elements = useMemo<ElementDefinition[]>(() => {
    if (view === "courses") return courseElements(d, variantId);
    if (view === "concepts") return conceptElements(d);
    return unitElements(d, courseId);
  }, [d, view, variantId, courseId]);
  const layout = view === "concepts" ? FCOSE : DAGRE;

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
        {view === "courses" && "Solid arrows: official prerequisites (dashed: co-requisites). Grey arrows: derived reliance, thicker = more concepts. Colour = term in the selected variant. Click to highlight, double-click to open."}
        {view === "concepts" && "Concepts coloured by domain; size = how many units require them; arrows = generalizes. Click to highlight, double-click to open."}
        {view === "units" && "The course's units (left to right in teaching order) and every unit elsewhere they depend on. Click to highlight, double-click to open."}
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

function courseElements(d: Data, variantId: string): ElementDefinition[] {
  const program = d.programs[0];
  const variant = program.variants.find((v) => v.id === variantId)!;
  const term = new Map<string, number>();
  for (const t of variant.terms) for (const c of t.courses ?? []) term.set(c, t.index);
  const els: ElementDefinition[] = [];
  for (const c of d.courses) {
    const t = term.get(c.id);
    const color = c.kind === "core" ? TERM_COLORS[(t ?? 0) % TERM_COLORS.length] : "#e6e6e3";
    els.push({ data: { id: c.id, label: c.code, color, size: c.kind === "core" ? 52 : 38, shape: c.kind === "core" ? "ellipse" : "round-rectangle" } });
  }
  for (const e of d.graph.edges) {
    if (e.type === "prereq") els.push({ data: { id: `${e.from}>${e.to}:p`, source: e.to, target: e.from, color: "#1c1c1a", width: 1.6 } });
    if (e.type === "coreq") els.push({ data: { id: `${e.from}>${e.to}:c`, source: e.to, target: e.from, color: "#1c1c1a", width: 1.2, dashed: true } });
  }
  for (const u of d.derived.course_uses) {
    els.push({ data: { id: `${u.from}>${u.to}:u`, source: u.to, target: u.from, color: "#9aa0a6", width: 0.6 + Math.min(u.weight, 12) * 0.35 } });
  }
  return els;
}

function conceptElements(d: Data): ElementDefinition[] {
  const els: ElementDefinition[] = [];
  for (const c of d.concepts) {
    const idx = d.derived.concepts[c.id];
    const size = 14 + Math.min(idx.required_by.length, 12) * 2.2;
    els.push({ data: { id: c.id, label: c.title, color: DOMAIN_COLOR[c.domain] ?? "#999", size } });
  }
  for (const e of d.graph.edges) {
    if (e.type === "generalizes") els.push({ data: { id: `${e.from}>${e.to}`, source: e.to, target: e.from, color: "#9aa0a6", width: 1.2 } });
  }
  return els;
}

function unitElements(d: Data, courseId: string): ElementDefinition[] {
  const units = d.unitsOf.get(courseId) ?? [];
  const ids = new Set(units.map((u) => u.id));
  const els: ElementDefinition[] = [];
  const add = (u: UnitNode, own: boolean) => {
    const course = node<CourseNode>(d, u.course)!;
    els.push({ data: { id: u.id, label: own ? `${u.order}. ${u.title}` : `${course.code}\n${u.title}`, color: own ? "#bcd4ff" : "#eeeeea", size: own ? 54 : 40, shape: own ? "ellipse" : "round-rectangle" } });
  };
  for (const u of units) add(u, true);
  for (let i = 1; i < units.length; i++) {
    els.push({ data: { id: `${units[i - 1].id}>${units[i].id}:o`, source: units[i - 1].id, target: units[i].id, color: "#bcd4ff", width: 1, dashed: true } });
  }
  for (const e of d.derived.unit_depends_on) {
    if (!ids.has(e.from)) continue;
    if (!els.some((x) => x.data.id === e.to)) add(node<UnitNode>(d, e.to)!, false);
    els.push({ data: { id: `${e.to}>${e.from}`, source: e.to, target: e.from, color: e.strength === "hard" ? "#1c1c1a" : "#9aa0a6", width: e.strength === "hard" ? 1.6 : 1 } });
  }
  return els;
}
