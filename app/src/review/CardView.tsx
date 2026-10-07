// One review card (#194): front, a 3D turn to the back, and a horizontal swipe to grade (left Again,
// right Good) once the back shows. The drag writes transforms straight to the element (no React
// render per pointer move); a swipe or a grade button flies the card off, then reports the grade.
import { memo, useEffect, useRef, type ReactNode } from "react";
import Markdown from "../components/Markdown";
import type { Card } from "../data/types";
import type { Rating } from "./engine";

const COMMIT = 0.28;          // share of the card's width that commits a swipe
const FLICK = 0.5;            // px/ms: a fast flick commits a shorter swipe
const FLY_MS = 220;

export const KIND_LABEL: Record<Card["kind"], string> = {
  definition: "Definition", theorem: "Theorem", lemma: "Lemma", proposition: "Proposition", corollary: "Corollary",
  steps: "Method", caution: "Caution", insight: "Key idea", eq: "Formula",
};

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

interface Props {
  card: Card;
  /** the card under the current one: drawn, typeset and ready, but not interactive */
  peek?: boolean;
  flipped: boolean;
  onFlip(): void;
  /** a finished swipe: 1 (left, Again) or 3 (right, Good) */
  onSwipe(r: Rating): void;
  /** set by a grade button: fly this way, then call onExited */
  exit?: -1 | 1 | null;
  onExited?(): void;
  context: ReactNode;      // under the front: course and unit
  details: ReactNode;      // under the back: part link, concepts, prerequisites
  updated?: boolean;
}

export default function CardView({ card, peek, flipped, onFlip, onSwipe, exit, onExited, context, details, updated }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x0: number; y0: number; t0: number; dx: number; axis: "x" | "y" | null } | null>(null);

  const place = (dx: number, animate: boolean) => {
    const e = el.current;
    if (!e) return;
    const w = e.offsetWidth || 1;
    e.style.transition = animate ? `transform ${FLY_MS}ms ease-out` : "none";
    e.style.transform = dx ? `translateX(${dx}px) rotate(${dx / 24}deg)` : "";
    const ratio = Math.max(-1.5, Math.min(1.5, dx / (w * COMMIT)));
    e.style.setProperty("--swipe", String(ratio));
    e.classList.toggle("armed", Math.abs(ratio) >= 1);
  };

  const fly = (dir: -1 | 1, done: () => void) => {
    if (reducedMotion()) { done(); return; }
    place(dir * (el.current?.offsetWidth ?? 400) * 1.4, true);
    setTimeout(done, FLY_MS);
  };

  // a grade button: fly the way that grade points
  useEffect(() => {
    if (exit && !peek) fly(exit, () => onExited?.());
  }, [exit]);   // only a new exit starts a flight

  // when a peeking card becomes the top card it must start centred
  useEffect(() => { if (!peek) place(0, false); }, [peek]);

  const down = (e: React.PointerEvent) => {
    if (peek || !flipped || e.button !== 0) return;
    drag.current = { x0: e.clientX, y0: e.clientY, t0: e.timeStamp, dx: 0, axis: null };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.axis && Math.hypot(dx, dy) > 8) {
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";      // vertical: the back scrolls, no swipe
      if (d.axis === "x") el.current?.setPointerCapture(e.pointerId);
    }
    if (d.axis === "x") { d.dx = dx; place(dx, false); }
  };
  const up = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.axis !== "x") return;
    const w = el.current?.offsetWidth ?? 400;
    const v = d.dx / Math.max(1, e.timeStamp - d.t0);
    if (Math.abs(d.dx) > w * COMMIT || (Math.abs(v) > FLICK && Math.abs(d.dx) > 40)) {
      const dir = d.dx > 0 ? 1 : -1;
      fly(dir, () => onSwipe(dir > 0 ? 3 : 1));
    } else {
      place(0, true);
    }
  };
  const cancel = () => { if (drag.current) { drag.current = null; place(0, true); } };

  return (
    <div
      ref={el}
      className={`review-card${peek ? " peek" : ""}${flipped ? " flipped" : ""}`}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}
      onClick={() => { if (!peek && !flipped) onFlip(); }}
      aria-hidden={peek || undefined}
    >
      <div className="review-card-inner">
        <Faces card={card} context={context} details={details} updated={updated} />
      </div>
      <div className="swipe-label again" aria-hidden="true">Again</div>
      <div className="swipe-label good" aria-hidden="true">Good</div>
    </div>
  );
}

/** Both faces, rendered once per card: KaTeX and highlighting are not redone while a card is dragged. */
const Faces = memo(function Faces({ card, context, details, updated }: { card: Card; context: ReactNode; details: ReactNode; updated?: boolean }) {
  return (
    <>
      <section className="review-face front">
        <div className={`review-kind k-${card.kind}`}>{KIND_LABEL[card.kind]}</div>
        <div className="review-front prose"><Markdown source={card.front} /></div>
        <div className="review-context">{context}</div>
        <div className="review-hint">Tap to show the answer</div>
      </section>
      <section className="review-face back">
        <div className="review-back-head">
          <span className={`review-kind k-${card.kind}`}>{KIND_LABEL[card.kind]}</span>
          {updated && <span className="review-updated" title="The text changed since you last reviewed this card">updated</span>}
        </div>
        <div className="review-back-front prose"><Markdown source={card.front} /></div>
        <div className="review-back prose"><Markdown source={card.back} /></div>
        <div className="review-details">{details}</div>
      </section>
    </>
  );
}, (a, b) => a.card.id === b.card.id && a.card.hash === b.card.hash && a.updated === b.updated);
