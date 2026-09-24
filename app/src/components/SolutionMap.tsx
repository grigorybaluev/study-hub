// A worked solution beside the method graph it follows (#91). The block names a method graph
// (content/methods/<id>.yaml, carried in graph.json) and lists steps, each at one node of it;
// stepping through the solution lights up the path walked so far. Loaded lazily: it pulls in
// Cytoscape, which a page without solution maps never needs.
import { useEffect, useMemo, useRef, useState } from "react";
import cytoscape, { type ElementDefinition, type StylesheetJson } from "cytoscape";
import YAML from "yaml";
import { useData } from "../data/load";
import type { MethodGraph } from "../data/types";
import { boxLabel, tint, useTheme } from "./GraphView";
import Markdown from "./Markdown";
import NeedsVerification from "./NeedsVerification";

interface Step { node: string; answer?: string | boolean; text: string }
interface MapConfig { id: string; method: string; task: string; steps: Step[]; note?: string; verified?: string[] }

/** Same normalisation as build/schema.py answer_label: case-folded, YAML 1.1 boolean spellings to yes/no. */
const YAML_BOOL: Record<string, string> = { yes: "yes", true: "yes", on: "yes", no: "no", false: "no", off: "no" };
const answerOf = (v: unknown): string | null => {
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (v == null) return null;
  const t = String(v).trim().toLowerCase();
  return YAML_BOOL[t] ?? t;
};

/** The edge each step leaves by: from its node to the next step's node, with its answer if it is a decision. */
function takenEdges(g: MethodGraph, steps: Step[]): (number | null)[] {
  const kind = new Map(g.nodes.map((n) => [n.id, n.kind]));
  return steps.slice(0, -1).map((s, i) => {
    const next = steps[i + 1].node;
    const idx = g.edges.findIndex((e) => e.from === s.node && e.to === next
      && (kind.get(s.node) !== "decision" || answerOf(e.label) === answerOf(s.answer)));
    return idx < 0 ? null : idx;
  });
}

function css(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888888";
}

function stylesheet(theme: "light" | "dark"): StylesheetJson {
  const fg = css("--fg"), muted = css("--fg-muted"), accent = css("--accent"), bg = css("--bg-elev");
  return [
    { selector: "node", style: {
      shape: "round-rectangle", label: "data(label)", "font-size": 13, "text-wrap": "wrap", "text-max-width": "data(w)",
      "text-valign": "center", "text-halign": "center", "line-height": 1.2, color: fg, width: "data(w)", height: "data(h)",
      "background-color": "data(fill)", "border-width": 1.5, "border-color": "data(border)",
    } },
    { selector: "node.end", style: { "border-width": 2.5 } },
    { selector: "edge", style: {
      width: 1.3, "line-color": muted, "target-arrow-color": muted, "target-arrow-shape": "triangle", "arrow-scale": 0.8,
      "curve-style": "bezier", label: "data(label)", "font-size": 11, color: muted,
      "text-background-color": bg, "text-background-opacity": 1, "text-background-padding": "2px",
    } },
    { selector: ".off", style: { opacity: 0.35 } },
    { selector: "node.on", style: { opacity: 1 } },
    { selector: "node.now", style: { "border-width": 4, "border-color": accent, "background-color": tint(accent, theme) } },
    { selector: "edge.on", style: { opacity: 1, width: 2.6, "line-color": accent, "target-arrow-color": accent, color: accent, "font-weight": "bold" } },
  ];
}

const COL_GAP = 34, ROW_GAP = 20;

/** Flowchart positions: the questions down the left in authoring order, each question's method(s)
 * to its right, the ends in a last row. A second method of the same question gets a row of its own. */
function spine(g: MethodGraph, size: Map<string, { w: number; h: number }>): Record<string, { x: number; y: number }> {
  const kind = new Map(g.nodes.map((n) => [n.id, n.kind]));
  const rows: (string | null)[][] = g.nodes.filter((n) => n.kind === "decision").map((n) => [n.id]);
  for (const n of g.nodes.filter((m) => m.kind === "method")) {
    const parent = g.edges.find((e) => e.to === n.id && kind.get(e.from) === "decision")?.from;
    const r = parent ? rows.findIndex((row) => row[0] === parent) : -1;
    if (r < 0) rows.push([null, n.id]);
    else if (rows[r][1]) rows.splice(r + 1, 0, [null, n.id]);
    else rows[r][1] = n.id;
  }
  rows.push(g.nodes.filter((n) => n.kind === "end").map((n) => n.id));
  const ncol = Math.max(...rows.map((r) => r.length));
  const colW = Array.from({ length: ncol }, (_, c) => Math.max(0, ...rows.map((r) => (r[c] ? size.get(r[c]!)!.w : 0))));
  const colX = colW.map((_, c) => colW.slice(0, c).reduce((a, b) => a + b + COL_GAP, 0) + colW[c] / 2);
  const pos: Record<string, { x: number; y: number }> = {};
  let y = 0;
  for (const row of rows) {
    const h = Math.max(...row.map((id) => (id ? size.get(id)!.h : 0)));
    row.forEach((id, c) => { if (id) pos[id] = { x: colX[c], y: y + h / 2 }; });
    y += h + ROW_GAP;
  }
  return pos;
}

