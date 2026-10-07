// /review (#194): the swipe deck. Tap (or Space) shows the answer; then swipe left for Again, right for
// Good, or use the four buttons (keys 1-4), each labelled with when the card comes back. Z undoes.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { href, node, useData } from "../data/load";
import type { Card, ConceptNode, CourseNode, UnitNode } from "../data/types";
import CardView from "../review/CardView";
import type { Rating } from "../review/engine";
import { useDeck } from "../review/useDeck";

const GRADES: { r: Rating; label: string; cls: string }[] = [
  { r: 1, label: "Again", cls: "again" }, { r: 2, label: "Hard", cls: "hard" },
  { r: 3, label: "Good", cls: "good" }, { r: 4, label: "Easy", cls: "easy" },
];

/** Anki-style interval: 1m, 10m, 3h, 4d, 2.1mo, 1.3y. */
export function interval(ms: number): string {
  const m = ms / 60_000, h = m / 60, d = h / 24;
  if (m < 60) return `${Math.max(1, Math.round(m))}m`;
  if (h < 24) return `${Math.round(h)}h`;
  if (d < 30) return `${Math.round(d)}d`;
  if (d < 365) return `${(d / 30).toFixed(1)}mo`;
  return `${(d / 365).toFixed(1)}y`;
}

export default function Review() {
  const deck = useDeck();
  const [flipped, setFlipped] = useState(false);
  // a grade button's flight belongs to the card it was pressed for: the next card must never inherit it
  const [exit, setExit] = useState<{ card: string; dir: -1 | 1; r: Rating } | null>(null);
  const currentId = deck.current?.id;

  useEffect(() => { setFlipped(false); setExit(null); }, [currentId]);

  const press = useCallback((r: Rating) => {
    if (!flipped || exit || !currentId) return;
    setExit({ card: currentId, dir: r <= 2 ? -1 : 1, r });     // Again and Hard fly left, Good and Easy right
  }, [flipped, exit, currentId]);

  // grade and clear in one update, so the card that comes up next renders unflipped and without a flight
  const finish = useCallback((r: Rating) => {
    setExit(null);
    setFlipped(false);
    deck.grade(r);
  }, [deck]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey || (!e.altKey && !e.shiftKey))) {
        e.preventDefault(); deck.undo(); return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!flipped && (e.key === " " || e.key === "Enter")) { e.preventDefault(); setFlipped(true); return; }
      if (flipped && "1234".includes(e.key) && e.key.length === 1) { e.preventDefault(); press(Number(e.key) as Rating); }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [flipped, press, deck]);

  if (deck.status === "loading") return <div className="deck"><p className="muted">Loading the deck…</p></div>;
  if (deck.status === "error") return <div className="deck"><p>Could not load the cards: {deck.error}</p></div>;

  const now = Date.now();
  const stack = [deck.current, deck.next].filter((c): c is Card => !!c);

  return (
    <div className="deck">
      <div className="deck-head">
        <h1>Review</h1>
        <span className="deck-counts" title="due reviews · new cards left today · graded today">
          <b className="c-due">{deck.left.due}</b> due · <b className="c-new">{deck.left.fresh}</b> new · {deck.doneToday} done
        </span>
        <button className="deck-undo" onClick={deck.undo} disabled={!deck.canUndo} title="Undo the last grade (Z)">↶ Undo</button>
      </div>
      {!deck.persistent && (
        <p className="deck-warn">This browser does not keep data for this site, so today's grades will be lost when the page closes.</p>
      )}

      <div className="deck-stack">
        {stack.length ? stack.map((c) => {
          const top = c.id === deck.current?.id;
          return (
            <CardView
              key={c.id} card={c} peek={!top}
              flipped={top && flipped} onFlip={() => setFlipped(true)}
              onSwipe={finish}
              exit={top && exit?.card === c.id ? exit.dir : null} onExited={() => exit && finish(exit.r)}
              updated={top && deck.updated}
              context={<CardContext card={c} />} details={<CardDetails card={c} />}
            />
          );
        }) : <DeckDone laterAt={deck.laterAt} done={deck.doneToday} />}
      </div>

      {deck.current && (
        <div className="deck-actions">
          {!flipped ? (
            <button className="deck-show" onClick={() => setFlipped(true)}>Show answer</button>
          ) : (
            <div className="deck-grades">
              {GRADES.map((g) => (
                <button key={g.r} className={`grade ${g.cls}`} onClick={() => press(g.r)} disabled={!!exit}>
                  <span className="grade-label">{g.label}</span>
                  <span className="grade-ivl">{deck.preview ? interval(deck.preview[g.r] - now) : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CardContext({ card }: { card: Card }) {
  const d = useData();
  const course = node<CourseNode>(d, card.course);
  const unit = node<UnitNode>(d, card.unit);
  return <>{course?.code ?? card.course} · {unit?.title ?? card.unit}</>;
}

/** Under the answer: where it is taught, what it is about, and what it builds on. */
function CardDetails({ card }: { card: Card }) {
  const d = useData();
  const course = node<CourseNode>(d, card.course);
  const unit = node<UnitNode>(d, card.unit);
  const concepts = card.concepts.map((id) => node<ConceptNode>(d, id)).filter((c): c is ConceptNode => !!c);
  const own = new Set(card.concepts);
  const builds = [...new Set(d.derived.concept_depends_on
    .filter((e) => own.has(e.from) && e.strength === "hard" && !own.has(e.to)).map((e) => e.to))]
    .map((id) => node<ConceptNode>(d, id)).filter((c): c is ConceptNode => !!c).slice(0, 5);
  const to = href.unit(card.unit) + (card.part ? `?part=${encodeURIComponent(card.part)}` : "");
  return (
    <>
      <Link className="review-where" to={to} onClick={(e) => e.stopPropagation()}>
        {course?.code} › {unit?.title}{card.part_title ? ` › ${card.part_title}` : ""} <span aria-hidden="true">→</span>
      </Link>
      {concepts.map((c) => (
        <div key={c.id} className="review-concept">
          <Link className="chip dom" style={{ ["--dom" as string]: `var(--dom-${c.domain.replace(".", "-")})` }} to={href.concept(c.id)}>{c.title}</Link>
          <span className="small muted"> {c.body}</span>
        </div>
      ))}
      {builds.length > 0 && (
        <div className="review-builds small muted">
          Builds on: {builds.map((c) => <Link key={c.id} className="chip" to={href.concept(c.id)}>{c.title}</Link>)}
        </div>
      )}
    </>
  );
}

function DeckDone({ laterAt, done }: { laterAt: number | null; done: number }) {
  const at = laterAt ? new Date(laterAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
  return (
    <div className="deck-done">
      <h2>{done ? "Done for now" : "Nothing to review yet"}</h2>
      <p className="muted">
        {at ? `The next card in its learning steps comes back at ${at}.` : done ? `${done} cards graded today. Come back tomorrow.` : "No cards are due."}
      </p>
    </div>
  );
}
