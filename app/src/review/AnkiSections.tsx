// The stats page in Anki's structure (#225): today, the future-due forecast, card counts, true retention
// (overall and per course) and the answer buttons, each number as Anki computes it (ankiStats.ts).
import { useMemo } from "react";
import { node, useData } from "../data/load";
import type { Card, CourseNode } from "../data/types";
import { OTHER, courseColours } from "./Activity";
import { MATURE_DAYS, buttons, counts, forecast, today, trueRetention, type ButtonGroup, type Counts, type Pass } from "./ankiStats";
import type { Engine, Rating } from "./engine";

const pct = (p: Pass) => (p.total ? `${Math.round((100 * p.passed) / p.total)}%` : "–");
const COUNT_NAMES: [keyof Counts, string][] = [["new", "New"], ["learning", "Learning"], ["relearning", "Relearning"], ["young", "Young"], ["mature", "Mature"]];
const GROUP_NAMES: [ButtonGroup, string][] = [["learning", "Learning"], ["young", "Young"], ["mature", "Mature"]];
const BUTTON_NAMES: [Rating, string][] = [[1, "Again"], [2, "Hard"], [3, "Good"], [4, "Easy"]];

export default function AnkiSections({ engine, cards }: { engine: Engine; cards: Card[] }) {
  const d = useData();
  const v = useMemo(() => {
    const now = Date.now(), log = engine.revlog(), ids = cards.map((c) => c.id), state = (id: string) => engine.state(id);
    const colours = courseColours(cards);
    const courses = [...colours.slot.keys()];
    const due = forecast(ids, state, colours.courseOf, now);
    return {
      today: today(log, now), counts: counts(ids, state), due, colours,
      dueMax: Math.max(1, ...due.map((x) => x.total)),
      retention: trueRetention(log, now),
      perCourse: courses.map((c) => ({ course: c, row: trueRetention(log, now, (id) => colours.courseOf(id) === c)[3] }))   // last month
        .filter((x) => x.row.all.total),
      buttons: buttons(log, now),
    };
  }, [engine, cards, engine.log.length]);     // eslint-disable-line react-hooks/exhaustive-deps -- the log grows in place

  const code = (c: string) => (c === OTHER ? "Other" : node<CourseNode>(d, c)?.code ?? c);
  const swatch = (c: string) => `activity-s${v.colours.slot.get(c) ?? 0}`;
  const t = v.today, minutes = Math.round(t.ms / 60_000);
  const dayName = (day: number, i: number) => (i === 0 ? "Today" : i === 1 ? "Tomorrow" : new Date(day).toLocaleDateString([], { weekday: "short", day: "numeric" }));
  const total = COUNT_NAMES.reduce((n, [k]) => n + v.counts[k], 0);

  return (
    <>
      <section className="anki">
        <h2>Today</h2>
        {t.graded ? (
          <ul className="anki-today">
            <li>Studied <b>{t.graded}</b> card{t.graded === 1 ? "" : "s"} in <b>{minutes}</b> minute{minutes === 1 ? "" : "s"} today ({Math.round(t.ms / 1000 / t.graded)}s/card)</li>
            <li>Again count: <b>{t.again}</b> ({Math.round((100 * (t.graded - t.again)) / t.graded)}% correct)</li>
            <li>Learn: <b>{t.learn}</b>, Review: <b>{t.review}</b>, Relearn: <b>{t.relearn}</b></li>
            <li>{t.mature.total ? <>Correct answers to mature cards: <b>{t.mature.correct}/{t.mature.total}</b> ({Math.round((100 * t.mature.correct) / t.mature.total)}%)</> : "No mature cards were studied today."}</li>
          </ul>
        ) : <p className="muted small">No cards have been studied today.</p>}
      </section>

      <section className="anki">
        <h2>Future due</h2>
        <div className="activity">
          <ul className="activity-legend" aria-label="Courses, with their cards due over these 14 days">
            {[...v.colours.slot.keys(), OTHER].map((c) => [c, v.due.reduce((n, x) => n + (x.courses[c] ?? 0), 0)] as const).filter(([, n]) => n)
              .map(([c, n]) => <li key={c}><i className={swatch(c)} /> {code(c)} <span className="muted">{n}</span></li>)}
          </ul>
          <ol className="activity-days">
            {v.due.map((x, i) => (
              <li key={x.day}>
                <div className="activity-row" title={x.total ? Object.entries(x.courses).map(([c, n]) => `${code(c)} ${n}`).join(" · ") : "nothing due"}>
                  <span className="activity-day">{dayName(x.day, i)}</span>
                  <span className="activity-track">
                    <span className="activity-bar" style={{ width: `${(x.total / v.dueMax) * 100}%` }}>
                      {Object.entries(x.courses).sort(([a], [b]) => (v.colours.slot.get(a) ?? 99) - (v.colours.slot.get(b) ?? 99))
                        .map(([c, n]) => <i key={c} className={swatch(c)} style={{ flexGrow: n }} />)}
                    </span>
                  </span>
                  <span className="activity-total">{x.total || ""}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="small muted">Cards due on each review day, by course; today includes what is overdue and
          the learning steps still to come. Due tomorrow: {v.due[1]?.total ?? 0}.</p>
      </section>

      <section className="anki">
        <h2>Card counts</h2>
        <div className="anki-counts" role="img" aria-label={COUNT_NAMES.map(([k, n]) => `${n} ${v.counts[k]}`).join(", ")}>
          {COUNT_NAMES.filter(([k]) => v.counts[k]).map(([k]) => <i key={k} className={`c-${k}`} style={{ flexGrow: v.counts[k] }} />)}
        </div>
        <ul className="anki-legend small">
          {COUNT_NAMES.map(([k, n]) => (
            <li key={k}><i className={`c-${k}`} /> {n} <b>{v.counts[k]}</b> <span className="muted">{total ? `${Math.round((100 * v.counts[k]) / total)}%` : ""}</span></li>
          ))}
        </ul>
        <p className="small muted">Young: in review with an interval under {MATURE_DAYS} days; mature: {MATURE_DAYS} days or more.</p>
      </section>

      <section className="anki">
        <h2>True retention</h2>
        <RetentionTable rows={v.retention.map((r) => ({ key: r.label, label: r.label, r }))} head="" />
        {v.perCourse.length > 0 && <>
          <h3 className="anki-sub">By course, last month</h3>
          <RetentionTable rows={v.perCourse.map((x) => ({ key: x.course, label: <><i className={`anki-dot ${swatch(x.course)}`} /> {code(x.course)}</>, r: x.row }))} head="course" />
        </>}
        <p className="small muted">The share of reviews recalled (anything but Again), counting only cards in review (no learning steps), split by
          the interval before the review.</p>
      </section>

      <section className="anki">
        <h2>Answer buttons</h2>
        <table className="anki-table">
          <thead><tr><th>last month</th>{BUTTON_NAMES.map(([, n]) => <th key={n}>{n}</th>)}<th>correct</th></tr></thead>
          <tbody>
            {GROUP_NAMES.map(([g, n]) => {
              const b = v.buttons[g], all = b[1] + b[2] + b[3] + b[4];
              return (
                <tr key={g}>
                  <th>{n}</th>
                  {BUTTON_NAMES.map(([r]) => <td key={r}>{b[r]}</td>)}
                  <td>{pct({ passed: all - b[1], total: all })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}

function RetentionTable({ rows, head }: { rows: { key: string; label: React.ReactNode; r: { young: Pass; mature: Pass; all: Pass } }[]; head: string }) {
  const cell = (p: Pass) => <td title={`${p.passed} of ${p.total}`}>{pct(p)}{p.total > 0 && <span className="muted"> {p.total}</span>}</td>;
  return (
    <table className="anki-table">
      <thead><tr><th>{head}</th><th>Young</th><th>Mature</th><th>Total</th></tr></thead>
      <tbody>{rows.map(({ key, label, r }) => <tr key={key}><th>{label}</th>{cell(r.young)}{cell(r.mature)}{cell(r.all)}</tr>)}</tbody>
    </table>
  );
}
