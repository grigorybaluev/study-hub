// What to study next (#222): a unit's status as a dot, a word and its numbers (the course page), and the
// units most worth a session now, each one tap from its deck (the top of Review and its done screen).
import { Link } from "react-router-dom";
import { node, useData } from "../data/load";
import type { CourseNode, UnitNode } from "../data/types";
import { suggestions, type UnitCoverage, type UnitStatus } from "./coverage";
import { scopeQuery } from "./scope";

export const STATUS: Record<UnitStatus, string> = { untaught: "not taught yet", start: "to start", weak: "weak", solid: "solid" };
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** The numbers behind a unit's status, in a few words. */
export function detail(u: UnitCoverage, weeks: number[] = []): string {
  switch (u.status) {
    case "untaught": return weeks.length ? `week ${Math.min(...weeks)}` : "";
    case "start": return `${u.unstarted} of ${u.cards} not started`;
    case "weak": return [u.due && `${u.due} due`, u.recall !== null && `${pct(u.recall)} recall`].filter(Boolean).join(" · ");
    case "solid": return u.recall === null ? "" : `${pct(u.recall)} recall`;
  }
}

/** The one number a chip over the deck has room for. */
function short(u: UnitCoverage): string {
  if (u.status === "start") return `${u.unstarted} new`;
  return u.due ? `${u.due} due` : u.recall === null ? "" : pct(u.recall);
}

const deckOf = (unit: string) => `/review${scopeQuery({ kind: "unit", id: unit })}`;

/** A unit's status on the course page; with cards started or to start, a link to its deck. */
export function UnitTag({ u }: { u: UnitCoverage }) {
  const d = useData();
  const text = detail(u, node<UnitNode>(d, u.unit)?.weeks);
  // each part stays on one line ("83% recall"), the parts wrap between them
  const body = <><i className={`unit-dot s-${u.status}`} aria-hidden="true" /><b>{STATUS[u.status]}</b>
    {text.split(" · ").filter(Boolean).map((p) => <span key={p} className="muted"> ·&nbsp;<span className="part">{p}</span></span>)}</>;
  return u.status === "untaught" ? <span className="unit-tag">{body}</span>
    : <Link className="unit-tag" to={deckOf(u.unit)} title={`Review this unit's ${u.cards} cards`}>{body}</Link>;
}

/** The units most worth a session now. `row`: one line of chips that scrolls sideways (over the deck). */
export default function NextUnits({ units, row = false }: { units: UnitCoverage[]; row?: boolean }) {
  const d = useData();
  const next = suggestions(units);
  if (!next.length) return null;
  const code = (u: UnitCoverage) => node<CourseNode>(d, u.course)?.code ?? u.course;
  const exam = (u: UnitCoverage) => {
    const c = node<CourseNode>(d, u.course), e = u.exam && c?.exams?.[u.exam.index];
    return e ? `; ${e.name} in ${u.exam!.days} day${u.exam!.days === 1 ? "" : "s"}` : "";
  };
  return (
    <nav className={`next-units${row ? " row" : ""}`} aria-label="Units to study next">
      <span className="next-head">Next</span>
      <ul>
        {next.map((u) => {
          const unit = node<UnitNode>(d, u.unit);
          return (
            <li key={u.unit}>
              <Link to={deckOf(u.unit)} title={`${code(u)} · ${unit?.title ?? u.unit}: ${STATUS[u.status]}, ${detail(u)}${exam(u)}`}>
                <i className={`unit-dot s-${u.status}`} aria-hidden="true" />
                {!row && <b>{code(u)}</b>}
                <span className="next-title">{unit?.title ?? u.unit}</span>
                <span className="muted">{row ? short(u) : detail(u)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
