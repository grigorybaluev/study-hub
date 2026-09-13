// Thin Cytoscape wrapper: elements + layout in, node clicks out. Re-layouts when elements change.
import { useEffect, useRef } from "react";
import cytoscape, { type ElementDefinition, type LayoutOptions, type StylesheetJson } from "cytoscape";
import dagre from "cytoscape-dagre";
import fcose from "cytoscape-fcose";

cytoscape.use(dagre);
cytoscape.use(fcose);

const STYLE: StylesheetJson = [
  { selector: "node", style: {
    label: "data(label)", "font-size": 12, "text-wrap": "wrap", "text-max-width": "120px",
    "text-valign": "center", "text-halign": "center", color: "#111", "background-color": "data(color)",
    width: "data(size)", height: "data(size)", "border-width": 1, "border-color": "#00000033",
  } },
  { selector: "node[shape]", style: { shape: "data(shape)" as never } },
  { selector: "node.dim", style: { opacity: 0.25 } },
  { selector: "node.hi", style: { "border-width": 3, "border-color": "#2f5fd6" } },
  { selector: "edge", style: {
    width: "data(width)", "line-color": "data(color)", "target-arrow-color": "data(color)",
    "target-arrow-shape": "triangle", "curve-style": "bezier", "arrow-scale": 0.8, opacity: 0.8,
  } },
  { selector: "edge[dashed]", style: { "line-style": "dashed" } },
  { selector: "edge.dim", style: { opacity: 0.08 } },
];

export interface GraphViewProps {
  elements: ElementDefinition[];
  layout: LayoutOptions;
  onSelect?: (id: string | null) => void;
  onOpen?: (id: string) => void;
  highlight?: string | null;
}

export default function GraphView({ elements, layout, onSelect, onOpen, highlight }: GraphViewProps) {
  const host = useRef<HTMLDivElement>(null);
  const cy = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!host.current) return;
    const c = cytoscape({ container: host.current, elements, style: STYLE, layout, wheelSensitivity: 0.2 });
    c.on("tap", "node", (e) => onSelect?.(e.target.id()));
    c.on("dbltap", "node", (e) => onOpen?.(e.target.id()));
    c.on("tap", (e) => { if (e.target === c) onSelect?.(null); });
    cy.current = c;
    return () => { c.destroy(); cy.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, layout]);

  useEffect(() => {
    const c = cy.current;
    if (!c) return;
    c.elements().removeClass("dim hi");
    if (!highlight) return;
    const n = c.getElementById(highlight);
    if (n.empty()) return;
    const hood = n.closedNeighborhood();
    c.elements().not(hood).addClass("dim");
    n.addClass("hi");
  }, [highlight, elements]);

  return <div ref={host} style={{ width: "100%", height: "70vh", border: "1px solid var(--line)", borderRadius: "var(--radius)", background: "var(--bg-elev)" }} />;
}
