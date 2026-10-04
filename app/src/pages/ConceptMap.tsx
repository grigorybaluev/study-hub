// DS Concept Map (#173): the concepts a data-science professional should know, whatever the program
// teaches, placed by their field relevance (derived.ds_field) and coloured by domain family.
// The view lives in the URL (layout, selection, filters), so a reload or a shared link shows the
// same map; dragged positions are remembered per layout in this browser.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { ElementDefinition } from "cytoscape";
import ClusterGraph, { LINK_MIN, LOD_LABEL, clearSavedPositions, type ClusterGraphHandle, type Lod } from "../components/ClusterGraph";
import { tint, useTheme } from "../components/GraphView";
import { LAYOUTS, TIER_NAMES, layoutField, type FieldEdge, type FieldItem, type FieldLayout, type LayoutName } from "../components/fieldLayouts";
import { DOMAIN_LABEL, DOMAIN_ORDER, FAMILY_COLOR, FAMILY_LABEL, FAMILY_OF, familyTitleColor, fieldColor, titleColor, type Family } from "../components/domains";
import { Badge, UnitLink } from "../components/Chips";
import { edgesOut, href, node, useData, type Data } from "../data/load";
import type { ConceptNode, DsFieldConcept, DsTier, RoadmapSkillNode } from "../data/types";

const TIERS: DsTier[] = ["application", "core", "supporting", "peripheral"];
const TIER_INDEX: Record<DsTier, number> = { application: 0, core: 1, supporting: 2, peripheral: 3 };
const TIER_HELP: Record<DsTier, string> = {
  application: "Mapped to a target skill of the DS roadmap: the data-science work itself.",
  core: "Not DS itself, but many DS concepts rest on it.",
  supporting: "Some DS concepts rest on it, through a few paths.",
  peripheral: "No DS concept rests on it.",
};
type Coverage = "all" | "taught" | "untaught";
const INSET = { top: 112, right: 24, bottom: 24, left: 286 };
const FAMILIES: Family[] = ["maths", "probability", "computing", "data", "ml"];

/** band fills: one neutral ramp, darkest at the centre in light mode and lightest in dark mode */
const BAND_FILL = { light: ["#ebe8df", "#f1efe8", "#f6f4ef", "#fbfaf7"], dark: ["#2d3139", "#272b32", "#22252b", "#1e2126"] };
const BAND_LINE = { light: "#d6d2c6", dark: "#3a3f48" };

// the network layout takes about a second; keep it for the session
const networkCache = new Map<string, FieldLayout>();

