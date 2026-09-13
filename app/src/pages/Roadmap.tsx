import { Link, useParams } from "react-router-dom";
import { Badge, ConceptChip, CourseChip } from "../components/Chips";
import { edgesIn, href, useData } from "../data/load";
import type { RoadmapSkillNode, SkillCoverage } from "../data/types";

export default function Roadmap() {
  const d = useData();
  const { slug } = useParams();
  const rm = d.roadmaps[0];
  const cov = d.derived.roadmap_coverage[rm.id];
  const areas = d.skills.filter((s) => s.roadmap === rm.id && s.level === "area").sort((a, b) => a.order[0] - b.order[0]);
  const skillsOf = (aid: string) => d.skills.filter((s) => s.parent === aid).sort((a, b) => a.order[1] - b.order[1]);

  if (slug) {
    const s = d.skills.find((x) => x.level === "skill" && x.id.endsWith("/" + slug));
    if (!s) return <p>Unknown skill {slug}.</p>;
    return <SkillPage skill={s} cov={cov.skills[s.id]} />;
  }

  return (
    <>
      <h1>{rm.title}</h1>
      <p className="prose muted">{rm.description}</p>
      <p className="small">
        {Object.entries(cov.summary).map(([k, v]) => <span key={k} style={{ marginRight: "0.8em" }}><Badge kind={k} /> {v}</span>)}
      </p>
      {areas.map((a) => (
        <section key={a.id}>
          <h2>{a.title}</h2>
          <div className="grid">
            {skillsOf(a.id).map((s) => {
              const c = cov.skills[s.id];
              return (
                <div className="card" key={s.id}>
                  <h3><Link className="title" to={href.skill(s.id)}>{s.title}</Link> <Badge kind={c.status} /></h3>
                  <div className="small muted">{s.summary}</div>
                  <div className="small" style={{ marginTop: "0.4em" }}>
                    {c.courses.length > 0 ? c.courses.map((cid) => <CourseChip key={cid} id={cid} />) : <span className="faint">not taught</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {rm.references.length > 0 && (
        <>
          <h2>References</h2>
          <ul className="small">{rm.references.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>)}</ul>
        </>
      )}
    </>
  );
}

function SkillPage({ skill, cov }: { skill: RoadmapSkillNode; cov: SkillCoverage }) {
  const d = useData();
  const area = d.byId.get(skill.parent!) as RoadmapSkillNode | undefined;
  const mapped = edgesIn(d, skill.id, "maps_to").map((e) => e.from);
  return (
    <>
      <div className="crumbs"><Link to="/roadmap">Roadmap</Link> › {area?.title}</div>
      <h1>{skill.title} <Badge kind={cov.status} /></h1>
      <p className="prose">{skill.summary}</p>
      <h2>Concepts</h2>
      {mapped.length === 0 ? <p className="muted">No concept maps to this skill yet.</p> : (
        <ul>
          {mapped.map((cid) => (
            <li key={cid}><ConceptChip id={cid} /> {cov.missing.includes(cid) ? <Badge kind="gap">not taught</Badge> : null}</li>
          ))}
        </ul>
      )}
      {cov.courses.length > 0 && <><h2>Taught in</h2><p>{cov.courses.map((cid) => <CourseChip key={cid} id={cid} />)}</p></>}
      {skill.refs && skill.refs.length > 0 && (
        <><h2>References</h2><ul className="small">{skill.refs.map((u) => <li key={u}><a href={u} target="_blank" rel="noreferrer">{u}</a></li>)}</ul></>
      )}
    </>
  );
}
