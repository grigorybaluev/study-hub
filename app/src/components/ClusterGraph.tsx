// Cytoscape view for DS map 2 (#173): concepts placed by a field layout, with semantic zoom.
//
// Zoom levels (LOD): 0 overview — region labels and the landmark concepts' names in pills;
// 1 regions — names appear from the most relevant down, as their text becomes readable
// (min-zoomed-font-size against a font that grows with the score); 2 detail — every name, region
// labels fade. Edges are hidden until a concept is hovered or selected, or the "all edges" mode is
// on and the view is zoomed in. Filters and search dim nodes in place, so the map never reshuffles.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import cytoscape, { type ElementDefinition, type StylesheetJson } from "cytoscape";
import { useTheme } from "./GraphView";

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
  /** the order in which concepts are named while zoomed out (most important first) */
  pinOrder: string[];
  /** concepts hidden by the filters: drawn faintly and not interactive */
  filtered: Set<string>;
  /** concepts matching the search; when set, the rest are dimmed */
  matches: Set<string> | null;
  edgeMode: "focus" | "all";
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
    // overview: names are carried by the landmark pills; in-box names come back from the regions level on
    { selector: "node.concept.lod0", style: { "text-opacity": 0 } },
    { selector: "node.pin", style: {
      shape: "round-rectangle", width: "data(w)", height: "data(h)", "background-color": bg, "background-opacity": 0.94,
      "border-width": 2, "border-color": "data(border)", label: "data(label)", "font-size": "data(fs)", "font-weight": 600, color: fg,
      "text-valign": "center", "text-halign": "center", "min-zoomed-font-size": 0, "z-index": 30,
    } },
    { selector: "node.pin.lod1, node.pin.lod2, node.pin.filtered", style: { display: "none" } },
    { selector: "node.pin.selpin.lod1", style: { display: "element" } },
    { selector: "node.pin.selpin", style: { "border-width": 3, "z-index": 50 } },
    { selector: "node.pin.dim", style: { opacity: 0.25 } },
    // decorations
    { selector: "node.band", style: { shape: "ellipse", width: "data(w)", height: "data(h)", "background-color": "data(fill)", "border-width": 1, "border-color": "data(border)", events: "no", label: "", "z-index": 0 } },
    { selector: "node.rowband", style: { shape: "rectangle", width: "data(w)", height: "data(h)", "background-color": "data(fill)", "border-width": 0, events: "no", label: "", "z-index": 0 } },
    { selector: "node.island", style: { shape: "ellipse", width: "data(w)", height: "data(h)", "background-color": "data(fill)", "border-width": 2, "border-color": "data(border)", events: "no", label: "", "z-index": 0 } },
    { selector: "node.guide", style: { shape: "ellipse", width: "data(w)", height: "data(h)", "background-opacity": 0, "border-width": 1.5, "border-style": "dashed", "border-color": dark ? "#4a505a" : "#c3c2b7", events: "no", label: "", "z-index": 1 } },
    { selector: "node.band-label", style: {
      label: "data(label)", "font-size": "data(fs)", "font-weight": 700, color: muted, "text-transform": "uppercase" as never, "background-opacity": 0,
      "border-width": 0, width: "data(w)", height: "data(h)", events: "no", "z-index": 5, "text-valign": "center", "min-zoomed-font-size": 5,
    } },
    { selector: "node.band-label[align = 'left']", style: { "text-halign": "left", "text-margin-x": -8 } },
    { selector: "node.header", style: {
      label: "data(label)", "font-size": "data(fs)", "font-weight": 700, color: fg, "background-opacity": 0, "border-width": 0,
      width: "data(w)", height: "data(h)", events: "no", "z-index": 5, "min-zoomed-font-size": 5,
      "text-wrap": "wrap", "text-max-width": "data(w)", "text-valign": "top", "line-height": 1.1,
    } },
    { selector: "node.region", style: {
      label: "data(label)", "font-size": "data(fs)", "font-weight": 800, color: muted, "background-opacity": 0, "border-width": 0,
      width: "data(w)", height: "data(h)", events: "no", "z-index": 40, "text-outline-color": bg, "text-outline-width": 5, "text-outline-opacity": 0.9,
    } },
    { selector: "node.region.lod2", style: { opacity: 0.25 } },
    // network clusters: compound nodes drawn around each domain's concepts
    { selector: "node.cluster", style: {
      shape: "round-rectangle", "background-color": "data(fill)", "background-opacity": 0.55, "border-width": 2, "border-color": "data(border)",
      label: "data(label)", "font-size": "data(fs)", "font-weight": 800, color: muted, "text-valign": "top", "text-halign": "center",
      "text-margin-y": -8, padding: "28px", events: "no", "z-index": 2, "text-outline-color": bg, "text-outline-width": 4,
    } },
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
    { selector: "edge.show", style: { display: "element" } },
    { selector: "edge.hi", style: { display: "element", opacity: 0.95, width: 2.2, "z-index": 42 } },
    { selector: "edge.hi[kind = 'soft']", style: { opacity: 0.6 } },
  ];
}

