// Thin Cytoscape wrapper: elements + layout in, node clicks out. Nodes are text-sized boxes
// (data: label, w, h, fill, border); colours follow the page theme.
import { useEffect, useRef, useState } from "react";
import cytoscape, { type ElementDefinition, type LayoutOptions, type StylesheetJson } from "cytoscape";
import dagre from "cytoscape-dagre";
import fcose from "cytoscape-fcose";

cytoscape.use(dagre);
cytoscape.use(fcose);

/** Current explicit theme; re-renders when the toggle flips data-theme. */
export function useTheme(): "light" | "dark" {
  const read = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  const [theme, setTheme] = useState<"light" | "dark">(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

const FONT = 12;
const LINE = 15;
const PAD_X = 12;
const PAD_Y = 8;
const CHAR_W = 6.6;

/** Wrap a title to ~maxChars per line and return the label plus a box size that fits it. */
export function boxLabel(header: string, title: string, maxChars = 24): { label: string; w: number; h: number } {
  const lines: string[] = [];
  let cur = "";
  for (const word of title.split(/\s+/)) {
    if (cur && (cur + " " + word).length > maxChars) { lines.push(cur); cur = word; }
    else cur = cur ? cur + " " + word : word;
  }
  if (cur) lines.push(cur);
  const all = header ? [header, ...lines] : lines;
  const w = Math.max(...all.map((l) => l.length)) * CHAR_W + PAD_X * 2;
  const h = all.length * LINE + PAD_Y * 2;
  return { label: all.join("\n"), w: Math.max(w, 60), h };
}

/** Opaque tint of `hex` over the theme background, so edges never show through node text. */
export function tint(hex: string, theme: "light" | "dark"): string {
  const bg = theme === "dark" ? [0x1a, 0x1d, 0x22] : [0xff, 0xff, 0xff];
  const a = theme === "dark" ? 0.38 : 0.2;
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return "#" + c.map((v, i) => Math.round(v * a + bg[i] * (1 - a)).toString(16).padStart(2, "0")).join("");
}

function stylesheet(theme: "light" | "dark"): StylesheetJson {
  const fg = theme === "dark" ? "#e6e6e3" : "#1a1a2e";
  return [
    { selector: "node", style: {
      shape: "round-rectangle", label: "data(label)", "font-size": FONT, "text-wrap": "wrap",
      "text-max-width": "data(w)", "text-valign": "center", "text-halign": "center", "line-height": 1.25,
      color: fg, width: "data(w)", height: "data(h)",
      "background-color": "data(fill)", "border-width": 1.5, "border-color": "data(border)",
    } },
    { selector: "node.header", style: {
      "background-opacity": 0, "border-width": 0, "font-size": 12, "font-weight": "bold", color: fg,
      "text-valign": "center", events: "no",
    } },
    { selector: "node[?dim]", style: { opacity: 0.5 } },
    { selector: "node.dim", style: { opacity: 0.18 } },
    { selector: "node.hi", style: { "border-width": 3 } },
    { selector: "edge", style: {
      width: "data(width)", "line-color": fg, "target-arrow-color": fg, "line-opacity": "data(alpha)" as never,
      "target-arrow-shape": "triangle", "arrow-scale": 0.7, "curve-style": "bezier", "control-point-step-size": 30,
    } },
    { selector: "edge[?dashed]", style: { "line-style": "dashed" } },
    { selector: "edge[?tinted]", style: { "line-color": "data(color)", "target-arrow-color": "data(color)" } },
    { selector: "edge.dim", style: { "line-opacity": 0.05 as never } },
    { selector: "edge.hi", style: { "line-opacity": 1 as never, width: 2.2 } },
  ];
}

export interface GraphViewProps {
  /** elements are built for a theme (opaque tints); rebuild them when it changes */
  elements: ElementDefinition[];
  layout: LayoutOptions;
  onSelect?: (id: string | null) => void;
  onOpen?: (id: string) => void;
  highlight?: string | null;
}

export default function GraphView({ elements, layout, onSelect, onOpen, highlight }: GraphViewProps) {
  const host = useRef<HTMLDivElement>(null);
  const cy = useRef<cytoscape.Core | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!host.current) return;
    const c = cytoscape({ container: host.current, elements, style: stylesheet(theme), layout, wheelSensitivity: 0.2 });
    c.on("tap", "node", (e) => onSelect?.(e.target.id()));
    c.on("dbltap", "node", (e) => onOpen?.(e.target.id()));
    c.on("tap", (e) => { if (e.target === c) onSelect?.(null); });
    cy.current = c;
    return () => { c.destroy(); cy.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, layout, theme]);

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
    n.connectedEdges().addClass("hi");
  }, [highlight, elements]);

  return <div ref={host} style={{ width: "100%", height: "72vh", border: "1.5px solid var(--line)", borderRadius: "var(--radius)", background: "var(--bg-elev)" }} />;
}
