// Where each course stands (#231): one row per course — taught cards seen, cards behind (overdue reviews
// plus taught cards not started), recall now, and the next exam's readiness. On the deck it closes to one
// line; the stats page shows it open.
import { useState } from "react";
import { Link } from "react-router-dom";
import { href, node, useData } from "../data/load";
import type { Card, CourseNode } from "../data/types";
import { coverage } from "./coverage";
import type { Engine } from "./engine";
import { scopeQuery } from "./scope";
import type { Scopes } from "./scopeContext";
import { standing, summary, type CourseStanding, type StandingInput } from "./standing";
import type { ExamPlan } from "./term";
import type { StandingOf } from "./useDeck";

const OPEN_KEY = "review-standing-open";
const pct = (x: number | null) => (x === null ? "–" : `${Math.round(x * 100)}%`);
const day = (t: number) => new Date(t).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
const inDays = (n: number) => (n === 0 ? "today" : `${n}d`);

/** What the standing of courses and units reads: the graph's exams and term calendars, and the engine. */
export function standingInput(sc: Scopes, cards: Card[], engine: Engine, now: number): StandingInput {
  return {
    cards, exams: sc.exams, isTaught: (c) => sc.isTaught(c, now), unitWeeks: sc.unitWeeks,
    due: (id) => engine.state(id)?.due, recallAt: (id, t) => engine.recallAt(id, t), now,
  };
}

/** The standing of every course (#231) and, with `units`, every unit (#222). */
export function standingFor(sc: Scopes, units = true): StandingOf {
  return (cards, engine, now) => {
    const i = standingInput(sc, cards, engine, now);
    return { courses: standing(i), units: units ? coverage({ ...i, target: engine.settings.retention }) : [] };
  };
}

/** `plans` (the daily deck's) add each exam's new cards for today; `closable` starts it as one line. */
export default function StandingPanel({ rows, plans = [], closable = false }: { rows: CourseStanding[]; plans?: ExamPlan[]; closable?: boolean }) {
  const d = useData();
  const [open, setOpen] = useState(() => { try { return localStorage.getItem(OPEN_KEY) === "1"; } catch { return false; } });
  if (!rows.length) return null;
  const code = (id: string) => node<CourseNode>(d, id)?.code ?? id;
  const s = summary(rows);
  const toggle = () => {
    setOpen(!open);
    try { localStorage.setItem(OPEN_KEY, open ? "0" : "1"); } catch { /* the panel just starts closed */ }
  };
  const shown = !closable || open;
  return (
    <div className={`standing${closable ? " closable" : ""}`}>
      {closable && (
        <button className="standing-line" onClick={toggle} aria-expanded={open}>
          {s.behind ? <span className="standing-behind" title={`in ${s.courses} course${s.courses === 1 ? "" : "s"}`}><b>{s.behind}</b> behind</span>
            : <span className="standing-ok">On track</span>}
          {s.next?.exam && <span className="muted"> · {code(s.next.course)} {inDays(s.next.exam.days)}{s.next.exam.ready !== null && ` · ${pct(s.next.exam.ready)} ready`}</span>}
          <span className="standing-caret" aria-hidden="true">{open ? "▴" : "▾"}</span>
        </button>
      )}
      {shown && (
        <div className="standing-table" role="table" aria-label="Where each course stands">
          <div className="standing-row standing-head" role="row">
            <span role="columnheader">course</span>
            <span role="columnheader" title="taught cards graded at least once">seen</span>
            <span role="columnheader" title="reviews overdue from an earlier day, plus taught cards not started">behind</span>
            <span role="columnheader" title="the chance of recalling a seen card now, on average">recall</span>
            <span role="columnheader" title="days to the next exam, and the share of its cards you would recall on its morning if you stopped reviewing now">exam</span>
          </div>
          {rows.map((r) => {
            const plan = r.exam && plans.find((p) => p.course === r.course && p.index === r.exam!.index);
            const newToday = plan ? Math.max(0, plan.perDay - plan.startedToday) : 0;
            const allStarted = !!plan && plan.cards.length - plan.fresh.length + plan.startedToday >= plan.cards.length;
            return (
              <div key={r.course} className="standing-row" role="row">
                <Link role="cell" className="standing-course" to={href.course(r.course)} title={`${code(r.course)}, unit by unit`}>{code(r.course)}</Link>
                <span role="cell" className="standing-seen" title={`${r.seen} of ${r.taught} taught cards seen`}>
                  <span className="standing-bar" style={{ ["--p" as string]: r.taught ? r.seen / r.taught : 1 }} />
                  <span>{r.seen}/{r.taught}</span>
                </span>
                {r.behind ? <Link role="cell" className="standing-behind" to={`/review${scopeQuery({ kind: "course", id: r.course })}`}
                  title={`${r.overdue} overdue, ${r.unstarted} not started: review ${code(r.course)}`}>{r.behind}</Link>
                  : <span role="cell" className="standing-ok" title="nothing overdue, every taught card started">✓</span>}
                <span role="cell">{pct(r.recall)}</span>
                {r.exam ? (
                  <Link role="cell" className={`standing-exam${r.exam.days <= 3 ? " soon" : ""}`} to={`/review${scopeQuery({ kind: "exam", course: r.course, index: r.exam.index })}`}
                    title={`${r.exam.name}, ${day(r.exam.date)}: ${r.exam.ready === null ? "no cards in its weeks" : `about ${Math.round(r.exam.ready * r.exam.cards)} of its ${r.exam.cards} cards recalled if you stopped now`}`}>
                    <span>{inDays(r.exam.days)} · {pct(r.exam.ready)}</span>
                    {plan && <span className="standing-sub">{newToday ? `${newToday} new today` : allStarted ? "all started" : "done today"}</span>}
                  </Link>
                ) : <span role="cell" className="muted">–</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