const PIN_PX = 13;    // overview names keep this on-screen size
const MAX_PINS = 70;  // at most this many names at once

const pinBox = (chars: number, fs: number) => ({ w: chars * fs * 0.63 + fs * 1.1, h: fs * 1.65 });

/** Keep the selection pill PIN_PX on screen, just above its concept. */
function sizeSelPin(c: cytoscape.Core) {
  const fs = PIN_PX / c.zoom();
  c.nodes(".selpin").forEach((p) => {
    const { w, h } = pinBox(p.data("chars"), fs);
    p.data({ fs, w, h });
    p.position({ x: p.position("x"), y: p.data("top") - fs * 0.3 - h / 2 });
  });
}

/** Name the concepts in view while zoomed out: walk them in importance order and give each a pill
 *  above its box unless it would touch a region label or a pill already placed. The pills keep their
 *  on-screen size, so zooming in frees room and more concepts get named. */
function placePins(c: cytoscape.Core, order: string[], filtered: Set<string>, dimmed: Set<string> | null, lodNow: Lod, fitZoom: number) {
  c.batch(() => {
    c.remove(c.nodes(".pin").not(".selpin"));
    if (lodNow !== 0) return;
    const z = c.zoom();
    const fs = PIN_PX / z;
    const view = c.extent();
    const rects = c.nodes(".region, .band-label, .header").map((n) => {
      const b = n.boundingBox({ includeLabels: true, includeOverlays: false });
      return { x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2, w: b.w, h: b.h };
    });
    const mx = fs * 0.35, my = fs * 0.25;
    // about 25 names on the fitted map, more as the view closes in
    const max = Math.min(MAX_PINS, Math.round(25 * (z / fitZoom) ** 2));
    let placed = 0;
    for (const id of order) {
      if (filtered.has(id)) continue;
      const n = c.getElementById(id);
      if (n.empty()) continue;
      const pos = n.position();
      if (pos.x < view.x1 || pos.x > view.x2 || pos.y < view.y1 || pos.y > view.y2) continue;
      const text = String(n.data("name"));
      const { w, h } = pinBox(text.length, fs);
      const top = pos.y - n.data("h") / 2;
      const r = { x: pos.x, y: top - fs * 0.3 - h / 2, w, h };
      if (rects.some((q) => Math.abs(q.x - r.x) < (q.w + r.w) / 2 + mx && Math.abs(q.y - r.y) < (q.h + r.h) / 2 + my)) continue;
      rects.push(r);
      c.add({ group: "nodes", classes: "pin lod0" + (dimmed?.has(id) ? " dim" : ""), data: { id: `pin:${id}`, target: id, label: text, chars: text.length, top, border: n.data("border"), fs, w, h }, position: { x: r.x, y: r.y } });
      if (++placed >= max) break;
    }
  });
}