function elements(g: MethodGraph, theme: "light" | "dark"): ElementDefinition[] {
  const colour = { decision: css("--warn"), method: css("--accent"), end: css("--info") };
  const boxes = new Map(g.nodes.map((n) => [n.id, boxLabel("", n.label, 20)]));
  const pos = spine(g, boxes);
  return [
    ...g.nodes.map((n) => {
      const { label, w, h } = boxes.get(n.id)!;
      return { data: { id: n.id, label, w, h, fill: tint(colour[n.kind], theme), border: colour[n.kind] }, classes: n.kind, position: pos[n.id] };
    }),
    ...g.edges.map((e, i) => ({ data: { id: `e${i}`, source: e.from, target: e.to, label: e.label ?? "" } })),
  ];
}

function MethodView({ g, steps, at }: { g: MethodGraph; steps: Step[]; at: number }) {
  const host = useRef<HTMLDivElement>(null);
  const cy = useRef<cytoscape.Core | null>(null);
  const theme = useTheme();
  const [height, setHeight] = useState(360);

  useEffect(() => {
    if (!host.current) return;
    const c = cytoscape({
      container: host.current, elements: elements(g, theme), style: stylesheet(theme),
      layout: { name: "preset", fit: false },
      userZoomingEnabled: false, userPanningEnabled: false, boxSelectionEnabled: false, autoungrabify: true,
    });
    // fit the width, never zoom past 1, and let the panel grow tall instead of shrinking the text
    const fit = () => {
      const bb = c.elements().boundingBox({});
      const W = host.current?.clientWidth ?? 300;
      const z = Math.min(1, (W - 16) / bb.w);
      const H = Math.ceil(bb.h * z + 16);
      setHeight(H);
      c.resize();
      c.zoom(z);
      c.pan({ x: (W - bb.w * z) / 2 - bb.x1 * z, y: 8 - bb.y1 * z });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host.current);
    cy.current = c;
    return () => { ro.disconnect(); c.destroy(); cy.current = null; };
  }, [g, theme]);

  useEffect(() => {
    const c = cy.current;
    if (!c) return;
    const taken = takenEdges(g, steps).slice(0, at);
    c.elements().removeClass("on now off").addClass("off");
    steps.slice(0, at + 1).forEach((s) => c.getElementById(s.node).removeClass("off").addClass("on"));
    taken.forEach((i) => { if (i !== null) c.getElementById(`e${i}`).removeClass("off").addClass("on"); });
    c.getElementById(steps[at].node).addClass("now");
  }, [g, steps, at, theme]);

  return <div ref={host} className="solmap-graph" style={{ height }} />;
}

export default function SolutionMap({ source }: { source: string }) {
  const d = useData();
  const cfg = useMemo(() => { try { return YAML.parse(source) as MapConfig; } catch { return null; } }, [source]);
  const g = cfg ? d.methods.get(cfg.method) : undefined;
  const [at, setAt] = useState(0);

  if (!cfg || !g || !Array.isArray(cfg.steps) || cfg.steps.length === 0) {
    return <div className="solmap solmap-error">solution map: {cfg ? `unknown method “${cfg.method}” or no steps` : "the block is not valid YAML"}</div>;
  }
  const steps = cfg.steps;
  const node = new Map(g.nodes.map((n) => [n.id, n]));
  const last = steps.length - 1;

  return (
    <div className="solmap">
      <NeedsVerification verified={cfg.verified} />
      <div className="solmap-head">
        <span className="solmap-kind">Solution map</span> <span className="solmap-method">{g.title}</span>
      </div>
      <div className="solmap-task"><Markdown source={cfg.task} /></div>
      <div className="solmap-body">
        <div className="solmap-steps">
          <ol>
            {steps.slice(0, at + 1).map((s, i) => {
              const n = node.get(s.node);
              const ans = n?.kind === "decision" ? answerOf(s.answer) : null;
              return (
                <li key={i} className={i === at ? "now" : ""} onClick={() => setAt(i)}>
                  <div className={`solmap-node ${n?.kind ?? ""}`}>{n?.label ?? s.node}{ans && <span className="solmap-answer">{ans}</span>}</div>
                  <Markdown source={s.text} />
                </li>
              );
            })}
          </ol>
          <div className="solmap-controls">
            <button className="btn" disabled={at === 0} onClick={() => setAt(at - 1)}>◀ Back</button>
            <button className="btn" disabled={at === last} onClick={() => setAt(at + 1)}>Next ▶</button>
            <button className="btn btn-quiet" disabled={at === last} onClick={() => setAt(last)}>Show all</button>
            <button className="btn btn-quiet" disabled={at === 0} onClick={() => setAt(0)}>Reset</button>
            <span className="solmap-count">step {at + 1} of {steps.length}</span>
          </div>
        </div>
        <MethodView g={g} steps={steps} at={at} />
      </div>
      {cfg.note && <div className="sim-note">{cfg.note}</div>}
    </div>
  );
}
