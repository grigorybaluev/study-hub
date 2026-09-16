// Hosts the vanilla simulation engines (simulations.js / automata.js) inside React.
// Contract the engines expect: a container #sim-<id>, window.ctrlVal(simId, ctrlId) for
// slider values, window.Plotly, and window.runSim(id, cfg) as the entry point.
import { useEffect, useRef, useState } from "react";
import Plotly from "plotly.js-dist-min";
import "./automata.css";
import "./java.css";

declare global {
  interface Window {
    Plotly: unknown;
    ctrlVal: (simId: string, ctrlId: string) => number | null;
    runSim: (id: string, cfg?: unknown) => void;
    FA?: unknown;
    JAVA?: unknown;
  }
}

const VALUES: Record<string, Record<string, number>> = {};
window.Plotly = Plotly;
window.ctrlVal = (simId, ctrlId) => VALUES[simId]?.[ctrlId] ?? null;
// side-effect imports: define window.runSim, window.FA and window.JAVA
import "./simulations.js";
import "./automata.js";
import "./java.js";

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
  [k: string]: unknown;
}

export default function Sim({ cfg }: { cfg: SimConfig }) {
  const controls = cfg.controls ?? [];
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(controls.map((c) => [c.id, c.default])));
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    VALUES[cfg.id] = values;
    const el = host.current;
    if (!el) return;
    // engines look the container up by id; wait a tick so it is in the DOM
    const t = window.setTimeout(() => window.runSim(cfg.id, cfg), 0);
    return () => window.clearTimeout(t);
  }, [cfg, values]);

  useEffect(() => {
    const el = host.current;
    return () => { if (el && !cfg.custom) (Plotly as { purge: (e: HTMLElement) => void }).purge(el); };
  }, [cfg.custom]);

  return (
    <div className="sim-box">
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
      <div ref={host} id={`sim-${cfg.id}`} className={`sim-plot${cfg.custom ? " sim-custom" : ""}`} />
      {cfg.note && <div className="sim-note">{cfg.note}</div>}
    </div>
  );
}