const ClusterGraph = forwardRef<ClusterGraphHandle, ClusterGraphProps>(function ClusterGraph(props, ref) {
  const { elements, positionsKey, resetToken, selected, onSelect, onOpen, onHover, onLod, pinOrder, filtered, matches, edgeMode, focus, lodAt, inset } = props;
  const host = useRef<HTMLDivElement>(null);
  const cy = useRef<cytoscape.Core | null>(null);
  const lod = useRef<Lod>(0);
  const hovered = useRef<string | null>(null);
  const theme = useTheme();
  // callbacks change identity on every render of the page; read them through a ref
  const cb = useRef({ onSelect, onOpen, onHover, onLod });
  cb.current = { onSelect, onOpen, onHover, onLod };
  const edgeModeRef = useRef(edgeMode);
  edgeModeRef.current = edgeMode;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  // what placePins needs, read at zoom and pan time
  const pinState = useRef({ order: pinOrder, filtered, dimmed: null as Set<string> | null });
  pinState.current.order = pinOrder;
  pinState.current.filtered = filtered;
  const lastPins = useRef({ zoom: 0, x: 0, y: 0 });
  const fitZoom = useRef(1);
  const repin = (c: cytoscape.Core, force = false) => {
    const z = c.zoom(), pan = c.pan();
    const l = lastPins.current;
    // re-place only when the view moved enough to change what fits
    if (!force && Math.abs(z / (l.zoom || 1) - 1) < 0.06 && Math.hypot(pan.x - l.x, pan.y - l.y) < 60) return;
    lastPins.current = { zoom: z, x: pan.x, y: pan.y };
    placePins(c, pinState.current.order, pinState.current.filtered, pinState.current.dimmed, lod.current, fitZoom.current);
    sizeSelPin(c);
  };

  const fitAll = (c: cytoscape.Core) => {
    const bb = c.elements().boundingBox({});
    const W = c.width(), H = c.height();
    const z = Math.min((W - inset.left - inset.right) / bb.w, (H - inset.top - inset.bottom) / bb.h, 1.6);
    c.zoom(z);
    c.pan({ x: inset.left + (W - inset.left - inset.right - bb.w * z) / 2 - bb.x1 * z, y: inset.top + (H - inset.top - inset.bottom - bb.h * z) / 2 - bb.y1 * z });
  };

  useImperativeHandle(ref, () => ({
    zoomBy: (f) => {
      const c = cy.current;
      if (!c) return;
      c.animate({ zoom: { level: Math.max(c.minZoom(), Math.min(c.maxZoom(), c.zoom() * f)), renderedPosition: { x: c.width() / 2, y: c.height() / 2 } } }, { duration: 200 });
    },
    fit: () => { const c = cy.current; if (c) c.animate({ fit: { eles: c.elements(), padding: 30 } }, { duration: 300 }); },
  }));

  // edges shown for the hovered and selected concepts, or all of them in "all" mode once zoomed in
  const refreshEdges = (c: cytoscape.Core) => {
    c.batch(() => {
      c.edges().removeClass("show hi");
      if (edgeModeRef.current === "all" && lod.current >= 1) c.edges().addClass("show");
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
      wheelSensitivity: 0.25, minZoom: 0.04, maxZoom: 3, boxSelectionEnabled: false, autoungrabify: false });
    const concepts = () => c.nodes(".concept");
    const saved = loadSaved(positionsKey);
    concepts().forEach((n) => { const p = saved[n.id()]; if (p) n.position(p); });
    // pills follow their concept when it is dragged
    c.on("drag", "node.concept", (e) => {
      const n = e.target;
      c.nodes(".pin").filter((p) => p.data("target") === n.id()).forEach((p) => {
        p.data("top", n.position("y") - n.data("h") / 2);
        p.position({ x: n.position("x"), y: p.data("top") - p.data("fs") * 0.3 - p.data("h") / 2 });
      });
    });
    c.on("dragfree", "node.concept", () => { repin(c, true); });
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
        });
        refreshEdges(c);
      }
      repin(c, force);
      cb.current.onLod(next, z);
    };
    fitAll(c);
    fitZoom.current = c.zoom();
    lastPins.current = { zoom: 0, x: 0, y: 0 };
    if (import.meta.env.DEV) (window as unknown as { __fieldmap: cytoscape.Core }).__fieldmap = c;   // for headless checks
    setLod(true);
    let raf = 0;
    c.on("zoom pan", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setLod()); });
    // a landmark pill stands for its concept
    const conceptOf = (t: cytoscape.NodeSingular) => (t.hasClass("pin") ? c.getElementById(t.data("target")) : t);
    c.on("tap", "node.concept, node.pin", (e) => cb.current.onSelect(conceptOf(e.target).id()));
    c.on("dbltap", "node.concept, node.pin", (e) => cb.current.onOpen(conceptOf(e.target).id()));
    c.on("tap", (e) => { if (e.target === c) cb.current.onSelect(null); });
    c.on("mouseover", "node.concept, node.pin", (e) => {
      const n = conceptOf(e.target);
      hovered.current = n.id();
      const p = e.target.renderedPosition();
      cb.current.onHover({ id: n.id(), x: p.x, y: p.y - e.target.renderedHeight() / 2 });
      refreshEdges(c);
    });
    c.on("mouseout", "node.concept, node.pin", () => { hovered.current = null; cb.current.onHover(null); refreshEdges(c); });
    c.on("pan zoom drag", () => { if (hovered.current) { hovered.current = null; cb.current.onHover(null); } });
    cy.current = c;
    return () => { cancelAnimationFrame(raf); c.destroy(); cy.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, theme, positionsKey, resetToken]);

  // filters, search and selection only change classes
  useEffect(() => {
    const c = cy.current;
    if (!c) return;
    c.batch(() => {
      const all = c.nodes(".concept");
      const pins = c.nodes(".pin");
      all.removeClass("filtered dim match sel nbr");
      pins.removeClass("filtered dim");
      all.filter((n) => filtered.has(n.id())).addClass("filtered");
      pins.filter((p) => filtered.has(p.data("target"))).addClass("filtered");
      let dimmed: Set<string> | null = null;
      if (matches) {
        all.filter((n) => !matches.has(n.id())).addClass("dim");
        all.filter((n) => matches.has(n.id())).addClass("match");
        dimmed = new Set(all.filter((n) => !matches.has(n.id())).map((n) => n.id()));
      } else if (selected) {
        const n = c.getElementById(selected);
        if (!n.empty()) {
          const hood = n.closedNeighborhood().nodes(".concept");
          all.not(hood).addClass("dim");
          hood.addClass("nbr");
          n.addClass("sel");
          const keep = new Set(hood.map((x) => x.id()));
          dimmed = new Set(all.filter((x) => !keep.has(x.id())).map((x) => x.id()));
        }
      }
      if (dimmed) pins.filter((p) => dimmed!.has(p.data("target"))).addClass("dim");
      pinState.current.dimmed = dimmed;
      // the selected concept is always named, even zoomed out
      c.remove(c.nodes(".selpin"));
      if (selected && c.nodes(".pin").filter((p) => p.data("target") === selected).empty()) {
        const n = c.getElementById(selected);
        if (!n.empty()) {
          const text = String(n.data("name") ?? n.data("label")).replace(/\n/g, " ");
          c.add({ group: "nodes", classes: `pin selpin lod${lod.current}`, data: { id: `selpin:${selected}`, target: selected, label: text, chars: text.length, top: n.position("y") - n.data("h") / 2, border: n.data("border"), fs: 13, w: 10, h: 10 }, position: { ...n.position() } });
        }
      }
    });
    repin(c, true);
    refreshEdges(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, matches, selected, edgeMode, elements, theme, resetToken]);

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
