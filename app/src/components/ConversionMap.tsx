// A conversion map (#257): representations of one class of objects and the methods between them, drawn
// on the canvas the content authored (content/maps/<id>.yaml) and scaled to the width. Tap an arrow for
// its method; "I have / I need" lights up the cheapest route; a worked example walks the map. Below
// 700 px the canvas would be unreadable, so the map becomes a list of representations and their arrows.
import { lazy, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import YAML from "yaml";
import Markdown from "./Markdown";
import LazyBlock from "./LazyBlock";
import { href } from "../data/load";
import type { ConversionMap, MapEdge, MapNode } from "../data/types";
import { cheapest, hopsOf, type Hop } from "./mapRoutes.ts";

const Automaton = lazy(() => import("./Automaton"));

const COST_LABEL: Record<MapEdge["cost"], string> = {
  free: "free", same: "same size", shrinks: "shrinks", linear: "grows linearly", design: "needs thought", explodes: "can explode",
};
const KIND_LABEL: Record<MapEdge["kind"], string> = {
  algorithm: "algorithm: mechanical and exact; show the table or the steps",
  reversal: "reversal route: works on the reversed language",
  design: "design: no algorithm; say what each state or block means",
  free: "free: the object already is one of those",
  condition: "condition: valid only when its condition holds",
};
const KINDS = ["algorithm", "reversal", "design", "condition", "free"] as const;
const costLabel = (map: ConversionMap, c: MapEdge["cost"]) => map.legend.costs[c] ?? COST_LABEL[c];


function useWidth(ref: React.RefObject<HTMLElement>): number {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/** A straight line between the borders of two boxes, for an edge without an authored path. */
function straight(a: MapNode, b: MapNode): string {
  const c = (n: MapNode) => [n.box[0] + n.box[2] / 2, n.box[1] + n.box[3] / 2];
  const [ax, ay] = c(a), [bx, by] = c(b);
  const clip = (n: MapNode, x: number, y: number, dx: number, dy: number) => {
    const t = Math.min(Math.abs((n.box[2] / 2) / (dx || 1e-9)), Math.abs((n.box[3] / 2) / (dy || 1e-9)));
    return [x + dx * t, y + dy * t];
  };
  const [sx, sy] = clip(a, ax, ay, bx - ax, by - ay), [ex, ey] = clip(b, bx, by, ax - bx, ay - by);
  return `M${sx} ${sy} L${ex} ${ey}`;
}

const inline = (s: string) => <span className="cmap-md"><Markdown source={s} /></span>;

export default function ConversionMapView({ map }: { map: ConversionMap }) {
  const wrap = useRef<HTMLDivElement>(null);
  const width = useWidth(wrap);
  const byId = useMemo(() => new Map(map.nodes.map((n) => [n.id, n])), [map]);
  const [edge, setEdge] = useState<string | null>(null);          // the arrow whose card is open
  const [node, setNode] = useState<string | null>(null);          // the representation whose card is open
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [task, setTask] = useState<number | null>(null);
  const [step, setStep] = useState<number | null>(null);          // the worked example's step, when walking

  const route: Hop[] | null = task !== null ? hopsOf(map, map.routes[task].path)
    : from && to ? cheapest(map, from, to) : null;
  const walk = map.example && step !== null ? map.example.walk[step] : null;
  const lit = new Set<string>(route ? route.map((h) => h.edge.id) : walk?.edge ? [walk.edge] : edge ? [edge] : []);
  const litNodes = new Set<string>(route ? route.flatMap((h) => [h.from, h.to]) : walk?.node ? [walk.node]
    : walk?.edge ? [map.edges.find((e) => e.id === walk.edge)!.from, map.edges.find((e) => e.id === walk.edge)!.to] : node ? [node] : []);
  const focus = lit.size > 0 || litNodes.size > 0;
  const openEdge = map.edges.find((e) => e.id === edge) ?? null;
  const openNode = node ? byId.get(node) ?? null : null;
  const pick = (k: "edge" | "node", id: string) => {
    setTask(null); setFrom(""); setTo(""); setStep(null);
    if (k === "edge") { setEdge(edge === id ? null : id); setNode(null); } else { setNode(node === id ? null : id); setEdge(null); }
  };
  const [W, H] = map.canvas;
  const k = width ? Math.min(1.2, width / W) : 0;   // a little larger than authored when there is room
  const wide = width >= 700;

  return (
    <div className="cmap" ref={wrap}>
      <RouteFinder map={map} from={from} to={to} task={task} route={route}
        onFrom={(v) => { setFrom(v); setTask(null); setEdge(null); setNode(null); setStep(null); }}
        onTo={(v) => { setTo(v); setTask(null); setEdge(null); setNode(null); setStep(null); }}
        onTask={(i) => { setTask(task === i ? null : i); setFrom(""); setTo(""); setEdge(null); setNode(null); setStep(null); }}
        onEdge={(id) => pick("edge", id)} />

      {wide && k > 0 && (
        <div className="cmap-stage" style={{ height: H * k }}>
          <div className={`cmap-canvas${focus ? " focus" : ""}`} style={{ width: W, height: H, transform: `scale(${k})` }}>
            <svg className="cmap-edges" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
              <defs>
                {KINDS.map((kind) => (
                  <marker key={kind} id={`cm-${map.id}-${kind}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M0 0 L10 5 L0 10 z" className={`cmap-head ${kind}`} />
                  </marker>
                ))}
              </defs>
              {map.edges.map((e) => {
                const d = e.path ?? straight(byId.get(e.from)!, byId.get(e.to)!);
                const mk = `url(#cm-${map.id}-${e.kind})`;
                return (
                  <g key={e.id} className={`cmap-edge ${e.kind}${lit.has(e.id) ? " lit" : ""}`} onClick={() => pick("edge", e.id)}>
                    <path d={d} className="hit" />
                    <path d={d} className="line" markerEnd={mk} markerStart={e.both ? mk : undefined} />
                  </g>
                );
              })}
            </svg>
            {map.nodes.map((n) => (
              <button key={n.id} className={`cmap-node tone-${n.tone}${n.aux ? " aux" : ""}${litNodes.has(n.id) ? " lit" : ""}`}
                style={{ left: n.box[0], top: n.box[1], width: n.box[2], height: n.box[3] }} onClick={() => pick("node", n.id)}>
                <span className="cmap-node-label">{n.label}</span>
                {n.sub && <span className="cmap-node-sub">{n.sub}</span>}
                {n.text && <span className="cmap-node-text">{inline(n.text)}</span>}
                {n.easy && <span className="cmap-node-easy"><b>Easy here:</b> {inline(n.easy)}</span>}
              </button>
            ))}
            {map.edges.map((e) => {
              const [x, y, w, align = "left"] = e.label ?? [0, 0, 0];
              if (!e.label) return null;
              return (
                <button key={e.id} className={`cmap-label ${e.kind}${lit.has(e.id) ? " lit" : ""}`} style={{ left: x, top: y, width: w, textAlign: align }}
                  onClick={() => pick("edge", e.id)}>
                  <span className={`cmap-badge ${e.kind}`}>{e.n}</span><span className="cmap-label-name">{e.name}</span>
                  {e.short && <span className="cmap-label-short">{inline(e.short)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {wide && (
        <div className="cmap-legend">
          {KINDS.filter((kind) => map.edges.some((e) => e.kind === kind)).map((kind) => (
            <span key={kind}><svg width="30" height="8"><path d="M1 4 H27" className={`cmap-legend-line ${kind}`} /></svg>{map.legend.kinds[kind] ?? KIND_LABEL[kind]}</span>
          ))}
        </div>
      )}

      {/* the open card stays in view at the bottom of the screen while the map scrolls under it */}
      {!wide && width > 0 && <MapList map={map} open={edge} onEdge={(id) => setEdge(edge === id ? null : id)} />}
      {(openEdge || (wide && openNode)) && (
        <div className="cmap-dock">
          {openEdge && <EdgeCard map={map} e={openEdge} onClose={() => setEdge(null)} />}
          {wide && openNode && <NodeCard map={map} n={openNode} onEdge={(id) => pick("edge", id)} onClose={() => setNode(null)} />}
        </div>
      )}

      {map.example && <Walk map={map} step={step} onStep={(s) => { setStep(s); setTask(null); setFrom(""); setTo(""); setEdge(null); setNode(null); }} />}
    </div>
  );
}

function RouteFinder({ map, from, to, task, route, onFrom, onTo, onTask, onEdge }: {
  map: ConversionMap; from: string; to: string; task: number | null; route: Hop[] | null;
  onFrom(v: string): void; onTo(v: string): void; onTask(i: number): void; onEdge(id: string): void;
}) {
  const label = (id: string) => map.nodes.find((n) => n.id === id)?.label ?? id;
  return (
    <div className="cmap-finder">
      <div className="cmap-finder-row">
        <label>I have <select value={from} onChange={(e) => onFrom(e.target.value)}>
          <option value="">…</option>{map.nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select></label>
        <label>I need <select value={to} onChange={(e) => onTo(e.target.value)}>
          <option value="">…</option>{map.nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select></label>
      </div>
      {map.routes.length > 0 && (
        <div className="cmap-tasks">
          <span className="small muted">Or a question:</span>
          <select className="cmap-task-select" value={task ?? ""} onChange={(e) => e.target.value !== "" && onTask(Number(e.target.value))}>
            <option value="">…</option>{map.routes.map((r, i) => <option key={i} value={i}>{r.task}</option>)}
          </select>
          {map.routes.map((r, i) => (
            <button key={i} className={`cmap-task${task === i ? " on" : ""}`} onClick={() => onTask(i)}>{r.task}</button>
          ))}
        </div>
      )}
      {from && to && route === null && <p className="small muted">No route from {label(from)} to {label(to)} on this map.</p>}
      {route && route.length > 0 && (
        <div className="cmap-route">
          <ol>
            {route.map((h) => (
              <li key={h.edge.id + h.from}>
                <button onClick={() => onEdge(h.edge.id)}><span className={`cmap-badge ${h.edge.kind}`}>{h.edge.n}</span> <b>{h.edge.name}</b></button>
                <span className="small muted"> {label(h.from)} → {label(h.to)} · {costLabel(map, h.edge.cost)}</span>
              </li>
            ))}
          </ol>
          {task !== null && map.routes[task].why && <div className="small cmap-why">{inline(map.routes[task].why!)}</div>}
        </div>
      )}
    </div>
  );
}

function EdgeCard({ map, e, onClose }: { map: ConversionMap; e: MapEdge; onClose?(): void }) {
  const label = (id: string) => map.nodes.find((n) => n.id === id)?.label ?? id;
  return (
    <div className={`cmap-card ${e.kind}`}>
      <div className="cmap-card-head">
        <span className={`cmap-badge ${e.kind}`}>{e.n}</span>
        <b>{e.name}</b>
        <span className="small muted">{label(e.from)} {e.both ? "↔" : "→"} {label(e.to)} · {costLabel(map, e.cost)}</span>
        {onClose && <button className="cmap-close" onClick={onClose} aria-label="Close">✕</button>}
      </div>
      <dl>
        <dt>How</dt><dd><Markdown source={e.steps} /></dd>
        {e.size && <><dt>Size</dt><dd><Markdown source={e.size} /></dd></>}
        <dt>Use it when</dt><dd><Markdown source={e.when} /></dd>
        {e.trap && <><dt>Trap</dt><dd><Markdown source={e.trap} /></dd></>}
      </dl>
    </div>
  );
}

function NodeCard({ map, n, onEdge, onClose }: { map: ConversionMap; n: MapNode; onEdge(id: string): void; onClose(): void }) {
  const out = map.edges.filter((e) => e.from === n.id || (e.both && e.to === n.id));
  const inc = map.edges.filter((e) => e.to === n.id || (e.both && e.from === n.id));
  const other = (e: MapEdge, end: "from" | "to") => map.nodes.find((x) => x.id === e[end])?.label;
  return (
    <div className={`cmap-card node tone-${n.tone}`}>
      <div className="cmap-card-head">
        <b>{n.label}</b>{n.sub && <span className="small muted">{n.sub}</span>}
        {n.concept && <Link className="small" to={href.concept(n.concept)}>concept →</Link>}
        <button className="cmap-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      {n.text && <Markdown source={n.text} />}
      {n.easy && <p><b>Easy here:</b> {inline(n.easy)}</p>}
      <div className="cmap-card-cols">
        {out.length > 0 && <div><h5>From here</h5><ul>{out.map((e) => <li key={e.id}><button onClick={() => onEdge(e.id)}><span className={`cmap-badge ${e.kind}`}>{e.n}</span> {e.name}</button> <span className="small muted">→ {other(e, e.from === n.id ? "to" : "from")}</span></li>)}</ul></div>}
        {inc.length > 0 && <div><h5>Into it</h5><ul>{inc.map((e) => <li key={e.id}><button onClick={() => onEdge(e.id)}><span className={`cmap-badge ${e.kind}`}>{e.n}</span> {e.name}</button> <span className="small muted">from {other(e, e.to === n.id ? "from" : "to")}</span></li>)}</ul></div>}
      </div>
    </div>
  );
}

/** The phone view: each representation opens to the arrows that leave it. */
function MapList({ map, open, onEdge }: { map: ConversionMap; open: string | null; onEdge(id: string): void }) {
  return (
    <div className="cmap-list">
      {map.nodes.map((n) => {
        const out = map.edges.filter((e) => e.from === n.id || (e.both && e.to === n.id));
        return (
          <details key={n.id} className={`cmap-list-node tone-${n.tone}`}>
            <summary><b>{n.label}</b>{n.sub && <span className="small muted"> · {n.sub}</span>}<span className="small muted cmap-count">{out.length} arrow{out.length === 1 ? "" : "s"}</span></summary>
            {n.text && <Markdown source={n.text} />}
            {n.easy && <p><b>Easy here:</b> {inline(n.easy)}</p>}
            <ul>
              {out.map((e) => (
                <li key={e.id}>
                  <button className={open === e.id ? "on" : ""} onClick={() => onEdge(e.id)}>
                    <span className={`cmap-badge ${e.kind}`}>{e.n}</span> {e.name} <span className="small muted">→ {map.nodes.find((x) => x.id === (e.from === n.id ? e.to : e.from))?.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

/** The worked example: one language taken along the map, a step at a time. */
function Walk({ map, step, onStep }: { map: ConversionMap; step: number | null; onStep(s: number | null): void }) {
  const ex = map.example!;
  const n = ex.walk.length;
  const st = step !== null ? ex.walk[step] : null;
  const where = st?.edge ? map.edges.find((e) => e.id === st.edge) : null;
  const at = st?.node ? map.nodes.find((x) => x.id === st.node) : null;
  return (
    <section className={`cmap-walk${st ? " walking" : ""}`}>
      <div className="cmap-walk-head">
        <h3>{ex.title}</h3>
        {ex.language && <span>{inline(ex.language)}</span>}
      </div>
      {st === null ? (
        <button className="cmap-walk-start" onClick={() => onStep(0)}>Walk through it, {n} steps →</button>
      ) : (
        <>
          <div className="cmap-walk-nav">
            <button onClick={() => onStep(step! > 0 ? step! - 1 : null)}>← {step! > 0 ? "Back" : "Close"}</button>
            <span className="small muted">step {step! + 1} of {n}</span>
            {step! < n - 1 ? <button onClick={() => onStep(step! + 1)}>Next →</button> : <button onClick={() => onStep(null)}>Done</button>}
          </div>
          <div className={`cmap-walk-body${st.automaton ? " with-diagram" : ""}`}>
            <div>
              <div className="cmap-walk-where">
                {where && <><span className={`cmap-badge ${where.kind}`}>{where.n}</span> <b>{where.name}</b></>}
                {at && <b>{at.label}</b>}
              </div>
              <Markdown source={st.text} />
            </div>
            {st.automaton && (
              <LazyBlock fallback={<div className="automaton" />}>
                <Automaton source={YAML.stringify(st.automaton)} />
              </LazyBlock>
            )}
          </div>
        </>
      )}
    </section>
  );
}
