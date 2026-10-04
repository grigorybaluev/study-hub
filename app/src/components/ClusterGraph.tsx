// Cytoscape view for DS map 2 (#173): concepts placed by a field layout, with semantic zoom.
//
// Zoom levels (LOD): 0 overview — only the domain titles are named, the concepts are coloured boxes;
// 1 regions — names appear from the most relevant down, as their text becomes readable
// (min-zoomed-font-size against a font that grows with the score), and the titles start to fade;
// 2 detail — every name, the titles faint. Edges are hidden until a concept is hovered or selected,
// or the "all edges" mode is on and the view is zoomed in; the edges of filtered concepts never show.
// Filters and search dim nodes in place, so the map never reshuffles. While zoomed out, domain links
// (one line per pair of domains with at least LINK_MIN dependencies between them, as wide as the
// square root of their number) stand in for the concept edges; they follow the filters.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import cytoscape, { type ElementDefinition, type StylesheetJson } from "cytoscape";
import { useTheme } from "./GraphView";
import { TITLE_FONT } from "./domains";

/** a pair of domains gets a link from this many dependencies between their visible concepts */
export const LINK_MIN = 5;

export type Lod = 0 | 1 | 2;
export const LOD_LABEL: Record<Lod, string> = { 0: "overview", 1: "regions", 2: "detail" };

export interface ClusterGraphHandle {
  zoomBy: (factor: number) => void;
  fit: () => void;
}

export interface ClusterGraphProps {
  elements: ElementDefinition[];
  /** localStorage key under which dragged concept positions are remembered */
  positionsKey: string;
  resetToken: number;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onOpen: (id: string) => void;
  onHover: (h: { id: string; x: number; y: number } | null) => void;
  onLod: (lod: Lod, zoom: number) => void;
  /** concepts hidden by the filters: drawn faintly, not interactive, and their edges hidden */
  filtered: Set<string>;
  /** concepts matching the search; when set, the rest are dimmed */
  matches: Set<string> | null;
  edgeMode: "focus" | "all";
  /** coverage overlay: dashed and dotted borders for what no unit teaches */
  mark: boolean;
  /** draw the domain links while zoomed out */
  links: boolean;
  onLinkHover: (h: { from: string; to: string; count: number; x: number; y: number } | null) => void;
  onLinkClick: (from: string, to: string) => void;
  /** pan to this concept and zoom in to read it; `n` changes on every request */
  focus: { id: string; n: number } | null;
  /** zoom thresholds between the levels, in model-to-screen scale */
  lodAt: [number, number];
  inset: { top: number; right: number; bottom: number; left: number };
}

type Saved = Record<string, { x: number; y: number }>;
const loadSaved = (key: string): Saved => { try { return JSON.parse(localStorage.getItem(key) ?? "{}"); } catch { return {}; } };
const storeSaved = (key: string, v: Saved) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage may be unavailable */ } };
export const clearSavedPositions = (key: string) => { try { localStorage.removeItem(key); } catch { /* ignore */ } };

