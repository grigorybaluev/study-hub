// /review (#194): the swipe deck. Tap (or Space) shows the answer; then swipe left for Again, right for
// Good, or use the four buttons (keys 1-4), each labelled with when the card comes back. Z undoes.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ConceptChip } from "../components/Chips";
import { href, node, useData } from "../data/load";
import type { Card, ConceptNode, CourseNode, UnitNode } from "../data/types";
import CardView, { isRight } from "../review/CardView";
import SyncPanel from "../review/SyncPanel";
import { dayStart, type Rating } from "../review/engine";
import { haptic, motionOn, tick } from "../review/feedback";
import { TIER_NAME, quarterCrossed, type GradeReward } from "../review/rewards";
import { useDeck, type Deck, type Shape } from "../review/useDeck";
import { examDaily, examPlans, upcoming, weakAt, type ExamPlan } from "../review/term";
import { ALL, inScope, parseScope, scopeCards, scopeQuery, type Scope } from "../review/scope";
import { scopes, type Scopes } from "../review/scopeContext";
import { useSheet } from "../components/useSheet";

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
  // the scope of the session (#197): all cards, a course or term (exam prep), a unit, a concept, an area
  const d = useData();
  const [params] = useSearchParams();
  const scope = parseScope(params);
  const key = scopeQuery(scope);
  const sc = useMemo(() => scopes(d), [d]);
  const select = useMemo(() => {
    const weight = scope.kind === "course" || scope.kind === "term" ? sc.weight(sc.courses(scope)) : undefined;
    return (cards: Card[]) => scopeCards(cards, scope, sc, weight);
  }, [key, sc]);   // the scope is the query string: recomputed when it changes
  // exam plans (#221): the daily deck and an exam's deck bring each exam's new cards in early
  const shape = useMemo<Shape | undefined>(() => {
    if (scope.kind !== "all" && scope.kind !== "exam") return undefined;
    const exams = scope.kind === "exam" ? sc.exams.filter((e) => e.course === scope.course && e.index === scope.index) : sc.exams;
    return (pool, engine, now) => {
      const plans = examPlans({ cards: pool, exams, unitWeeks: sc.unitWeeks, firstSeen: (id) => engine.firstSeen(id), now });
      const r = examDaily(pool, plans, (c) => sc.isTaught(c, now), (id) => engine.seen(id));
      // an exam's deck: what its plan still needs today; the daily deck: that or the setting, whichever is more
      const setting = Math.max(0, engine.settings.newPerDay - engine.today(now).newToday);
      if (scope.kind !== "exam") return { cards: r.cards, plans, newLeft: Math.max(setting, r.newLeft) };
      // an exam's deck also serves, weakest first, the cards FSRS expects to be forgotten by its morning
      const early = plans[0] ? weakAt(plans[0].cards, plans[0].date, (id, t) => engine.recallAt(id, t), (id) => engine.seen(id)) : [];
      return { cards: r.cards, plans, newLeft: r.newLeft, early };
    };
  }, [key, sc]);
  const deck = useDeck(select, shape);
  const [picking, setPicking] = useState(false);
  const closePicker = useCallback(() => setPicking(false), []);
  const [flipped, setFlipped] = useState(false);
  // a grade button's flight belongs to the card it was pressed for: the next card must never inherit it
  const [exit, setExit] = useState<{ card: string; dir: -1 | 1; r: Rating } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);     // a method quiz's option (#196)
  // rewards (#195): a +1 per grade, a pulse at each quarter of the day, and the moments a card earns
  const [bursts, setBursts] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [moment, setMoment] = useState<{ id: number; reward: GradeReward } | null>(null);
  const prevDone = useRef<number | null>(null);         // null until the deck has loaded: no pulse on opening
  const currentId = deck.current?.id;

  useEffect(() => { setFlipped(false); setExit(null); setChosen(null); }, [currentId, deck.showing]);
  const choose = useCallback((i: number) => { if (!flipped) { setChosen(i); setFlipped(true); } }, [flipped]);
  // the grade a choice suggests: Good when right, Again when not (the buttons and swipes still decide)
  const suggested: Rating | null = chosen === null || !deck.current?.options ? null : isRight(deck.current, chosen) ? 3 : 1;

  // the update toast moves to the top while the deck is open, off the grade buttons
  useEffect(() => {
    document.documentElement.classList.add("deck-open");
    return () => document.documentElement.classList.remove("deck-open");
  }, []);

  const press = useCallback((r: Rating) => {
    if (!flipped || exit || !currentId) return;
    setExit({ card: currentId, dir: r <= 2 ? -1 : 1, r });     // Again and Hard fly left, Good and Easy right
  }, [flipped, exit, currentId]);

  const undo = useCallback(() => { if (!exit) deck.undo(); }, [exit, deck]);   // not while a card flies

  // grade and clear in one update, so the card that comes up next renders unflipped and without a flight
  const finish = useCallback((r: Rating) => {
    setExit(null);
    setFlipped(false);
    const reward = deck.grade(r);
    if (!reward) return;
    haptic();
    tick(reward.levelUp || reward.comeback ? 990 : 660);
    setBursts((n) => n + 1);
    if (reward.levelUp || reward.comeback) setMoment({ id: Date.now(), reward });
  }, [deck]);

  // the day's ring pulses as it passes a quarter
  const total = deck.doneHere + deck.left.due + deck.left.fresh;
  useEffect(() => {
    if (deck.status !== "ready") return;
    const prev = prevDone.current;
    prevDone.current = deck.doneHere;
    if (prev !== null && prev < deck.doneHere && quarterCrossed(prev, deck.doneHere, total)) setPulse((n) => n + 1);
  }, [deck.status, deck.doneHere, total]);

  useEffect(() => {
    if (!moment) return;
    const t = setTimeout(() => setMoment(null), 1600);
    return () => clearTimeout(t);
  }, [moment]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.repeat || syncing || picking || (e.target as HTMLElement)?.closest("input, textarea, select, a, button, [contenteditable]")) return;
      if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey || (!e.altKey && !e.shiftKey))) {
        e.preventDefault(); undo(); return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = deck.current?.options?.length ?? 0;
      if (!flipped && n && /^[1-9]$/.test(e.key) && Number(e.key) <= n) { e.preventDefault(); choose(Number(e.key) - 1); return; }
      if (!flipped && (e.key === " " || e.key === "Enter")) { e.preventDefault(); setFlipped(true); return; }
      if (flipped && "1234".includes(e.key) && e.key.length === 1) { e.preventDefault(); press(Number(e.key) as Rating); }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [flipped, press, undo, syncing, picking, choose, deck]);

  if (deck.status === "loading") return <div className="deck"><p className="muted">Loading the deck…</p></div>;
  if (deck.status === "error") return <div className="deck"><p>Could not load the cards: {deck.error}</p></div>;

  const now = Date.now();
  const stack = [deck.current, deck.next].filter((c): c is Card => !!c);

  return (
    <div className="deck">
      <div className="deck-head">
        <h1>Review</h1>
        <Link to="/review/stats" className="deck-ring-link" title="Streak and stats"><Ring done={deck.doneHere} total={total} pulse={pulse} bursts={bursts} /></Link>
        <span className="deck-counts" title="due reviews · new cards left today · graded today">
          <b className="c-due">{deck.left.due}</b> due · <b className="c-new">{deck.left.fresh}</b> new<span className="c-done"> · {deck.doneToday} done</span>
        </span>
        <button className="deck-undo" onClick={undo} disabled={!deck.canUndo || !!exit} title="Undo the last grade (Z)" aria-label="Undo">↶<span className="lbl"> Undo</span></button>
        <button className={`deck-undo${deck.sync?.remind ? " remind" : ""}`} onClick={() => setSyncing(true)} title="Move progress to or from another device" aria-label="Sync">⇅<span className="lbl"> Sync</span></button>
      </div>
      <div className="deck-scope-row">
        <button className="deck-scope" onClick={() => setPicking(true)} disabled={!!exit} title="Choose what to review">{sc.label(scope)} <span aria-hidden="true">▾</span></button>
        {scope.kind !== "all" && <Link className="small" to="/review" onClick={(e) => { if (exit) e.preventDefault(); }}>all cards</Link>}
      </div>
      {scope.kind === "all" && deck.plans.length > 0 && <ExamStrip plans={deck.plans} />}
      {picking && <ScopePicker deck={deck} sc={sc} current={scope} onClose={closePicker} />}
      {deck.sync?.remind && (
        <p className="deck-warn">{deck.sync.since} reviews on this device have not been sent to your other device for over 3 days. <button className="linkish" onClick={() => setSyncing(true)}>Sync now</button></p>
      )}
      {syncing && <SyncPanel deck={deck} onClose={() => setSyncing(false)} />}
      {!deck.persistent && (
        <p className="deck-warn">This browser does not keep data for this site, so these grades last only until the page is closed.</p>
      )}

      <div className="deck-stack">
        {moment && <Moment key={moment.id} reward={moment.reward} />}
        {stack.length ? stack.map((c) => {
          const top = c.id === deck.current?.id;
          return (
            <CardView
              key={c.id} card={c} peek={!top}
              flipped={top && flipped} onFlip={() => setFlipped(true)}
              onSwipe={press}
              exit={top && exit?.card === c.id ? exit.dir : null} onExited={() => exit && finish(exit.r)}
              showing={deck.showing}
              updated={top && deck.updated}
              chosen={top ? chosen : null} onChoose={choose}
              context={<CardContext card={c} />} details={<CardDetails card={c} />}
            />
          );
        }) : <DeckDone deck={deck} daily={scope.kind === "all"} />}
      </div>

      {deck.current && (
        <div className="deck-actions">
          {!flipped ? (
            <button className="deck-show" onClick={() => setFlipped(true)}>Show answer</button>
          ) : (
            <div className="deck-grades">
              {GRADES.map((g) => (
                <button key={g.r} className={`grade ${g.cls}${suggested === g.r ? " suggested" : ""}`} onClick={() => press(g.r)} disabled={!!exit}>
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
  const where = card.unit ? unit?.title ?? card.unit : card.part_title ?? "Solution maps";   // a gallery quiz names its method graph
  return <>{course?.code ?? card.course} · {where}</>;
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
  const to = card.link ?? href.unit(card.unit) + (card.part ? `?part=${encodeURIComponent(card.part)}` : "");
  return (
    <>
      <Link className="review-where" to={to} onClick={(e) => e.stopPropagation()}>
        {course?.code} › {card.unit ? unit?.title ?? card.unit : "Solution maps"}{card.part_title ? ` › ${card.part_title}` : ""} <span aria-hidden="true">→</span>
      </Link>
      {concepts.map((c) => (
        <div key={c.id} className="review-concept">
          <ConceptChip id={c.id} />
          <span className="small muted"> {c.body}</span>
        </div>
      ))}
      {builds.length > 0 && (
        <div className="review-builds small muted">
          Builds on: {builds.map((c) => <ConceptChip key={c.id} id={c.id} />)}
        </div>
      )}
    </>
  );
}

/** Choose what to review: everything, a course or a term (exam prep), or a roadmap area across courses
 *  (interview prep); each with how many cards it holds. Units and concepts start from their pages. */
function ScopePicker({ deck, sc, current, onClose }: { deck: Deck; sc: Scopes; current: Scope; onClose(): void }) {
  const nav = useNavigate();
  const d = useData();
  const count = (s: Scope) => deck.cards.filter((c) => inScope(c, s, sc)).length;
  const go = (s: Scope) => { onClose(); nav(`/review${scopeQuery(s)}`, { replace: true }); };
  useSheet(true, onClose);
  const courseIds = [...new Set(deck.cards.map((c) => c.course))].filter((id) => d.courses.some((x) => x.id === id));
  const ahead = upcoming(sc.exams, Date.now());
  const row = (s: Scope, label: string, n = count(s)) => n > 0 && (
    <li key={scopeQuery(s) || "all"}><button className={scopeQuery(s) === scopeQuery(current) ? "current" : ""} onClick={() => go(s)}>
      <span>{label}</span><span className="small muted">{n} card{n === 1 ? "" : "s"}</span>
    </button></li>
  );
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet scope-sheet" role="dialog" aria-label="What to review">
        <div className="sheet-head"><span>What to review</span><button onClick={onClose} aria-label="Close">✕</button></div>
        <div className="scope-body">
          <ul>{row(ALL, "Everything due, every course (daily review)")}</ul>
          {ahead.length > 0 && <><h4>Exams ahead</h4>
            <ul>{ahead.map((e) => row({ kind: "exam", course: e.course, index: e.index }, sc.label({ kind: "exam", course: e.course, index: e.index })))}</ul></>}
          <h4>Exam prep: a course</h4>
          <ul>{courseIds.map((id) => row({ kind: "course", id }, sc.label({ kind: "course", id })))}</ul>
          <h4>Exam prep: a term</h4>
          <ul>{sc.terms.map((t) => row({ kind: "term", index: t.index }, t.label))}</ul>
          <h4>Interview prep: a topic across courses</h4>
          <ul>{sc.areas.map((a) => row({ kind: "area", id: a.id }, a.title))}</ul>
          <p className="small muted">A unit or a concept: start from its page (“Review this unit”). New cards in exam prep come first when the course's later units rely on their concepts most.</p>
        </div>
      </div>
    </>
  );
}

/** The exams ahead (#221): days left, how many of each exam's cards are started, and today's new ones;
 *  a tap opens that exam's deck. */
function ExamStrip({ plans }: { plans: ExamPlan[] }) {
  const d = useData();
  return (
    <div className="exam-strip" role="list">
      {plans.map((p) => {
        const started = p.cards.length - p.fresh.length + p.startedToday, left = Math.max(0, p.perDay - p.startedToday);
        const code = node<CourseNode>(d, p.course)?.code ?? p.course;
        return (
          <Link key={`${p.course}:${p.index}`} role="listitem" className={`exam-pill${p.days <= 3 ? " soon" : ""}`}
            to={`/review${scopeQuery({ kind: "exam", course: p.course, index: p.index })}`}
            title={`${p.name}: ${started} of ${p.cards.length} cards started; ${left} new today`}>
            <span className="exam-pill-head"><b>{code}</b> {p.days === 0 ? "today" : `${p.days}d`}</span>
            <span className="exam-pill-sub">{left ? `${left} new today` : started >= p.cards.length ? "all started" : "done today"}</span>
            <span className="exam-pill-bar" style={{ ["--p" as string]: p.cards.length ? started / p.cards.length : 1 }} />
          </Link>
        );
      })}
    </div>
  );
}

/** The day's progress as a ring that fills as cards are graded; a +1 floats up from it on every grade. */
function Ring({ done, total, pulse, bursts }: { done: number; total: number; pulse: number; bursts: number }) {
  const r = 11, c = 2 * Math.PI * r, share = total ? done / total : 0;
  return (
    <span className="deck-ring" key={`p${pulse}`} data-pulse={pulse > 0 || undefined} title={`${done} of ${total} today`}>
      <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
        <circle cx="14" cy="14" r={r} className="ring-track" />
        <circle cx="14" cy="14" r={r} className="ring-fill" strokeDasharray={`${c * share} ${c}`} />
      </svg>
      {bursts > 0 && motionOn() && <span key={bursts} className="deck-burst" aria-hidden="true">+1</span>}
    </span>
  );
}

/** A level-up or a comeback, over the deck for a moment. */
function Moment({ reward }: { reward: GradeReward }) {
  return (
    <div className={`deck-moment${reward.levelUp ? ` tier-${reward.levelUp}` : " comeback"}`} role="status">
      {reward.levelUp ? <>↑ {TIER_NAME[reward.levelUp]}</> : <>Comeback</>}
      <span className="small">{reward.levelUp ? "this card's memory lasts longer now" : "forgotten once, remembered now"}</span>
    </div>
  );
}

const CONFETTI_KEY = "study-hub-confetti";

/** Nothing left to review now: the day's numbers, once a day with confetti, and the offer of five more. */
/** `daily`: the whole deck (only clearing it counts for the streak, with confetti); else a scope is done. */
function DeckDone({ deck, daily }: { deck: Deck; daily: boolean }) {
  const { day, tally, laterAt } = deck;
  const at = laterAt ? new Date(laterAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
  // confetti once a day, for the deck really cleared (no learning step still to come back)
  const cleared = daily && day.graded > 0 && !laterAt;
  const [confetti, setConfetti] = useState(false);
  useEffect(() => { if (cleared) deck.markCleared(); }, [cleared]);   // a cleared deck counts for the streak
  useEffect(() => {
    if (!cleared || !motionOn()) return;
    const today = String(dayStart(Date.now()));
    try { if (localStorage.getItem(CONFETTI_KEY) === today) return; localStorage.setItem(CONFETTI_KEY, today); } catch { /* shown anyway */ }
    setConfetti(true);
  }, [cleared]);
  if (!day.graded) {
    return (
      <div className="deck-done">
        <h2>Nothing to review yet</h2>
        <p className="muted">{at ? `The next card in its learning steps comes back at ${at}.` : "No cards are due."}</p>
      </div>
    );
  }
  const minutes = Math.max(1, Math.round(day.ms / 60_000));
  return (
    <div className="deck-done">
      {confetti && <Confetti />}
      <h2>{at ? "Done for now" : daily ? "Deck cleared" : "This part is done for now"}</h2>
      <dl className="deck-numbers">
        <div><dt>cards</dt><dd>{day.graded}</dd></div>
        <div><dt>minutes</dt><dd>{minutes}</dd></div>
        {day.reviewed > 0 && <div><dt>recalled</dt><dd>{Math.round((100 * day.recalled) / day.reviewed)}%</dd></div>}
        {tally.levelUps > 0 && <div><dt>level-ups</dt><dd>{tally.levelUps}</dd></div>}
        {tally.comebacks > 0 && <div><dt>comebacks</dt><dd>{tally.comebacks}</dd></div>}
      </dl>
      {deck.streak && deck.streak.current > 0 && (
        <p className="deck-streak">
          <b>{deck.streak.current}</b> day{deck.streak.current === 1 ? "" : "s"} in a row
          {deck.streak.freezes > 0 && <span className="muted"> · {deck.streak.freezes} freeze{deck.streak.freezes === 1 ? "" : "s"} held</span>}
        </p>
      )}
      <p className="muted">
        {at ? `The next card in its learning steps comes back at ${at}. ` : ""}
        {deck.tomorrow ? `Tomorrow: ${deck.tomorrow} card${deck.tomorrow === 1 ? "" : "s"} due.` : "Nothing due tomorrow yet."}
      </p>
      <Link to="/review/stats" className="small">Streak, calendar and stats →</Link>
      {deck.canExtend && <button className="deck-more" onClick={deck.extendNew}>5 more new cards</button>}
    </div>
  );
}

function Confetti() {
  const bits = Array.from({ length: 36 }, (_, i) => i);
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((i) => <i key={i} style={{
        ["--x" as string]: `${(i * 37) % 100}%`, ["--d" as string]: `${((i * 7) % 11) * 0.06}s`, ["--h" as string]: `${(i * 47) % 360}`,
        ["--t" as string]: `${1.4 + ((i * 13) % 7) * 0.12}s`, ["--dx" as string]: `${((i * 29) % 41) - 20}vw`,
      }} />)}
    </div>
  );
}

