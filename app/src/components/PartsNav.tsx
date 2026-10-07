// The parts of a unit on a phone (#190): a slim sticky bar naming the part being read, which opens a
// sheet with the outline (## parts, ### sub-parts) to jump to. Wider screens hide it (CSS).
// It reads the headings from the rendered body, whose ids come from remarkHeadingIds in Markdown.tsx.
// A jump does not change the URL: a new location re-renders the body and would reset open sims.
import { useEffect, useRef, useState, type RefObject } from "react";
import { useSheet } from "./useSheet";

const NARROW = "(max-width: 900px)";   // where base.css shows the bar

/** A heading's visible text: KaTeX also renders a hidden MathML copy of each formula. */
function headingText(h: HTMLElement): string {
  const c = h.cloneNode(true) as HTMLElement;
  c.querySelectorAll(".katex-mathml").forEach((m) => m.remove());
  return (c.textContent ?? "").replace(/\s+/g, " ").trim();
}

interface Part { id: string; title: string; depth: 2 | 3 }

export default function PartsNav({ root, version, title }: { root: RefObject<HTMLElement>; version: unknown; title: string }) {
  const [parts, setParts] = useState<Part[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [narrow, setNarrow] = useState(() => matchMedia(NARROW).matches);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = matchMedia(NARROW);
    const change = () => setNarrow(mq.matches);
    mq.addEventListener("change", change);
    return () => mq.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    const el = root.current;
    setParts(el ? [...el.querySelectorAll<HTMLElement>("h2[id], h3[id]")].map((h) => ({
      id: h.id, title: headingText(h), depth: h.tagName === "H2" ? 2 : 3,
    })) : []);
  }, [root, version]);

  // the current part is the last heading at or above where a jump puts a heading (its scroll margin)
  useEffect(() => {
    if (!parts.length || !narrow) return;
    let raf = 0;
    const first = document.getElementById(parts[0].id);
    const margin = first ? parseFloat(getComputedStyle(first).scrollMarginTop) || 0 : 0;
    const update = () => {
      raf = 0;
      const line = Math.max((bar.current?.getBoundingClientRect().bottom ?? 0) + 8, margin + 2);
      let cur: string | null = null;
      for (const p of parts) {
        const h = document.getElementById(p.id);
        if (h && h.getBoundingClientRect().top <= line) cur = p.id;
        else break;
      }
      setCurrent(cur);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [parts, narrow]);

  useSheet(open, () => setOpen(false));

  if (parts.length < 2) return null;
  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  };
  const here = parts.find((p) => p.id === current);

  return (
    <>
      <div className="parts-bar" ref={bar}>
        <button onClick={() => setOpen(true)} aria-haspopup="dialog">
          <span className="parts-icon" aria-hidden="true">☰</span>
          <span className="parts-current">{here?.title ?? title}</span>
          <span className="parts-caret" aria-hidden="true">▾</span>
        </button>
      </div>
      {open && (
        <>
          <div className="parts-backdrop" onClick={() => setOpen(false)} />
          <div className="parts-sheet" role="dialog" aria-label="Parts of this unit">
            <div className="parts-sheet-head">
              <span>Parts</span>
              <button onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
            <ol>
              {parts.map((p) => (
                <li key={p.id} className={`d${p.depth}${p.id === current ? " current" : ""}`}>
                  <button onClick={() => go(p.id)}>{p.title}</button>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </>
  );
}