function stylesheet(theme: "light" | "dark"): StylesheetJson {
  const dark = theme === "dark";
  const fg = dark ? "#e6e6e3" : "#1a1a2e";
  const muted = dark ? "#a3a8b1" : "#52514e";
  const bg = dark ? "#1a1d22" : "#ffffff";
  const accent = dark ? "#3ddc84" : "#007a3d";
  return [
    { selector: "node", style: { "z-index-compare": "manual" as never } },
    { selector: "node.concept", style: {
      shape: "round-rectangle", label: "data(label)", "font-size": "data(fs)", "text-wrap": "wrap", "text-max-width": "data(w)",
      "text-valign": "center", "text-halign": "center", "line-height": 1.2, color: fg, width: "data(w)", height: "data(h)",
      "background-color": "data(fill)", "border-width": 1.5, "border-color": "data(border)", "z-index": 10,
      "min-zoomed-font-size": 8,
    } },
    // coverage overlay: dashed = no unit teaches it, dotted = taught inside a topic it is part of
    { selector: "node.concept.cov[taught = 'none']", style: { "border-style": "dashed", "border-width": 2 } },
    { selector: "node.concept.cov[taught = 'parent']", style: { "border-style": "dotted", "border-width": 2.2 } },
    // overview: only the domain titles are named
    { selector: "node.concept.lod0", style: { "text-opacity": 0 } },
    // decorations
    { selector: "node.rowband", style: { shape: "rectangle", width: "data(w)", height: "data(h)", "background-color": "data(fill)", "border-width": 0, events: "no", label: "", "z-index": 0 } },
    { selector: "node.guide", style: { shape: "ellipse", width: "data(w)", height: "data(h)", "background-opacity": 0, "border-width": 1.5, "border-style": "dashed", "border-color": dark ? "#4a505a" : "#c3c2b7", events: "no", label: "", "z-index": 1 } },
    { selector: "node.band-label", style: {
      label: "data(label)", "font-size": "data(fs)", "font-weight": 700, color: muted, "text-transform": "uppercase" as never, "background-opacity": 0,
      "border-width": 0, width: "data(w)", height: "data(h)", events: "no", "z-index": 5, "text-valign": "center", "min-zoomed-font-size": 5,
    } },
    { selector: "node.band-label[align = 'left']", style: { "text-halign": "left", "text-margin-x": -8 } },
    { selector: "node.header", style: {
      label: "data(label)", "font-size": "data(fs)", "font-weight": 700, "font-family": TITLE_FONT, color: "data(color)",
      "text-transform": "uppercase" as never, "background-opacity": 0, "border-width": 0,
      width: "data(w)", height: "data(h)", events: "no", "z-index": 5, "min-zoomed-font-size": 5,
      "text-wrap": "wrap", "text-max-width": "data(w)", "text-valign": "top", "line-height": 1.1,
    } },
    // domain titles: the domain's colour, capitals, a strict face, with a halo where they cross concepts
    { selector: "node.region", style: {
      label: "data(label)", "font-size": "data(fs)", "font-weight": 700, "font-family": TITLE_FONT, color: "data(color)",
      "text-transform": "uppercase" as never, "background-opacity": 0, "border-width": 0,
      width: "data(w)", height: "data(h)", events: "no", "z-index": 40, "text-outline-color": bg, "text-outline-width": 4, "text-outline-opacity": 0.9,
    } },
    { selector: "node.region.lod1", style: { opacity: 0.6 } },
    { selector: "node.region.lod2", style: { opacity: 0.22 } },
    // the title of a domain (or family) whose concepts are all hidden fades with them
    { selector: "node.region.filtered, node.header.filtered", style: { opacity: 0.12 } },
    // interaction states
    { selector: "node.concept.filtered", style: { opacity: 0.07, events: "no", label: "" } },
    { selector: "node.concept.dim", style: { opacity: 0.2 } },
    { selector: "node.concept.match", style: { "border-width": 3.5, "border-color": accent, "z-index": 35 } },
    { selector: "node.concept.sel", style: { "border-width": 4, "border-color": fg, "z-index": 45 } },
    { selector: "node.concept.nbr", style: { "z-index": 32 } },
    { selector: "edge", style: {
      display: "none", width: 1.1, "line-color": fg, "target-arrow-color": fg, "target-arrow-shape": "triangle", "arrow-scale": 0.8,
      "curve-style": "bezier", opacity: 0.32, "z-index-compare": "manual" as never, "z-index": 8,
    } },
    { selector: "edge[kind = 'soft']", style: { "line-style": "dashed", opacity: 0.2 } },
    { selector: "edge[kind = 'part']", style: { "line-style": "dotted", width: 1.6 } },
    { selector: "edge[kind = 'gen']", style: { "line-style": "dashed", "line-color": "#8a63d2", "target-arrow-color": "#8a63d2" } },
    // every edge at once: straight lines without arrowheads, Cytoscape's fastest edges
    { selector: "edge.show", style: { display: "element", "curve-style": "haystack", "haystack-radius": 0, "target-arrow-shape": "none" } },
    { selector: "edge.hi", style: { display: "element", opacity: 0.95, width: 2.2, "z-index": 42, "curve-style": "bezier", "target-arrow-shape": "triangle" } },
    { selector: "edge.hi[kind = 'soft']", style: { opacity: 0.6 } },
    // domain links: invisible anchors at the clusters, a curved line per strong pair of domains
    { selector: "node.anchor", style: { width: 1, height: 1, "background-opacity": 0, "border-width": 0, label: "", events: "no", "z-index": 0 } },
    { selector: "edge.meta", style: {
      display: "element", width: "data(width)", "line-color": "data(color)", "target-arrow-color": "data(color)", "target-arrow-shape": "triangle",
      "arrow-scale": 1.15, opacity: 0.5, "curve-style": "unbundled-bezier", "control-point-distances": "data(cpd)" as never,
      "control-point-weights": 0.5 as never, "line-cap": "round" as never, "z-index": 20,
    } },
    { selector: "edge.meta.hover", style: { opacity: 0.92 } },
    { selector: "edge.meta.dim", style: { opacity: 0.1 } },
    // last, so they win over the rules above: zoomed in, below the threshold, switched off, or a hidden concept's edge
    { selector: "edge.meta.zoomed, edge.meta.weak, edge.meta.off", style: { display: "none" } },
    { selector: "edge.filtered", style: { display: "none" } },
  ];
}

