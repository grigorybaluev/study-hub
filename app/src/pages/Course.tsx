import { Link, useParams } from "react-router-dom";
import { Badge, ConceptChip, CourseChip } from "../components/Chips";
import { edgesIn, edgesOut, href, useData } from "../data/load";
import type { CourseNode, RoadmapSkillNode } from "../data/types";

export default function Course() {
  const d = useData();
  const { code } = useParams();
  const course = d.courses.find((c) => c.code === code);
  if (!course) return <p>Unknown course {code}.</p>;
  const units = d.unitsOf.get(course.id) ?? [];
  const prereqGroups = groupBy(edgesOut(d, course.id, "prereq"), (e) => e.group ?? 0);
  const coreqs = edgesOut(d, course.id, "coreq");
  const requiredBy = [...edgesIn(d, course.id, "prereq"), ...edgesIn(d, course.id, "coreq")].map((e) => e.from);
  const uses = d.derived.course_uses.filter((e) => e.from === course.id).sort((a, b) => b.weight - a.weight);
  const usedBy = d.derived.course_uses.filter((e) => e.to === course.id).sort((a, b) => b.weight - a.weight);
  const introduced = units.flatMap((u) => edgesOut(d, u.id, "introduces").map((e) => e.to));
  const skills = new Map<string, number>();
  for (const c of introduced) for (const e of edgesOut(d, c, "maps_to")) skills.set(e.to, (skills.get(e.to) ?? 0) + 1);

  return (
    <div className="with-sidebar">
      <div>
        <div className="crumbs"><Link to="/">Program</Link> › {course.code}</div>
        <h1>{course.code} — {course.title}</h1>
        <div className="status-line">
          <Badge kind={course.kind} /> <span>{course.credits} credits</span>
          {units.length > 0 && <span>· {units.length} units · {introduced.length} concepts introduced</span>}
        </div>
        <p className="prose">{course.body}</p>

        <h2>Units</h2>
        {units.length === 0 ? <p className="muted">No units yet.</p> : (
          <ol className="unit-list">
            {units.map((u) => (
              <li key={u.id}>
                <span className="n">{u.order}</span>
                <span>
                  <Link to={href.unit(u.id)}>{u.title}</Link>
                  {u.kind === "review" && <> <Badge kind="review" /></>}
                  <div className="small muted">
                    {edgesOut(d, u.id, "introduces").map((e) => <ConceptChip key={e.to} id={e.to} note={e.perspective} />)}
                  </div>
                </span>
                <Badge kind={u.status} />
              </li>
            ))}
          </ol>
        )}
      </div>
      <aside className="sidebar">
        <section>
          <h4>Prerequisites</h4>
          {prereqGroups.length === 0 && coreqs.length === 0 && course.requirements.length === 0 && <p className="muted">None.</p>}
          <ul>
            {prereqGroups.map((g, i) => (
              <li key={i}>{g.map((e, j) => <span key={e.to}>{j > 0 && <span className="muted"> or </span>}<CourseChip id={e.to} /></span>)}</li>
            ))}
            {coreqs.length > 0 && <li><span className="muted">co-requisite: </span>{coreqs.map((e) => <CourseChip key={e.to} id={e.to} />)}</li>}
            {course.requirements.map((r) => <li key={r} className="muted small">{r}</li>)}
          </ul>
        </section>
        {requiredBy.length > 0 && (
          <section><h4>Prerequisite for</h4><p>{[...new Set(requiredBy)].map((id) => <CourseChip key={id} id={id} />)}</p></section>
        )}
        {uses.length > 0 && (
          <section>
            <h4>Relies on (concepts)</h4>
            <ul>{uses.map((e) => <li key={e.to}><CourseChip id={e.to} /> <span className="muted small">{e.weight} · {e.via.slice(0, 4).join(", ")}{e.via.length > 4 ? "…" : ""}</span></li>)}</ul>
          </section>
        )}
        {usedBy.length > 0 && (
          <section>
            <h4>Relied on by</h4>
            <ul>{usedBy.map((e) => <li key={e.from}><CourseChip id={e.from} /> <span className="muted small">{e.weight}</span></li>)}</ul>
          </section>
        )}
        {skills.size > 0 && (
          <section>
            <h4>Roadmap skills</h4>
            <ul>{[...skills.entries()].sort((a, b) => b[1] - a[1]).map(([sid, n]) => {
              const s = d.byId.get(sid) as RoadmapSkillNode | undefined;
              return <li key={sid}><Link to={href.skill(sid)}>{s?.title ?? sid}</Link> <span className="faint small">{n}</span></li>;
            })}</ul>
          </section>
        )}
        {course.source && <section><h4>Source</h4><p className="muted small">{course.source}</p></section>}
      </aside>
    </div>
  );
}

function groupBy<T>(items: T[], key: (t: T) => number): T[][] {
  const m = new Map<number, T[]>();
  for (const it of items) (m.get(key(it)) ?? m.set(key(it), []).get(key(it))!).push(it);
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

export type { CourseNode };
