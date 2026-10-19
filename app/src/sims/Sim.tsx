// Hosts the vanilla simulation engines (simulations.js / automata.js) inside React.
// Contract the engines expect: a container #sim-<id>, window.ctrlVal(simId, ctrlId) for
// slider values, window.Plotly, and window.runSim(id, cfg) as the entry point.
// Plotly is most of the weight and only the slider sims (not `custom`) plot, so it loads on demand (#40).
import { useEffect, useRef, useState } from "react";
import NeedsVerification from "../components/NeedsVerification";
import { loadFailedText } from "../components/LazyBlock";
import "./automata.css";
import "./java.css";
import "./ds.css";
import "./db.css";
import "./c.css";
import "./py.css";
import "./clj.css";
import "./erl.css";

declare global {
  interface Window {
    Plotly?: { purge: (e: HTMLElement) => void };
    ctrlVal: (simId: string, ctrlId: string) => number | null;
    runSim: (id: string, cfg?: unknown) => void;
    FA?: unknown;
    JAVA?: unknown;
    DS?: unknown;
    DB?: unknown;
    C?: unknown;
    PY?: unknown;
    CLJ?: unknown;
  }
}

const VALUES: Record<string, Record<string, number>> = {};
let plotly: Promise<void> | null = null;
/** Loads Plotly once and sets window.Plotly, which the engines in simulations.js call. */
function loadPlotly(): Promise<void> {
  plotly ??= import("plotly.js-dist-min").then((m) => { window.Plotly = m.default; })
    .catch((e) => { plotly = null; throw e; });
  return plotly;
}
window.ctrlVal = (simId, ctrlId) => VALUES[simId]?.[ctrlId] ?? null;
// side-effect imports: define window.runSim, window.FA, window.JAVA, window.DS, window.DB, window.C, window.PY and window.CLJ
import "./simulations.js";
import "./automata.js";
import "./java.js";
import "./ds.js";
import "./db.js";
import "./c.js";
import "./py.js";
import "./clj.js";
import "./erl.js";

export interface Control {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  decimals?: number;
}

export interface SimConfig {
  id: string;
  controls?: Control[];
  note?: string;
  custom?: boolean;
  engine?: string;
  mode?: string;
  /** Checks done by hand on this example (#93): "interface", "content". */
  verified?: string[];
  [k: string]: unknown;
}

export default function Sim({ cfg }: { cfg: SimConfig }) {
  const controls = cfg.controls ?? [];
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(controls.map((c) => [c.id, c.default])));
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(!!cfg.custom || !!window.Plotly);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (ready) return;
    let live = true;
    loadPlotly().then(() => { if (live) setReady(true); }, () => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [ready]);

  useEffect(() => {
    VALUES[cfg.id] = values;
    const el = host.current;
    if (!el || !ready) return;
    // engines look the container up by id; wait a tick so it is in the DOM
    const t = window.setTimeout(() => window.runSim(cfg.id, cfg), 0);
    return () => window.clearTimeout(t);
  }, [cfg, values, ready]);

  useEffect(() => {
    const el = host.current;
    return () => { if (el && !cfg.custom) window.Plotly?.purge(el); };
  }, [cfg.custom]);

  return (
    <div className="sim-box">
      <NeedsVerification verified={cfg.verified} />
      {controls.length > 0 && (
        <div className="sim-controls">
          {controls.map((c) => (
            <label key={c.id}>
              <span className="ctrl-label">
                <span>{c.label}</span>
                <span className="ctrl-val">{values[c.id].toFixed(c.decimals ?? 2)}</span>
              </span>
              <input
                type="range" min={c.min} max={c.max} step={c.step} value={values[c.id]}
                onChange={(e) => setValues((v) => ({ ...v, [c.id]: parseFloat(e.target.value) }))}
              />
            </label>
          ))}
          <button className="btn" onClick={() => setValues((v) => ({ ...v }))}>▶ Update</button>
        </div>
      )}
      <div ref={host} id={`sim-${cfg.id}`} className={`sim-plot${cfg.custom ? " sim-custom" : ""}`}>
        {!ready && <div className="sim-loading">{failed ? loadFailedText("plot") : "Loading the plot…"}</div>}
      </div>
      {cfg.note && <div className="sim-note">{cfg.note}</div>}
    </div>
  );
}