const ClusterGraph = forwardRef<ClusterGraphHandle, ClusterGraphProps>(function ClusterGraph(props, ref) {
  const { elements, positionsKey, resetToken, selected, onSelect, onOpen, onHover, onLod, filtered, matches, edgeMode, mark, links, onLinkHover, onLinkClick, focus, lodAt, inset } = props;
  const host = useRef<HTMLDivElement>(null);
  const cy = useRef<cytoscape.Core | null>(null);
  const lod = useRef<Lod>(0);
  const hovered = useRef<string | null>(null);
  const theme = useTheme();
  // callbacks change identity on every render of the page; read them through a ref
  const cb = useRef({ onSelect, onOpen, onHover, onLod, onLinkHover, onLinkClick });
  cb.current = { onSelect, onOpen, onHover, onLod, onLinkHover, onLinkClick };
  const edgeModeRef = useRef(edgeMode);
  edgeModeRef.current = edgeMode;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // the whole map inside the part of the canvas the panels leave free
  const fitView = (c: cytoscape.Core) => {
    const bb = c.elements().boundingBox({});
    const W = c.width(), H = c.height();
    const zoom = Math.min((W - inset.left - inset.right) / bb.w, (H - inset.top - inset.bottom) / bb.h, 1.6);
    return { zoom, pan: { x: inset.left + (W - inset.left - inset.right - bb.w * zoom) / 2 - bb.x1 * zoom, y: inset.top + (H - inset.top - inset.bottom - bb.h * zoom) / 2 - bb.y1 * zoom } };
  };
  // the view survives a rebuild of the same layout (theme switch), and is fitted for a new one or a reset
  const view = useRef<{ key: string; reset: number; zoom: number; pan: { x: number; y: number } } | null>(null);

  useImperativeHandle(ref, () => ({
    zoomBy: (f) => {
      const c = cy.current;
      if (!c) return;
      c.animate({ zoom: { level: Math.max(c.minZoom(), Math.min(c.maxZoom(), c.zoom() * f)), renderedPosition: { x: c.width() / 2, y: c.height() / 2 } } }, { duration: 200 });
    },
    fit: () => { const c = cy.current; if (c) c.animate(fitView(c), { duration: 300 }); },
  }));

  // edges shown for the hovered and selected concepts, or all of them in "all" mode once zoomed in
  const refreshEdges = (c: cytoscape.Core) => {
    c.batch(() => {
      const plain = c.edges().not(".meta");
      plain.removeClass("show hi");
      if (edgeModeRef.current === "all" && lod.current >= 1) plain.addClass("show");
      for (const id of [selectedRef.current, hovered.current]) {
        if (!id) continue;
        const n = c.getElementById(id);
        if (!n.empty()) n.connectedEdges().addClass("hi");
      }
    });
  };

  useEffect(() => {
    if (!host.current) return;
    const c = cytoscape({ container: host.current, elements, style: stylesheet(theme), layout: { name: "preset", fit: false } as cytoscape.LayoutOptions,
      wheelSensitivity: 0.25, minZoom: 0.04, maxZoom: 3, boxSelectionEnabled: false, autoungrabify: false, hideEdgesOnViewport: true });
    const concepts = () => c.nodes(".concept");
    const saved = loadSaved(positionsKey);
    concepts().forEach((n) => { const p = saved[n.id()]; if (p) n.position(p); });
    c.on("dragfree", "node.concept", () => {
      const all: Saved = {};
      concepts().forEach((n) => { all[n.id()] = { ...n.position() }; });
      storeSaved(positionsKey, all);
    });
    const setLod = (force = false) => {
      const z = c.zoom();
      const next: Lod = z < lodAt[0] ? 0 : z < lodAt[1] ? 1 : 2;
      if (force || next !== lod.current) {
        lod.current = next;
        c.batch(() => {
          c.nodes().removeClass("lod0 lod1 lod2").addClass(`lod${next}`);
          c.edges(".meta").toggleClass("zoomed", next >= 1);
        });
        refreshEdges(c);
      }
      cb.current.onLod(next, z);
    };
    const keep = view.current && view.current.key === positionsKey && view.current.reset === resetToken ? view.current : null;
    c.viewport(keep ? { zoom: keep.zoom, pan: keep.pan } : fitView(c));
    view.current = { key: positionsKey, reset: resetToken, zoom: c.zoom(), pan: { ...c.pan() } };
    c.on("viewport", () => { if (view.current) { view.current.zoom = c.zoom(); view.current.pan = { ...c.pan() }; } });
    if (import.meta.env.DEV) (window as unknown as { __fieldmap: cytoscape.Core }).__fieldmap = c;   // for headless checks
    setLod(true);
    let raf = 0;
    c.on("zoom", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setLod()); });
    c.on("tap", "node.concept", (e) => cb.current.onSelect(e.target.id()));
    c.on("dbltap", "node.concept", (e) => cb.current.onOpen(e.target.id()));
    c.on("tap", (e) => { if (e.target === c) cb.current.onSelect(null); });
    c.on("mouseover", "node.concept", (e) => {
      hovered.current = e.target.id();
      const p = e.target.renderedPosition();
      cb.current.onHover({ id: e.target.id(), x: p.x, y: p.y - e.target.renderedHeight() / 2 });
      refreshEdges(c);
    });
    c.on("mouseout", "node.concept", () => { hovered.current = null; cb.current.onHover(null); refreshEdges(c); });
    c.on("mouseover", "edge.meta", (e) => {
      e.target.addClass("hover");
      const p = e.target.renderedMidpoint();
      cb.current.onLinkHover({ from: e.target.data("from"), to: e.target.data("to"), count: e.target.data("count"), x: p.x, y: p.y });
    });
    c.on("mouseout", "edge.meta", (e) => { e.target.removeClass("hover"); cb.current.onLinkHover(null); });
    c.on("tap", "edge.meta", (e) => cb.current.onLinkClick(e.target.data("from"), e.target.data("to")));
    c.on("pan zoom", () => cb.current.onLinkHover(null));
    c.on("pan zoom drag", () => { if (hovered.current) { hovered.current = null; cb.current.onHover(null); } });
    cy.current = c;
    return () => { cancelAnimationFrame(raf); c.destroy(); cy.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, theme, positionsKey, resetToken]);

  // filters, search, selection and the overlay only change classes
  useEffect(() => {
    const c = cy.current;
    if (!c) return;
    c.batch(() => {
      const all = c.nodes(".concept");
      if (mark) all.addClass("cov"); else all.removeClass("cov");
      all.removeClass("filtered dim match sel nbr");
      all.filter((n) => filtered.has(n.id())).addClass("filtered");
      // hiding a domain or a tier hides the edges of its concepts too
      c.edges().removeClass("filtered");
      c.edges().filter((e) => filtered.has(e.source().id()) || filtered.has(e.target().id())).addClass("filtered");
      if (matches) {
        all.filter((n) => !matches.has(n.id())).addClass("dim");
        all.filter((n) => matches.has(n.id())).addClass("match");
      } else if (selected) {
        const n = c.getElementById(selected);
        if (!n.empty()) {
          const hood = n.closedNeighborhood().nodes(".concept").not(".filtered");
          all.not(hood).addClass("dim");
          hood.addClass("nbr");
          n.addClass("sel");
        }
      }
      // titles fade when every concept of their domain (or family) is hidden
      const shown = new Set<string>();
      all.not(".filtered").forEach((n) => { shown.add(`d:${n.data("domain")}`); shown.add(`f:${n.data("family")}`); });
      c.nodes(".region, .header").forEach((t) => {
        const key = t.data("domain") ? `d:${t.data("domain")}` : t.data("family") ? `f:${t.data("family")}` : null;
        t.toggleClass("filtered", key !== null && !shown.has(key));
      });
      // domain links count the dependencies between visible concepts only
      const metas = c.edges(".meta");
      if (metas.nonempty()) {
        const counts = new Map<string, number>();
        c.edges().not(".meta").forEach((e) => {
          if (e.data("kind") === "soft") return;
          const a = e.source(), b = e.target();
          if (a.hasClass("filtered") || b.hasClass("filtered")) return;
          const da = a.data("domain"), db = b.data("domain");
          if (!da || !db || da === db) return;
          const k = `${da}>${db}`;
          counts.set(k, (counts.get(k) ?? 0) + 1);
        });
        metas.forEach((m) => {
          const n = counts.get(`${m.data("from")}>${m.data("to")}`) ?? 0;
          m.data({ count: n, width: m.data("scale") * (0.5 + Math.sqrt(n)) });
          m.toggleClass("weak", n < LINK_MIN);
        });
        metas.toggleClass("off", !links);
        metas.toggleClass("dim", !!matches || !!selected);
      }
    });
    refreshEdges(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, matches, selected, edgeMode, mark, links, elements, theme, resetToken]);

  useEffect(() => {
    const c = cy.current;
    if (!c || !focus) return;
    const n = c.getElementById(focus.id);
    if (n.empty()) return;
    c.animate({ center: { eles: n }, zoom: Math.max(c.zoom(), lodAt[1] * 1.15) }, { duration: 400 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  return <div ref={host} className="fieldmap-canvas" />;
});

export default ClusterGraph;