export default function ConceptMap() {
  const d = useData();
  const nav = useNavigate();
  const theme = useTheme();
  const [params, setParams] = useSearchParams();
  const layoutName = (LAYOUTS.find((l) => l.id === params.get("layout"))?.id ?? "radial") as LayoutName;
  // a selection is a concept; anything else in the link is ignored
  const selected = (() => { const v = params.get("sel"); return v && d.derived.ds_field.concepts[v] ? v : null; })();
  // an open domain-link summary, "from>to"; it and a selected concept exclude each other
  const selectedLink = (() => { const v = params.get("link"); const [a, b] = (v ?? "").split(">"); return a && b && DOMAIN_ORDER.includes(a) && DOMAIN_ORDER.includes(b) && !selected ? `${a}>${b}` : null; })();
  const hidden = useMemo(() => new Set((params.get("hide") ?? "").split(",").filter(Boolean)), [params]);
  const tiersOff = useMemo(() => new Set((params.get("off") ?? "").split(",").filter(Boolean)), [params]);
  const coverage = (params.get("cov") ?? "all") as Coverage;
  const mark = params.get("mark") === "1";
  // every edge shows once zoomed in, unless switched off (edges=focus: only the hovered or selected concept's)
  const edgeMode = params.get("edges") === "focus" ? "focus" : "all";
  const links = params.get("links") !== "0";
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === "") next.delete(k); else next.set(k, v); }
    setParams(next, { replace: true });
  };

  const field = d.derived.ds_field.concepts;
  const items = useMemo<FieldItem[]>(() => d.concepts.map((c) => ({
    id: c.id, title: c.title, name: c.short ?? c.title, domain: c.domain, tier: TIER_INDEX[field[c.id]?.tier ?? "peripheral"], score: field[c.id]?.score ?? 0,
  })), [d, field]);
  const edges = useMemo(() => fieldEdges(d), [d]);
  const hardEdges = useMemo<FieldEdge[]>(() => edges.filter((e) => e.kind !== "soft").map((e) => ({ from: e.target, to: e.source })), [edges]);

  // layouts: synchronous except the network, which runs after the first paint
  const version = d.graph.meta.content_version;
  const [network, setNetwork] = useState<FieldLayout | null>(networkCache.get(version) ?? null);
  const sync = useMemo(() => (layoutName === "network" ? null : layoutField(layoutName, items, hardEdges)), [layoutName, items, hardEdges]);
  useEffect(() => {
    if (layoutName !== "network" || network) return;
    const t = setTimeout(() => { const l = layoutField("network", items, hardEdges); networkCache.set(version, l); setNetwork(l); }, 30);
    return () => clearTimeout(t);
  }, [layoutName, network, items, hardEdges, version]);
  const layout = layoutName === "network" ? network : sync;

  const [resetToken, setResetToken] = useState(0);
  const [lod, setLod] = useState<Lod>(0);
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [linkHover, setLinkHover] = useState<{ from: string; to: string; count: number; x: number; y: number } | null>(null);
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const graph = useRef<ClusterGraphHandle>(null);
  const positionsKey = `fieldmap:${layoutName}:${version}`;

  const { elements, lodAt } = useMemo(() => build(d, layout, layoutName, edges, theme), [d, layout, layoutName, edges, theme]);

  const filtered = useMemo(() => {
    const out = new Set<string>();
    for (const c of d.concepts) {
      const f = field[c.id];
      const taught = f?.taught != null;
      if (hidden.has(c.domain) || tiersOff.has(f?.tier ?? "peripheral") || (coverage === "taught" && !taught) || (coverage === "untaught" && taught)) out.add(c.id);
    }
    return out;
  }, [d, field, hidden, tiersOff, coverage]);
  const matches = useMemo(() => (query.trim().length >= 2 ? new Set(searchConcepts(d, query).map((c) => c.id)) : null), [d, query]);

  const choose = (id: string) => { set({ sel: id, link: null }); setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 })); setQuery(""); };
  // a link (or a reload) that carries a selection opens on it
  useEffect(() => { if (selected) setFocus({ id: selected, n: 1 }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [layout]);
  const select = (id: string | null) => set({ sel: id, link: null });
  const openLink = (from: string, to: string) => set({ link: `${from}>${to}`, sel: null });

  // keyboard: "/" search, Escape clears, + and - zoom, f fits
  const searchBox = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "SELECT";
      if (e.key === "/" && !typing) { e.preventDefault(); searchBox.current?.focus(); }
      else if (e.key === "Escape") { setQuery(""); if (!typing) set({ sel: null, link: null }); (e.target as HTMLElement)?.blur?.(); }
      else if (!typing && (e.key === "+" || e.key === "=")) graph.current?.zoomBy(1.4);
      else if (!typing && e.key === "-") graph.current?.zoomBy(1 / 1.4);
      else if (!typing && e.key === "f") graph.current?.fit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggle = (key: "hide" | "off", value: string, current: Set<string>, solo = false, universe: string[] = []) => {
    let next: Set<string>;
    if (solo) next = new Set(universe.filter((v) => v !== value));
    else { next = new Set(current); if (next.has(value)) next.delete(value); else next.add(value); }
    set({ [key]: [...next].join(",") });
  };
  const domainsPresent = DOMAIN_ORDER.filter((dm) => d.concepts.some((c) => c.domain === dm));
  const help = LAYOUTS.find((l) => l.id === layoutName)!.help;

  return (
    <div className="explore fieldmap">
      <div className="explore-graph">
        {layout ? (
          <ClusterGraph ref={graph} elements={elements} positionsKey={positionsKey} resetToken={resetToken} selected={selected}
            onSelect={select} onOpen={(id) => nav(href.concept(id))} onHover={setHover} onLod={(l, z) => { setLod(l); setZoom(z); }}
            filtered={filtered} matches={matches} edgeMode={edgeMode} mark={mark} focus={focus} lodAt={lodAt} inset={INSET}
            links={links} selectedLink={selectedLink} onLinkHover={setLinkHover} onLinkClick={openLink} />
        ) : <div className="fieldmap-busy">Laying out the network…</div>}
      </div>

      <div className="explore-panel fieldmap-top">
        <h1 title="Every concept of data science, whatever the program teaches, placed by relevance and coloured by domain (#173)">DS Concept Map</h1>
        <div className="seg" role="tablist" aria-label="Layout">
          {LAYOUTS.map((l) => (
            <button key={l.id} role="tab" aria-selected={layoutName === l.id} className={layoutName === l.id ? "active" : ""} title={l.help}
              onClick={() => set({ layout: l.id === "radial" ? null : l.id })}>{l.label}</button>
          ))}
        </div>
        <FieldSearch query={query} setQuery={setQuery} onPick={choose} inputRef={searchBox} filtered={filtered} />
        <label className="fieldmap-check" title={`While zoomed out, one line per pair of domains with at least ${LINK_MIN} dependencies between them, as wide as their number`}>
          <input type="checkbox" checked={links} onChange={(e) => set({ links: e.target.checked ? null : "0" })} /> domain links
        </label>
        <label className="fieldmap-check" title="Show the dependency arrows of every visible concept once zoomed in (otherwise only for the hovered or selected one)">
          <input type="checkbox" checked={edgeMode === "all"} onChange={(e) => set({ edges: e.target.checked ? null : "focus" })} /> all edges
        </label>
        <button className="plain" onClick={() => { clearSavedPositions(positionsKey); setResetToken((t) => t + 1); }} title="Forget dragged positions for this layout">reset layout</button>
        <Link className="small" to="/explore/courses" title="The program's courses by term, with their prerequisites">Courses →</Link>
      </div>

      <aside className="fieldmap-legend" aria-label="Filters">
        <section>
          <h4>Relevance <span className="muted">· click to hide</span></h4>
          {TIERS.map((t) => {
            const n = d.concepts.filter((c) => (field[c.id]?.tier ?? "peripheral") === t).length;
            return (
              <button key={t} className={"legend-row" + (tiersOff.has(t) ? " off" : "")} title={TIER_HELP[t] + " Alt-click to show only this tier."}
                onClick={(e) => toggle("off", t, tiersOff, e.altKey, TIERS)}>
                <i className="ring" style={{ background: BAND_FILL[theme][TIER_INDEX[t]], borderColor: BAND_LINE[theme] }} />
                <span>{TIER_NAMES[TIER_INDEX[t]]}</span><span className="count">{n}</span>
              </button>
            );
          })}
        </section>
        <section>
          <h4>Domains <span className="muted">· alt-click: only</span></h4>
          {FAMILIES.map((fam) => {
            const doms = domainsPresent.filter((dm) => FAMILY_OF[dm] === fam);
            if (!doms.length) return null;
            const allOff = doms.every((dm) => hidden.has(dm));
            return (
              <div key={fam} className="legend-family">
                <button className={"legend-family-head" + (allOff ? " off" : "")} title={`Show or hide all of ${FAMILY_LABEL[fam]}`}
                  onClick={() => {
                    const next = new Set(hidden);
                    for (const dm of doms) { if (allOff) next.delete(dm); else next.add(dm); }
                    set({ hide: [...next].join(",") });
                  }}>
                  <i style={{ background: FAMILY_COLOR[theme][fam] }} />{FAMILY_LABEL[fam]}
                </button>
                {doms.map((dm) => (
                  <button key={dm} className={"legend-row" + (hidden.has(dm) ? " off" : "")} title={`${dm} — click to hide, alt-click to show only this domain`}
                    onClick={(e) => toggle("hide", dm, hidden, e.altKey, domainsPresent)}>
                    <i style={{ background: tint(fieldColor(dm, theme), theme), borderColor: fieldColor(dm, theme) }} />
                    <span>{DOMAIN_LABEL[dm] ?? dm}</span><span className="count">{d.concepts.filter((c) => c.domain === dm).length}</span>
                  </button>
                ))}
              </div>
            );
          })}
          {(hidden.size > 0 || tiersOff.size > 0) && <button className="linkish small" onClick={() => set({ hide: null, off: null })}>show everything</button>}
        </section>
        <section>
          <h4>Concordia</h4>
          <select value={coverage} onChange={(e) => set({ cov: e.target.value === "all" ? null : e.target.value })} aria-label="Coverage filter">
            <option value="all">every concept</option>
            <option value="taught">only what the program teaches</option>
            <option value="untaught">only what it does not teach</option>
          </select>
          <label className="fieldmap-check" title="Dashed border: no unit teaches it; dotted: taught inside a topic it is part of">
            <input type="checkbox" checked={mark} onChange={(e) => set({ mark: e.target.checked ? "1" : null })} /> mark untaught concepts
          </label>
        </section>
      </aside>

      <div className="fieldmap-zoom">
        <button onClick={() => graph.current?.zoomBy(1 / 1.4)} aria-label="Zoom out" title="Zoom out (-)">−</button>
        <button onClick={() => graph.current?.zoomBy(1.4)} aria-label="Zoom in" title="Zoom in (+)">+</button>
        <button onClick={() => graph.current?.fit()} aria-label="Fit the map" title="Fit (f)">fit</button>
        <span className="muted small" title="Zoomed out you see the domains; names appear by relevance as you zoom in">{LOD_LABEL[lod]} · {Math.round(zoom * 100)}%</span>
        <button className={"help" + (showHelp ? " active" : "")} onClick={() => setShowHelp((s) => !s)} aria-label="How to read the map">?</button>
      </div>
      {showHelp && (
        <div className="fieldmap-help">
          <p><b>{LAYOUTS.find((l) => l.id === layoutName)!.label}.</b> {help}</p>
          <p>Colour is the domain, grouped in five families; size grows with the field relevance score. Zoomed out you see the domains; zoom in to read the concepts, the most load-bearing named first. Hover for a definition, click to see why a concept matters and what it rests on, double-click to open its page. Arrows lead from a foundation to what rests on it; hiding a domain or a tier hides its arrows too. Zoomed out, lines between domains stand for their dependencies: as wide as their number, coloured by the domain they come from, drawn for pairs with {LINK_MIN} or more.</p>
          <p className="muted small">Keys: / search · Esc clear · + and − zoom · f fit. Drag boxes to tidy; positions are kept per layout.</p>
        </div>
      )}

      {hover && hover.id !== selected && <HoverCard id={hover.id} x={hover.x} y={hover.y} />}
      {linkHover && !hover && (
        <div className="fieldmap-hover link" style={{ left: Math.min(Math.max(12, linkHover.x - 150), window.innerWidth - 330), top: Math.max(12, linkHover.y - 14), transform: "translateY(-100%)" }}>
          <div className="hover-title">{DOMAIN_LABEL[linkHover.to] ?? linkHover.to} rests on {DOMAIN_LABEL[linkHover.from] ?? linkHover.from}</div>
          <div className="small">{linkHover.count} dependenc{linkHover.count === 1 ? "y" : "ies"} between their visible concepts</div>
          <div className="small muted">Click for a summary of this link</div>
        </div>
      )}
      {selected && <DetailPanel id={selected} onPick={choose} onClose={() => select(null)} />}
      {selectedLink && (
        <LinkPanel link={selectedLink} filtered={filtered} onPick={choose} onSwitch={openLink} onClose={() => set({ link: null })}
          onIsolate={(a, b) => set({ hide: DOMAIN_ORDER.filter((dm) => dm !== a && dm !== b).join(",") })} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- data

interface FieldEdgeRow { source: string; target: string; kind: "hard" | "soft" | "part" | "gen" }

const edgeCache = new WeakMap<Data, FieldEdgeRow[]>();

/** Arrows from a foundation to what rests on it: concept depends_on, generalizes, part_of (#173). */
function fieldEdges(d: Data): FieldEdgeRow[] {
  const cached = edgeCache.get(d);
  if (cached) return cached;
  const seen = new Set<string>();
  const out: FieldEdgeRow[] = [];
  const add = (source: string, target: string, kind: FieldEdgeRow["kind"]) => {
    const k = `${source}>${target}`;
    if (source === target || seen.has(k)) return;
    seen.add(k);
    out.push({ source, target, kind });
  };
  for (const e of d.derived.concept_depends_on) if (e.strength === "hard") add(e.to, e.from, "hard");
  for (const e of d.graph.edges) {
    if (e.type === "part_of") add(e.to, e.from, "part");
    if (e.type === "generalizes") add(e.to, e.from, "gen");
  }
  for (const e of d.derived.concept_depends_on) if (e.strength === "soft") add(e.to, e.from, "soft");
  edgeCache.set(d, out);
  return out;
}

function build(d: Data, layout: FieldLayout | null, name: LayoutName, edges: FieldEdgeRow[], theme: "light" | "dark"): { elements: ElementDefinition[]; lodAt: [number, number] } {
  if (!layout) return { elements: [], lodAt: [0.45, 0.85] };
  const field = d.derived.ds_field.concepts;
  const xs = [...layout.nodes.values()];
  const bw = Math.max(...xs.map((p) => p.x + p.w / 2)) - Math.min(...xs.map((p) => p.x - p.w / 2));
  const bh = Math.max(...xs.map((p) => p.y + p.h / 2)) - Math.min(...xs.map((p) => p.y - p.h / 2));
  const vw = Math.max(800, window.innerWidth - INSET.left - INSET.right), vh = Math.max(500, window.innerHeight - 60 - INSET.top - INSET.bottom);
  const fitZoom = Math.min(vw / bw, vh / bh);
  // labels that must read when the whole map is fitted are sized in screen pixels at that zoom
  const k = (px: number) => Math.max(px, px / fitZoom);
  const els: ElementDefinition[] = [];
  for (const dec of layout.decorations) {
    const fam = dec.family;
    const data: Record<string, unknown> = { id: dec.id, label: dec.label, w: dec.w, h: dec.h };
    if (dec.kind === "rowband") data.fill = BAND_FILL[theme][dec.tier ?? 3];
    if (dec.kind === "region") data.fs = layoutSizedRegion(dec) ? dec.fs : k(18);
    // titles wear their domain's colour (a family title its family's), kept readable on the canvas
    if (dec.kind === "region" || dec.kind === "header") data.color = dec.domain ? titleColor(dec.domain, theme) : fam ? familyTitleColor(fam, theme) : undefined;
    if (dec.kind === "band-label") data.fs = Math.max(dec.fs ?? 14, k(12));
    // a column header must fit its column: no word wider than the column it names
    if (dec.kind === "header") data.fs = Math.min(Math.max(dec.fs ?? 14, k(10)), dec.w / (Math.max(...dec.label.split(" ").map((x) => x.length)) * 0.7));
    if (dec.align) data.align = dec.align;
    if (dec.domain) data.domain = dec.domain;
    if (fam) data.family = fam;
    els.push({ classes: dec.kind, data, position: { x: dec.x, y: dec.y } });
  }
  let minFs = Infinity, maxFs = 0;
  for (const c of d.concepts) {
    const p = layout.nodes.get(c.id);
    if (!p) continue;
    minFs = Math.min(minFs, p.fs); maxFs = Math.max(maxFs, p.fs);
    const color = fieldColor(c.domain, theme);
    els.push({
      classes: "concept",
      data: { id: c.id, label: p.label, name: c.short ?? c.title, domain: c.domain, family: FAMILY_OF[c.domain], w: p.w, h: p.h, fs: p.fs, fill: tint(color, theme), border: color, taught: field[c.id]?.taught ?? "none" },
      position: { x: p.x, y: p.y },
    });
  }
  for (const e of edges) {
    if (!layout.nodes.has(e.source) || !layout.nodes.has(e.target)) continue;
    els.push({ data: { id: `${e.source}>${e.target}`, source: e.source, target: e.target, kind: e.kind, lc: fieldColor(node<ConceptNode>(d, e.source)?.domain ?? "", theme) } });
  }
  els.push(...domainLinks(d, layout, name, edges, theme, fitZoom));
  // levels follow readability (labels hide below 9 px on screen): the overview lasts until the
  // largest names become legible, the detail level starts when the smallest do
  return { elements: els, lodAt: [Math.max(fitZoom * 1.05, 9 / maxFs), Math.max(fitZoom * 1.6, 9 / minFs)] };
}

/** Domain links (#179): the hard dependencies from one domain's concepts to another's, one curved line per
 *  pair with at least LINK_MIN of them, between the anchors the layout gives each domain — its cluster
 *  centre on the radial map (its title placed against it), its title on the network, and below its column
 *  on the grid, where the lines arc under the table. Width is set in screen pixels at the fitted zoom
 *  (half a pixel plus the square root of the count). */
function domainLinks(d: Data, layout: FieldLayout, name: LayoutName, edges: FieldEdgeRow[], theme: "light" | "dark", fitZoom: number): ElementDefinition[] {
  const dom = new Map(d.concepts.map((c) => [c.id, c.domain]));
  const counts = new Map<string, number>();
  for (const e of edges) {
    if (e.kind === "soft") continue;
    const a = dom.get(e.source), b = dom.get(e.target);
    if (!a || !b || a === b || !layout.nodes.has(e.source) || !layout.nodes.has(e.target)) continue;
    counts.set(`${a}>${b}`, (counts.get(`${a}>${b}`) ?? 0) + 1);
  }
  const strong = [...counts].filter(([, n]) => n >= LINK_MIN);
  const domains = [...new Set(strong.flatMap(([k]) => k.split(">")))];
  const anchor = layout.anchors;
  const els: ElementDefinition[] = domains.map((dm) => ({ classes: "anchor", data: { id: `anchor:${dm}` }, position: anchor.get(dm)! }));
  const scale = 1 / fitZoom;
  for (const [k, n] of strong) {
    const [a, b] = k.split(">");
    const pa = anchor.get(a)!, pb = anchor.get(b)!;
    // a gentle curve, so the two directions of one pair part ways; on the grid an arc below the table
    const cpd = name === "grid" ? Math.sign(pb.x - pa.x || 1) * Math.abs(pb.x - pa.x) * 0.3 : Math.hypot(pb.x - pa.x, pb.y - pa.y) * 0.12;
    els.push({ classes: "meta", data: { id: `link:${k}`, source: `anchor:${a}`, target: `anchor:${b}`, from: a, to: b, count: n, scale, width: scale * (0.5 + Math.sqrt(n)), color: fieldColor(a, theme), cpd } });
  }
  return els;
}

/** radial and network titles are sized by their layout; the grid's family titles by the fitted zoom */
const layoutSizedRegion = (dec: { id: string; fs?: number }) => dec.fs !== undefined && !dec.id.startsWith("fam:");

function searchConcepts(d: Data, q: string): ConceptNode[] {
  const t = q.trim().toLowerCase();
  if (t.length < 2) return [];
  const score = (c: ConceptNode) => {
    const title = c.title.toLowerCase();
    if (title.startsWith(t) || (c.short ?? "").toLowerCase().startsWith(t)) return 0;
    if (title.includes(t)) return 1;
    if ((c.short ?? "").toLowerCase().includes(t) || c.aliases.some((a) => a.toLowerCase().includes(t))) return 2;
    return 9;
  };
  return d.concepts.map((c) => ({ c, s: score(c) })).filter((x) => x.s < 9)
    .sort((a, b) => a.s - b.s || a.c.title.localeCompare(b.c.title)).map((x) => x.c);
}

// ---------------------------------------------------------------- pieces

function FieldSearch({ query, setQuery, onPick, inputRef, filtered }: { query: string; setQuery: (q: string) => void; onPick: (id: string) => void; inputRef: React.RefObject<HTMLInputElement>; filtered: Set<string> }) {
  const d = useData();
  const theme = useTheme();
  const [hi, setHi] = useState(0);
  const hits = useMemo(() => searchConcepts(d, query).slice(0, 9), [d, query]);
  const all = useMemo(() => searchConcepts(d, query).length, [d, query]);
  return (
    <div className="explore-search">
      <input ref={inputRef} placeholder="Find a concept… ( / )" value={query} aria-label="Find a concept in the map"
        onChange={(e) => { setQuery(e.target.value); setHi(0); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, hits.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
          else if (e.key === "Enter" && hits[hi]) onPick(hits[hi].id);
        }} />
      {hits.length > 0 && (
        <div className="results">
          <div className="results-head muted small">{all} match{all === 1 ? "" : "es"} highlighted on the map</div>
          {hits.map((c, i) => (
            <button key={c.id} className={(i === hi ? "hi " : "") + (filtered.has(c.id) ? "hidden" : "")} onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(c.id)}
              title={filtered.has(c.id) ? "Hidden by the current filters" : c.body}>
              <i style={{ background: fieldColor(c.domain, theme) }} /><span className="result-title">{c.title}</span>
              <span className="small muted result-domain">{DOMAIN_LABEL[c.domain] ?? c.domain}{filtered.has(c.id) ? " · hidden" : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HoverCard({ id, x, y }: { id: string; x: number; y: number }) {
  const d = useData();
  const theme = useTheme();
  const c = node<ConceptNode>(d, id);
  const f = d.derived.ds_field.concepts[id];
  if (!c || !f) return null;
  const left = Math.min(Math.max(12, x - 160), window.innerWidth - 340);
  const top = Math.max(12, y - 12);
  return (
    <div className="fieldmap-hover" style={{ left, top, transform: "translateY(-100%)" }}>
      <div className="hover-title"><i style={{ background: fieldColor(c.domain, theme) }} />{c.title}</div>
      <div className="small muted">{DOMAIN_LABEL[c.domain] ?? c.domain} · {TIER_NAMES[TIER_INDEX[f.tier]]} · {taughtText(d, f)}</div>
      <div className="small hover-body">{c.body}</div>
    </div>
  );
}

function taughtText(d: Data, f: DsFieldConcept): string {
  if (f.taught === "unit") return "taught at Concordia";
  if (f.taught === "parent" && f.taught_within) return `taught within ${node<ConceptNode>(d, f.taught_within)?.title ?? f.taught_within}`;
  return "not taught at Concordia";
}

function DetailPanel({ id, onPick, onClose }: { id: string; onPick: (id: string) => void; onClose: () => void }) {
  const d = useData();
  const theme = useTheme();
  const c = node<ConceptNode>(d, id)!;
  const f = d.derived.ds_field.concepts[id];
  const why = useMemo(() => whyItMatters(d, id), [d, id]);
  const restsOn = useMemo(() => fieldEdges(d).filter((e) => e.target === id), [d, id]);
  const restOnIt = useMemo(() => fieldEdges(d).filter((e) => e.source === id && e.kind !== "soft"), [d, id]);
  const units = d.derived.concepts[id]?.introduced_by ?? [];
  const skills = edgesOut(d, id, "maps_to").map((e) => e.to);
  const anchorsFirst = (ids: string[]) => [...ids].sort((a, b) => Number(!!d.derived.ds_field.concepts[b]?.anchor) - Number(!!d.derived.ds_field.concepts[a]?.anchor) || (d.derived.ds_field.concepts[b]?.score ?? 0) - (d.derived.ds_field.concepts[a]?.score ?? 0));
  const chip = (cid: string) => <button key={cid} className="chip linkchip" onClick={() => onPick(cid)} title={node<ConceptNode>(d, cid)?.body}>
    <i style={{ background: fieldColor(node<ConceptNode>(d, cid)?.domain ?? "", theme) }} />{node<ConceptNode>(d, cid)?.short ?? node<ConceptNode>(d, cid)?.title ?? cid}</button>;
  return (
    <aside className="fieldmap-detail" aria-label={`About ${c.title}`}>
      <div className="detail-head">
        <span className="detail-swatch" style={{ background: fieldColor(c.domain, theme) }} />
        <h2>{c.title}</h2>
        <button className="plain close" onClick={onClose} aria-label="Close" title="Close (Esc)">×</button>
      </div>
      <div className="small muted">{DOMAIN_LABEL[c.domain] ?? c.domain} · {FAMILY_LABEL[FAMILY_OF[c.domain]]}</div>
      {f && (
        <p className="detail-tier">
          <Badge kind={`tier-${f.tier}`}>{TIER_NAMES[TIER_INDEX[f.tier]]}</Badge>{" "}
          <span className="small muted" title={`Field relevance score ${f.score.toFixed(2)}: how much of the DS work rests on it, near or far`}>
            {f.reach === 0 ? (f.anchor ? "no other DS concept builds on it" : "no DS concept rests on it") : `${f.reach} DS concept${f.reach === 1 ? "" : "s"} ${f.anchor ? "build" : "rest"} on it`}
          </span>
        </p>
      )}
      <p className="detail-body">{c.body}</p>
      {why && (
        <div className="small detail-why">
          {why.kind === "anchor" && <><span className="muted">A DS concept: it maps to </span>{skills.map((s, i) => <span key={s}>{i > 0 && ", "}<Link to={href.skill(s)}>{(d.byId.get(s) as RoadmapSkillNode | undefined)?.title ?? s}</Link></span>)}</>}
          {why.kind === "path" && (
            <><span className="muted">Why it matters: </span>{why.chain.map((cid, i) => <span key={cid}>{i > 0 && <span className="muted"> → </span>}{i === 0 ? <b>{c.short ?? c.title}</b> : chip(cid)}</span>)}</>
          )}
          {why.kind === "none" && <span className="muted">No DS concept rests on it.</span>}
        </div>
      )}
      <section>
        <h4>At Concordia</h4>
        {units.length > 0 ? <ul className="detail-units">{units.map((u) => <li key={u}><UnitLink id={u} /></li>)}</ul>
          : f?.taught === "parent" && f.taught_within ? <p className="small">Taught within {chip(f.taught_within)}</p>
          : <p className="small muted">No unit teaches it.</p>}
      </section>
      {restsOn.length > 0 && (
        <section>
          <h4>Rests on</h4>
          <div>{anchorsFirst(restsOn.filter((e) => e.kind !== "soft").map((e) => e.source)).map(chip)}</div>
          {restsOn.some((e) => e.kind === "soft") && <div className="soft-row"><span className="muted small">helpful: </span>{restsOn.filter((e) => e.kind === "soft").map((e) => chip(e.source))}</div>}
        </section>
      )}
      {restOnIt.length > 0 && (
        <section>
          <h4>What rests on it</h4>
          <div>{anchorsFirst(restOnIt.map((e) => e.target)).slice(0, 24).map(chip)}{restOnIt.length > 24 && <span className="muted small"> +{restOnIt.length - 24} more</span>}</div>
        </section>
      )}
      <div className="detail-actions">
        <Link className="button" to={href.concept(id)}>Open the concept page</Link>
        {c.wikipedia && <a className="small" href={`https://en.wikipedia.org/wiki/${encodeURIComponent(c.wikipedia.replace(/ /g, "_"))}`} target="_blank" rel="noreferrer">Wikipedia ↗</a>}
      </div>
      <div className="muted small detail-alias">{c.aliases.length > 0 && <>Also: {c.aliases.slice(0, 8).join(", ")}</>}</div>
    </aside>
  );
}

const KIND_TEXT: Record<FieldEdgeRow["kind"], string> = { hard: "rests on", soft: "draws on", part: "is part of", gen: "generalizes" };

/** Summary of a domain link (#179): which concepts of one domain rest on which of the other, counted over the
 *  visible concepts like the line itself. */
function LinkPanel({ link, filtered, onPick, onSwitch, onIsolate, onClose }: {
  link: string; filtered: Set<string>; onPick: (id: string) => void; onSwitch: (from: string, to: string) => void;
  onIsolate: (from: string, to: string) => void; onClose: () => void;
}) {
  const d = useData();
  const theme = useTheme();
  const [from, to] = link.split(">");
  const field = d.derived.ds_field.concepts;
  const domOf = useMemo(() => new Map(d.concepts.map((c) => [c.id, c.domain])), [d]);
  const visible = (e: FieldEdgeRow) => e.kind !== "soft" && !filtered.has(e.source) && !filtered.has(e.target);
  const rows = useMemo(() => fieldEdges(d).filter((e) => visible(e) && domOf.get(e.source) === from && domOf.get(e.target) === to),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d, from, to, filtered, domOf]);
  const reverse = useMemo(() => fieldEdges(d).filter((e) => visible(e) && domOf.get(e.source) === to && domOf.get(e.target) === from).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d, from, to, filtered, domOf]);
  const tally = (ids: string[]) => {
    const m = new Map<string, number>();
    for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1] || (field[b[0]]?.score ?? 0) - (field[a[0]]?.score ?? 0));
  };
  const foundations = tally(rows.map((r) => r.source));
  const dependents = tally(rows.map((r) => r.target));
  const name = (id: string) => node<ConceptNode>(d, id)?.short ?? node<ConceptNode>(d, id)?.title ?? id;
  const taught = (ids: [string, number][]) => ids.filter(([id]) => field[id]?.taught != null).length;
  const F = DOMAIN_LABEL[from] ?? from, T = DOMAIN_LABEL[to] ?? to;
  const chip = (id: string, n?: number) => (
    <button key={id} className={"chip linkchip" + (field[id]?.taught == null ? " untaught" : "")} onClick={() => onPick(id)}
      title={(node<ConceptNode>(d, id)?.body ?? "") + (field[id]?.taught == null ? " (not taught at Concordia)" : "")}>
      <i style={{ background: fieldColor(domOf.get(id) ?? "", theme) }} />{name(id)}{n !== undefined && n > 1 && <span className="chip-count">{n}</span>}
    </button>
  );
  return (
    <aside className="fieldmap-detail" aria-label={`${T} rests on ${F}`}>
      <div className="detail-head">
        <h2 className="link-title">
          <span className="link-dom" style={{ color: titleColor(to, theme) }}>{T}</span>
          <span className="link-verb"> rests on </span>
          <span className="link-dom" style={{ color: titleColor(from, theme) }}>{F}</span>
        </h2>
        <button className="plain close" onClick={onClose} aria-label="Close" title="Close (Esc)">×</button>
      </div>
      {rows.length === 0 ? <p className="small muted">No dependency between the visible concepts of these two domains.</p> : (
        <>
          <p className="detail-body">
            <b>{rows.length}</b> dependenc{rows.length === 1 ? "y" : "ies"}: {dependents.length} {T.toLowerCase()} concept{dependents.length === 1 ? "" : "s"} rest
            {dependents.length === 1 ? "s" : ""} on {foundations.length} {F.toLowerCase()} concept{foundations.length === 1 ? "" : "s"}.
            {foundations.length > 0 && <> The most used {foundations.length === 1 ? "is" : "are"} {foundations.slice(0, 3).map(([id, n], i) => <span key={id}>{i > 0 && (i === Math.min(3, foundations.length) - 1 ? " and " : ", ")}<b>{name(id)}</b>{n > 1 ? ` (${n})` : ""}</span>)}.</>}
          </p>
          <p className="small muted">
            Concordia teaches {taught(dependents)} of the {dependents.length} {T.toLowerCase()} concepts and {taught(foundations)} of the {foundations.length} foundations
            {taught(dependents) < dependents.length || taught(foundations) < foundations.length ? "; the dashed ones are not taught." : "."}
          </p>
          <section>
            <h4>Foundations in {F}</h4>
            <div>{foundations.slice(0, 16).map(([id, n]) => chip(id, n))}{foundations.length > 16 && <span className="muted small"> +{foundations.length - 16} more</span>}</div>
          </section>
          <section>
            <h4>{T} concepts resting on them</h4>
            <div>{dependents.slice(0, 16).map(([id, n]) => chip(id, n))}{dependents.length > 16 && <span className="muted small"> +{dependents.length - 16} more</span>}</div>
          </section>
          <section>
            <details className="link-all">
              <summary><h4>All {rows.length} dependencies</h4></summary>
              <ul>
                {[...rows].sort((a, b) => name(a.target).localeCompare(name(b.target)) || name(a.source).localeCompare(name(b.source))).map((r) => (
                  <li key={r.source + ">" + r.target}>{chip(r.target)} <span className="muted small">{KIND_TEXT[r.kind]}</span> {chip(r.source)}</li>
                ))}
              </ul>
            </details>
          </section>
        </>
      )}
      <div className="detail-actions">
        <button className="button" onClick={() => onIsolate(from, to)}>Show only these two domains</button>
        {reverse > 0 && <button className="linkish small" onClick={() => onSwitch(to, from)}>{F} rests on {T}: {reverse} →</button>}
      </div>
      <p className="muted small detail-alias">Zoom in to read the concepts: the edges behind this link stay highlighted.</p>
    </aside>
  );
}

type Why = { kind: "anchor" } | { kind: "path"; chain: string[] } | { kind: "none" };

/** Shortest chain of hard field edges from a concept up to a DS concept (an anchor). */
function whyItMatters(d: Data, id: string): Why | null {
  const field = d.derived.ds_field.concepts;
  if (!field[id]) return null;
  if (field[id].anchor) return { kind: "anchor" };
  const up = new Map<string, string[]>();
  for (const e of fieldEdges(d)) if (e.kind !== "soft") (up.get(e.source) ?? up.set(e.source, []).get(e.source)!).push(e.target);
  const prev = new Map<string, string | null>([[id, null]]);
  const queue = [id];
  while (queue.length) {
    const x = queue.shift()!;
    if (x !== id && field[x]?.anchor) {
      const chain: string[] = [];
      for (let y: string | null = x; y; y = prev.get(y) ?? null) chain.push(y);
      return { kind: "path", chain: chain.reverse() };
    }
    for (const y of up.get(x) ?? []) if (!prev.has(y)) { prev.set(y, x); queue.push(y); }
  }
  return { kind: "none" };
}
