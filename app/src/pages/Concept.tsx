import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, ConceptChip, UnitLink } from "../components/Chips";
import { edgesIn, edgesOut, href, node, useData } from "../data/load";
import type { CourseNode, RoadmapSkillNode, UnitNode } from "../data/types";

export default function Concept() {
  const { slug } = useParams();
  return slug ? <ConceptPage slug={slug} /> : <ConceptIndex />;
}

function ConceptIndex() {
  const d = useData();
  const [domain, setDomain] = useState<string>("all");
  const domains = [...new Set(d.concepts.map((c) => c.domain))].sort();
  const list = d.concepts.filter((c) => domain === "all" || c.domain === domain).sort((a, b) => a.title.localeCompare(b.title));
  return (
    <>
      <h1>Concepts</h1>
      <p className="muted">{d.concepts.length} global concepts shared by all courses. A concept exists only if some unit could require it on its own.</p>
      <div className="tabs">
        <button className={domain === "all" ? "active" : ""} onClick={() => setDomain("all")}>all</button>
        {domains.map((dm) => <button key={dm} className={domain === dm ? "active" : ""} onClick={() => setDomain(dm)}>{dm}</button>)}
      </div>
      <div className="grid">
        {list.map((c) => {
          const idx = d.derived.concepts[c.id];
          return (
            <div className="card" key={c.id} style={{ borderLeft: `4px solid var(--dom-${c.domain.replace(".", "-")})` }}>
              <h3><Link className="title" to={href.concept(c.id)}>{c.title}</Link></h3>
              <div className="small muted">{c.body}</div>
              <div className="small faint" style={{ marginTop: "0.4em" }}>
                {idx?.introduced_by.length ?? 0} introducer{(idx?.introduced_by.length ?? 0) === 1 ? "" : "s"} · {idx?.required_by.length ?? 0} requiring
                {idx && idx.introduced_by.length === 0 && idx.required_by.length > 0 && <> · <Badge kind="gap">unmet</Badge></>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ConceptPage({ slug }: { slug: string }) {
  const d = useData();
  const c = d.concepts.find((x) => x.id === slug);
  if (!c) return <p>Unknown concept {slug}.</p>;
  const idx = d.derived.concepts[c.id];
  const byCourse = new Map<string, typeof idx.perspectives>();
  for (const p of idx.perspectives) {
    const u = node<UnitNode>(d, p.unit)!;
    (byCourse.get(u.course) ?? byCourse.set(u.course, []).get(u.course)!).push(p);
  }
  const buildsOn = d.derived.concept_depends_on.filter((e) => e.from === c.id).sort((a, b) => b.weight - a.weight);
  const neededFor = d.derived.concept_depends_on.filter((e) => e.to === c.id).sort((a, b) => b.weight - a.weight);
  const generalizes = edgesOut(d, c.id, "generalizes").map((e) => e.to);
  const generalizedBy = edgesIn(d, c.id, "generalizes").map((e) => e.from);
  const skills = edgesOut(d, c.id, "maps_to").map((e) => e.to);

  return (
    <div className="with-sidebar">
      <div>
        <div className="crumbs"><Link to="/concepts">Concepts</Link> › {c.domain}</div>
        <h1>{c.title}</h1>
        <p className="prose">{c.body}</p>
        {c.aliases.length > 0 && <p className="muted small">Also: {c.aliases.join(", ")}</p>}

        <h2>Perspectives</h2>
        {byCourse.size === 0 ? (
          <p className="muted">No course introduces or reinforces this concept yet{idx.required_by.length > 0 ? " — an unmet dependency." : "."}</p>
        ) : (
          <div className="grid">
            {[...byCourse.entries()].map(([cid, ps]) => {
              const course = node<CourseNode>(d, cid)!;
              return (
                <div className="card" key={cid}>
                  <h3><Link className="title" to={href.course(cid)}>{course.code}</Link> <span className="muted small">{course.title}</span></h3>
                  <ul className="small" style={{ paddingLeft: "1.1em", margin: 0 }}>
                    {ps.map((p) => (
                      <li key={p.unit + p.role}>
                        <Badge kind={p.role === "introduces" ? "detailed" : "outline"}>{p.role}</Badge>{" "}
                        <UnitLink id={p.unit} withCourse={false} />
                        {p.perspective && <div className="muted">{p.perspective}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {idx.required_by.length > 0 && (
          <>
            <h2>Required by</h2>
            <ul>{idx.required_by.map((r) => <li key={r.unit}><UnitLink id={r.unit} /> <Badge kind={r.strength} /></li>)}</ul>
          </>
        )}
      </div>
      <aside className="sidebar">
        {buildsOn.length > 0 && (
          <section><h4>Builds on</h4>
            <ul>{buildsOn.map((e) => <li key={e.to}><ConceptChip id={e.to} /> <Badge kind={e.strength} /></li>)}</ul>
          </section>
        )}
        {neededFor.length > 0 && (
          <section><h4>Needed for</h4>
            <ul>{neededFor.map((e) => <li key={e.from}><ConceptChip id={e.from} /> <Badge kind={e.strength} /></li>)}</ul>
          </section>
        )}
        {generalizes.length > 0 && <section><h4>Generalizes</h4><p>{generalizes.map((id) => <ConceptChip key={id} id={id} />)}</p></section>}
        {generalizedBy.length > 0 && <section><h4>Generalized by</h4><p>{generalizedBy.map((id) => <ConceptChip key={id} id={id} />)}</p></section>}
        {skills.length > 0 && (
          <section><h4>Roadmap skills</h4>
            <ul>{skills.map((sid) => <li key={sid}><Link to={href.skill(sid)}>{(d.byId.get(sid) as RoadmapSkillNode | undefined)?.title ?? sid}</Link></li>)}</ul>
          </section>
        )}
      </aside>
    </div>
  );
}
