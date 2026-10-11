// What was graded each day, per course (#231): the last 14 review days as bars split by course, each with
// its total written beside it; a tap opens the day's list, by course and unit, each card with its grades.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Markdown from "../components/Markdown";
import { href, node, useData } from "../data/load";
import type { Card, CourseNode, UnitNode } from "../data/types";
import { OTHER, SLOTS, courseColours } from "./colours";
import { activity, dayDetail } from "./days";
import type { Rating, Review } from "./engine";

const GRADE: Record<Rating, { letter: string; name: string }> = {
  1: { letter: "A", name: "Again" }, 2: { letter: "H", name: "Hard" }, 3: { letter: "G", name: "Good" }, 4: { letter: "E", name: "Easy" },
};

export default function Activity({ log, cards }: { log: Review[]; cards: Card[] }) {
  const d = useData();
  const [open, setOpen] = useState<number | null>(null);
  const view = useMemo(() => {
    const { byId, slot, courseOf } = courseColours(cards);
    const days = activity(log, courseOf, Date.now());
    const totals = new Map<string, number>();
    for (const x of days) for (const [c, n] of Object.entries(x.courses)) totals.set(c, (totals.get(c) ?? 0) + n);
    const shown = [...slot.keys(), OTHER].filter((c) => totals.has(c));
    return { byId, slot, courseOf, days, totals, shown, max: Math.max(1, ...days.map((x) => x.total)) };
  }, [log, cards]);

  const code = (c: string) => (c === OTHER ? "Other" : node<CourseNode>(d, c)?.code ?? c);
  const swatch = (c: string) => `activity-s${view.slot.get(c) ?? 0}`;
  const label = (day: number, i: number) => (i === 0 ? "Today" : new Date(day).toLocaleDateString([], { weekday: "short", day: "numeric" }));

  if (!view.shown.length) return <p className="small muted">Nothing graded in the last 14 days.</p>;
  return (
    <div className="activity">
      <ul className="activity-legend" aria-label="Courses, with their grades over these 14 days">
        {view.shown.map((c) => <li key={c}><i className={swatch(c)} /> {code(c)} <span className="muted">{view.totals.get(c)}</span></li>)}
      </ul>
      <ol className="activity-days">
        {view.days.map((x, i) => (
          <li key={x.day}>
            <button className="activity-row" onClick={() => setOpen(open === x.day ? null : x.day)} disabled={!x.total} aria-expanded={open === x.day}
              title={x.total ? view.shown.filter((c) => x.courses[c]).map((c) => `${code(c)} ${x.courses[c]}`).join(" · ") : "nothing graded"}>
              <span className="activity-day">{label(x.day, i)}</span>
              <span className="activity-track">
                <span className="activity-bar" style={{ width: `${(x.total / view.max) * 100}%` }}>
                  {view.shown.filter((c) => x.courses[c]).map((c) => <i key={c} className={swatch(c)} style={{ flexGrow: x.courses[c] }} />)}
                </span>
              </span>
              <span className="activity-total">{x.total || ""}</span>
            </button>
            {open === x.day && <DayList log={log} day={x.day} view={view} code={code} swatch={swatch} />}
          </li>
        ))}
      </ol>
    </div>
  );
}

function DayList({ log, day, view, code, swatch }: {
  log: Review[]; day: number; view: { byId: Map<string, Card>; slot: Map<string, number>; courseOf(id: string): string };
  code(c: string): string; swatch(c: string): string;
}) {
  const d = useData();
  // courses in the legend's order (a stable sort keeps the units of each in the order they were graded)
  const rank = (c: string) => view.slot.get(c) ?? SLOTS + 1;     // "other" last
  const groups = useMemo(() => dayDetail(log, day, (id) => ({ course: view.courseOf(id), unit: view.byId.has(id) ? view.byId.get(id)!.unit ?? "" : null }))
    .sort((a, b) => rank(a.course) - rank(b.course)), [log, day, view]);
  return (
    <div className="activity-detail">
      {groups.map((g) => {
        const unit = g.unit ? node<UnitNode>(d, g.unit) : undefined;
        return (
          <div key={`${g.course} ${g.unit}`}>
            <div className="activity-unit">
              <i className={swatch(g.course)} /> <b>{code(g.course)}</b> · {unit ? <Link to={href.unit(unit.id)}>{unit.title}</Link> : g.unit === null ? "Cards no longer in the deck" : g.unit || "Solution maps"}
              <span className="muted"> · {g.cards.length}</span>
            </div>
            <ul>
              {g.cards.map((c) => (
                <li key={c.card}>
                  <span className="activity-front"><Front card={view.byId.get(c.card)} /></span>
                  <span className="activity-grades">
                    {c.ratings.map((r, k) => <i key={k} className={`g${r}`} title={GRADE[r].name}>{GRADE[r].letter}</i>)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** A card's front in one or two lines; an output quiz's front is code, so it is named instead. */
function Front({ card }: { card: Card | undefined }) {
  if (!card) return <span className="muted">a card no longer in the deck</span>;
  if (card.kind === "output") return <>What does this print? <span className="muted">· {card.part_title ?? "R"}</span></>;
  if (card.kind === "exercise") return <>Exercise <span className="muted">· {card.front.split("\n")[0].replace(/\*\*/g, "")}</span></>;   // the title line
  return <Markdown source={card.front} />;
}
