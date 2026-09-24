// A static automaton diagram (#111): the simulator's drawing without its controls. Loaded lazily,
// and it pulls in only the automata engine, not the Plotly-based Sim bundle.
import { useMemo } from "react";
import YAML from "yaml";
import "../sims/automata.js";
import "../sims/automata.css";

type FAEngine = { fromSpec: (spec: unknown) => unknown; drawMachine: (m: unknown, hl?: unknown) => string };

export default function Automaton({ source }: { source: string }) {
  const html = useMemo(() => {
    try {
      const FA = (window as unknown as { FA: FAEngine }).FA;
      return FA.drawMachine(FA.fromSpec(YAML.parse(source)), {});
    } catch (e) {
      return `<div class="fa-error">automaton diagram: ${String((e as Error).message).replace(/</g, "&lt;")}</div>`;
    }
  }, [source]);
  return <div className="automaton" dangerouslySetInnerHTML={{ __html: html }} />;
}
