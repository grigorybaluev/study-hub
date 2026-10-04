// The course graph: one column per term of a program variant, official prerequisites and co-requisites,
// and the reliance derived from the units. Part of Explore, beside the DS Concept Map.
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ElementDefinition, LayoutOptions } from "cytoscape";
import GraphView, { FONT, boxLabel, tint, useTheme } from "../components/GraphView";
import { Badge, CourseChip } from "../components/Chips";
import { href, node, useData, type Data } from "../data/load";
import type { CourseNode } from "../data/types";
import { NEUTRAL } from "../components/domains";

const TERM_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#a855f7"];
const PRESET: LayoutOptions = { name: "preset", padding: 24, fit: true } as LayoutOptions;
const SEASON = { fall: "Fall", winter: "Winter", summer: "Summer" };
const COL_W = 230;   // horizontal distance between term columns
const ROW_GAP = 14;
type Theme = "light" | "dark";

export default function CourseGraph() {
  const d = useData();
  const nav = useNavigate();
  const [variantId, setVariantId] = useState(d.programs[0].variants.find((v) => v.coop)?.id ?? d.programs[0].variants[0].id);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const theme = useTheme();
  // memoized: a new element list makes the graph rebuild and re-fit, which would undo every zoom
  const elements = useMemo(() => courseElements(d, variantId, theme), [d, variantId, theme]);
  const open = (id: string) => { if (node(d, id)?.type === "course") nav(href.course(id)); };
  const help = "One column per term of the selected variant (assumed-prior and external courses on the left). Solid arrows: official prerequisites; dashed: co-requisites; faint: derived reliance. Click to highlight, double-click to open.";
  const variant = d.programs[0].variants.find((v) => v.id === variantId)!;

  return (
    <div className="explore">
      <div className="explore-graph">
        <GraphView elements={elements} layout={PRESET} highlight={selected} onSelect={setSelected} onOpen={open}
          height="100%" maxZoom={1.3} onZoom={setZoom} inset={{ top: 96, right: 12, bottom: 12, left: 12 }} />
      </div>
      <div className="explore-panel">
        <h1>Courses</h1>
        <select value={variantId} onChange={(e) => setVariantId(e.target.value)} aria-label="Program variant">
          {d.programs[0].variants.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}</option>)}
        </select>
        <Link className="small" to="/explore" title="Every concept of data science, placed by relevance and coloured by domain">DS Concept Map →</Link>
      </div>
      <div className="explore-legend">
        {variant.terms.filter((t) => t.courses).map((t, i) => (
          <span key={t.index}><i style={{ background: tint(TERM_COLORS[i % TERM_COLORS.length], theme), borderColor: TERM_COLORS[i % TERM_COLORS.length] }} />Y{t.year} {SEASON[t.season]}</span>
        ))}
        <span><i style={{ background: tint(NEUTRAL, theme), borderColor: NEUTRAL }} />assumed / external</span>
      </div>
      <div className="explore-zoom" title="Effective label size at the current zoom">text {(FONT * zoom).toFixed(1)} px</div>
      <div className="explore-help" title={help}>?</div>
      {selected && node(d, selected)?.type === "course" && (
        <div className="explore-selected"><Selected course={node<CourseNode>(d, selected)!} /></div>
      )}
    </div>
  );
}

function Selected({ course }: { course: CourseNode }) {
  const d = useData();
  return <div><CourseChip id={course.id} /> {course.title} <Badge kind={course.kind} /> · {d.unitsOf.get(course.id)?.length ?? 0} units</div>;
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
