// A display formula that never scrolls sideways when it can be broken (#89): it tries the
// variants from mathSplit.ts in order and keeps the first that fits the column. It measures again
// when the column width changes and once the KaTeX fonts have loaded.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import { variants } from "./mathSplit";

export default function MathFit({ tex, as = "div" }: { tex: string; as?: "div" | "span" }) {
  const html = useMemo(
    () => variants(tex).map((v) => katex.renderToString(v, { displayMode: true, throwOnError: false })),
    [tex],
  );
  const [k, setK] = useState(0);
  const [pass, setPass] = useState(0);
  const [shownTex, setShownTex] = useState(tex);
  if (shownTex !== tex) { setShownTex(tex); setK(0); }   // a new formula starts from its unbroken form
  const box = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const shown = box.current?.firstElementChild as HTMLElement | null;
    if (!shown) return;
    shown.style.fontSize = "";
    if (shown.scrollWidth <= shown.clientWidth + 1) return;
    if (k < html.length - 1) { setK(k + 1); return; }
    // no break point left: shrink a little (never below 75 %) before letting it scroll
    const scale = Math.max(0.75, shown.clientWidth / shown.scrollWidth);
    shown.style.fontSize = `${scale}em`;
  }, [k, pass, html]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let width = el.clientWidth;
    const again = () => { setK(0); setPass((p) => p + 1); };
    const ro = new ResizeObserver(() => { if (el.clientWidth !== width) { width = el.clientWidth; again(); } });
    ro.observe(el);
    document.fonts?.ready.then(again);
    return () => ro.disconnect();
  }, []);

  // inside a paragraph (a one-line $$…$$) it is a span, laid out as a block
  const Tag = as;
  return <Tag ref={box as never} className="math-fit" dangerouslySetInnerHTML={{ __html: html[k] }} />;
}
