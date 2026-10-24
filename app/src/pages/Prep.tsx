// The preparation section (#262): one study guide per exam, from content/universities/<uni>/prep/.
// /prep lists the guides; /prep/<CODE>/<exam>[/<section>[/<item>]] is one guide with its tabs (#256).
import { useMemo, useRef, useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import Markdown from "../components/Markdown";
import PartsNav from "../components/PartsNav";
import { UnitLink } from "../components/Chips";
import ConversionMapView from "../components/ConversionMap";
import { href, node, upcomingPreps, usePrep, useData, type Data } from "../data/load";
import type { CourseNode, Prep, PrepIndex, PrepSection, PrepTable } from "../data/types";
import { useMemory } from "../review/memory";
import { standing } from "../review/standing";
import { standingInput } from "../review/StandingPanel";
import { scopes } from "../review/scopeContext";
import { scopeQuery } from "../review/scope";
import { daysUntil, localDate } from "../review/term";

const SECTIONS: { id: PrepSection; label: string; path: string }[] = [
  { id: "overview", label: "Overview", path: "" },
  { id: "types", label: "Problem types", path: "types" },
  { id: "table", label: "Table", path: "table" },
  { id: "map", label: "Map", path: "map" },
  { id: "plan", label: "Plan", path: "plan" },
];

const day = (iso: string) => new Date(localDate(iso)).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

/** "in 3 days", "tomorrow", "today", "over" */
export function whenLabel(iso: string, now = Date.now()): string {
  const n = daysUntil(localDate(iso), now);
  return n < 0 ? "over" : n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`;
}

const examIndex = (course: CourseNode | undefined, exam: string) => course?.exams.findIndex((e) => e.name === exam) ?? -1;

export function PrepList() {
  const d = useData();
  const ahead = upcomingPreps(d);
  const past = d.preps.filter((p) => !ahead.includes(p)).reverse();
  const row = (p: PrepIndex) => {
    const course = node<CourseNode>(d, p.course);
    return (
      <li key={p.id} className="prep-row">
        <Link to={href.prep(p.id)}>
          <span className="prep-row-title">{course?.code} · {p.exam}</span>
          <span className="small muted">{day(p.date)} · {whenLabel(p.date)}</span>
        </Link>
        <div className="small muted">{course?.title}</div>
        <div className="prep-row-summary">{p.summary}</div>
      </li>
    );
  };
  return (
    <div className="prep-list">
      <h1>Exam preparation</h1>
      <p className="muted">One study guide per exam: what it covers, the problem types, a summary table, the conversion
        maps and a plan, linked to the units and to the exam's review deck.</p>
      {ahead.length === 0 ? <p className="muted">No study guide for an exam ahead.</p> : <ul className="prep-rows">{ahead.map(row)}</ul>}
      {past.length > 0 && <><h2>Past exams</h2><ul className="prep-rows">{past.map(row)}</ul></>}
    </div>
  );
}

export default function PrepPage() {
  const d = useData();
  const { code, exam, section = "", item } = useParams();
  const index = d.preps.find((p) => p.id.endsWith(`/${code}/${exam}`));
  const prep = usePrep(index?.id);
  if (!index) return <p>No study guide for {code} {exam}.</p>;
  const course = node<CourseNode>(d, index.course);
  const tab = SECTIONS.find((s) => s.path === section && index.sections.includes(s.id));
  return (
    <div className="prep">
      <div className="crumbs"><Link to="/prep">Prep</Link> › <Link to={href.course(index.course)}>{course?.code}</Link> › {index.exam}</div>
      <h1>{course?.code} {index.exam}<span className="prep-sub">{course?.title}</span></h1>
      <PrepStatus d={d} p={index} course={course} />
      <nav className="prep-tabs" aria-label="Study guide sections">
        {SECTIONS.filter((s) => index.sections.includes(s.id)).map((s) => (
          <NavLink key={s.id} to={href.prep(index.id, s.path)} end={s.path === ""}>{s.label}</NavLink>
        ))}
      </nav>
      {prep === undefined ? <p className="muted">Loading…</p>
        : prep instanceof Error ? <p className="muted">Could not load this study guide: {prep.message}</p>
        : !tab ? <p>No section “{section}” in this study guide.</p>
        : <Section prep={prep} course={course} id={tab.id} item={item} />}
    </div>
  );
}

/** Date, days left, how ready the exam's cards are (#231) and the way into its review deck. */
function PrepStatus({ d, p, course }: { d: Data; p: PrepIndex; course: CourseNode | undefined }) {
  const { st } = useMemory();
  const i = examIndex(course, p.exam);
  const ready = useMemo(() => {
    if (!st || !course) return null;
    const rows = standing(standingInput(scopes(d), st.cards.filter((c) => c.course === course.id), st.engine, Date.now()));
    const e = rows[0]?.exam;
    return e && e.index === i ? e : null;
  }, [st, d, course, i]);
  return (
    <>
      <div className="status-line">
        <span>{day(p.date)}</span>
        <span className={`prep-when${daysUntil(localDate(p.date), Date.now()) <= 3 ? " soon" : ""}`}>{whenLabel(p.date)}</span>
        {ready && ready.ready !== null && (
          <span title={`about ${Math.round(ready.ready * ready.cards)} of its ${ready.cards} cards recalled on the exam morning if you stopped now`}>
            {Math.round(ready.ready * 100)}% ready
          </span>
        )}
        {i >= 0 && <Link to={`/review${scopeQuery({ kind: "exam", course: p.course, index: i })}`}>Review this exam →</Link>}
      </div>
      <div className="prep-summary"><Markdown source={p.summary} /></div>
    </>
  );
}

function Section({ prep, course, id, item }: { prep: Prep; course: CourseNode | undefined; id: PrepSection; item?: string }) {
  switch (id) {
    case "overview": return <Overview prep={prep} course={course} />;
    case "types": return item ? <TypePage prep={prep} course={course} slug={item} /> : <Types prep={prep} />;
    case "map": return <Maps prep={prep} />;
    case "table": return prep.table ? <SummaryTable t={prep.table} /> : null;
    default: return <p className="muted">This section is not built yet.</p>;
  }
}

function Overview({ prep, course }: { prep: Prep; course: CourseNode | undefined }) {
  const d = useData();
  const bodyRef = useRef<HTMLDivElement>(null);
  const exam = course?.exams.find((e) => e.name === prep.exam);
  // the units the exam covers: any of their teaching weeks inside its range
  const units = (d.unitsOf.get(prep.course) ?? []).filter((u) => exam && u.weeks.some((w) => w >= exam.weeks[0] && w <= exam.weeks[1]));
  return (
    <div className="with-sidebar">
      <article>
        {prep.format && <div className="prep-format"><span className="prep-format-label">The test</span><Markdown source={prep.format} /></div>}
        <PartsNav key={prep.id} root={bodyRef} version={prep.overview} title="Overview" />
        <div ref={bodyRef} className={`unit-body prose${course?.pages ? ` pages-${course.pages}` : ""}`}>
          {prep.overview && <Markdown key={prep.id} source={prep.overview} />}
        </div>
      </article>
      <aside className="sidebar">
        {exam && (
          <section><h4>Covers weeks {exam.weeks[0]}–{exam.weeks[1]}</h4>
            <ol className="prep-units">{units.map((u) => <li key={u.id}><UnitLink id={u.id} withCourse={false} /> <span className="faint small">wk {u.weeks.join(", ")}</span></li>)}</ol>
          </section>
        )}
      </aside>
    </div>
  );
}

function Maps({ prep }: { prep: Prep }) {
  const d = useData();
  return (
    <>
      {prep.maps.map((id) => d.maps.get(id)).filter((m) => m !== undefined).map((m) => (
        <section key={m.id} className="prep-map">
          <h2>{m.title}</h2>
          {m.description && <p className="muted prep-map-lead">{m.description}</p>}
          <ConversionMapView map={m} />
        </section>
      ))}
    </>
  );
}

/** The problem types: what each asks and where it is taught, then the guide's advice on answering. */
function Types({ prep }: { prep: Prep }) {
  const d = useData();
  return (
    <div className="prep-types">
      <ol className="prep-type-list">
        {prep.types.map((t) => (
          <li key={t.slug}>
            <Link className="prep-type-title" to={href.prep(prep.id, `types/${t.slug}`)}><span className="n">{t.order}</span>{t.title}</Link>
            <div className="small">{t.asks}</div>
            <div className="small muted">
              {t.units.map((u, k) => <span key={u}>{k > 0 && " · "}<UnitLink id={u} withCourse={false} /></span>)}
              {t.method && d.methods.get(t.method) && <> · method: {d.methods.get(t.method)!.title}</>}
            </div>
          </li>
        ))}
      </ol>
      {prep.types_intro && <div className="unit-body prose prep-types-intro"><Markdown source={prep.types_intro} /></div>}
    </div>
  );
}

function TypePage({ prep, course, slug }: { prep: Prep; course: CourseNode | undefined; slug: string }) {
  const d = useData();
  const bodyRef = useRef<HTMLDivElement>(null);
  const i = prep.types.findIndex((t) => t.slug === slug);
  if (i < 0) return <p>No problem type “{slug}”.</p>;
  const t = prep.types[i], prev = prep.types[i - 1], next = prep.types[i + 1];
  const method = t.method ? d.methods.get(t.method) : undefined;
  return (
    <div className="with-sidebar">
      <article>
        <div className="crumbs"><Link to={href.prep(prep.id, "types")}>Problem types</Link> › type {t.order}</div>
        <h2 className="prep-type-h">{t.order} · {t.title}</h2>
        <p className="muted">{t.asks}</p>
        <PartsNav key={t.slug} root={bodyRef} version={t.body} title={t.title} />
        <div ref={bodyRef} className={`unit-body prose${course?.pages ? ` pages-${course.pages}` : ""}`}>
          <Markdown key={t.slug} source={t.body} />
        </div>
        <nav className="unit-nav">
          <span>{prev && <Link to={href.prep(prep.id, `types/${prev.slug}`)}>← {prev.title}</Link>}</span>
          <span>{next && <Link to={href.prep(prep.id, `types/${next.slug}`)}>{next.title} →</Link>}</span>
        </nav>
      </article>
      <aside className="sidebar">
        {t.units.length > 0 && <section><h4>Taught in</h4><ul>{t.units.map((u) => <li key={u}><UnitLink id={u} withCourse={false} /></li>)}</ul></section>}
        {method && <section><h4>Method graph</h4><p className="small"><b>{method.title}</b></p>{method.description && <p className="small muted">{method.description}</p>}</section>}
        <section><h4>All types</h4><ol className="prep-units">{prep.types.map((x) => (
          <li key={x.slug}>{x.slug === t.slug ? <b>{x.title}</b> : <Link to={href.prep(prep.id, `types/${x.slug}`)}>{x.title}</Link>}</li>
        ))}</ol></section>
      </aside>
    </div>
  );
}

const md = (s: string) => <span className="cmap-md"><Markdown source={s} /></span>;

/** The summary table (#259): every column side by side on a wide screen; on a phone one column at a time
 *  (the CSS decides which layout shows), then the rows every column shares. */
function SummaryTable({ t }: { t: PrepTable }) {
  const [col, setCol] = useState(t.columns[0]?.id);
  const one = t.columns.find((c) => c.id === col) ?? t.columns[0];
  return (
    <section className="prep-table">
      {t.title && <h2>{t.title}</h2>}
      {t.lead && <div className="prep-map-lead muted"><Markdown source={t.lead} /></div>}
      <div className="prep-table-wide">
        <table>
          <thead>
            <tr><th />{t.columns.map((c) => (
              <th key={c.id} className={`tone-${c.tone}`}>
                {c.concept ? <Link to={href.concept(c.concept)}>{c.title}</Link> : c.title}
                {c.sub && <span>{c.sub}</span>}
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {t.rows.map((r) => (
              <tr key={r.label}><th scope="row">{md(r.label)}</th>{t.columns.map((c) => (
                <td key={c.id} className={`tone-${c.tone}`}>{r.cells[c.id] ? md(r.cells[c.id]) : null}</td>
              ))}</tr>
            ))}
            {t.shared.map((r) => (
              <tr key={r.label} className="shared"><th scope="row">{md(r.label)}</th><td colSpan={t.columns.length}>{md(r.text)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="prep-table-narrow">
        <div className="prep-seg" role="tablist">
          {t.columns.map((c) => (
            <button key={c.id} role="tab" aria-selected={c.id === one.id} className={`tone-${c.tone}${c.id === one.id ? " on" : ""}`} onClick={() => setCol(c.id)}>{c.title}</button>
          ))}
        </div>
        <dl className={`prep-col tone-${one.tone}`}>
          {one.sub && <dd className="prep-col-sub">{one.sub}</dd>}
          {t.rows.filter((r) => r.cells[one.id]).map((r) => (
            <div key={r.label}><dt>{md(r.label)}</dt><dd>{md(r.cells[one.id])}</dd></div>
          ))}
        </dl>
        <dl className="prep-shared">
          {t.shared.map((r) => <div key={r.label}><dt>{md(r.label)}</dt><dd>{md(r.text)}</dd></div>)}
        </dl>
      </div>
    </section>
  );
}
