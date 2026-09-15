import { Link, useParams } from "react-router-dom";
import { Badge, ConceptChip, UnitLink } from "../components/Chips";
import Markdown from "../components/Markdown";
import { edgesOut, href, node, useData } from "../data/load";
import type { ConceptNode, CourseNode } from "../data/types";

export default function Unit() {
  const d = useData();
  const { code, slug } = useParams();
  const unit = d.units.find((u) => u.course.endsWith("/" + code) && u.id.endsWith("/" + slug));
  if (!unit) return <p>Unknown unit {code}/{slug}.</p>;
  const course = node<CourseNode>(d, unit.course)!;
  const siblings = d.unitsOf.get(unit.course) ?? [];
  const i = siblings.findIndex((u) => u.id === unit.id);
  const prev = siblings[i - 1];
  const next = siblings[i + 1];
  const introduces = edgesOut(d, unit.id, "introduces");
  const requires = edgesOut(d, unit.id, "requires");
  const reinforces = edgesOut(d, unit.id, "reinforces");
  const dependsOn = d.derived.unit_depends_on.filter((e) => e.from === unit.id && !e.same_course);
  const dependsOnOwn = d.derived.unit_depends_on.filter((e) => e.from === unit.id && e.same_course);

  return (
    <div className="with-sidebar">
      <article>
        <div className="crumbs"><Link to="/">Program</Link> › <Link to={href.course(course.id)}>{course.code}</Link> › unit {unit.order}</div>
        <h1>{unit.title}</h1>
        <div className="status-line">
          <Badge kind={unit.status} />
          {unit.kind === "review" && <Badge kind="review" />}
          {unit.weeks.length > 0 && <span>week{unit.weeks.length > 1 ? "s" : ""} {unit.weeks.join(", ")}</span>}
          {unit.textbook && <span>· {unit.textbook}</span>}
        </div>
        {unit.kind === "review" && (
          <p className="muted">Review unit: recaps material introduced elsewhere. See the concepts in the sidebar for where they are taught.</p>
        )}
        <div className="unit-body prose">
          <Markdown source={unit.body} />
        </div>
        <nav className="unit-nav">
          <span>{prev && <Link to={href.unit(prev.id)}>← {prev.title}</Link>}</span>
          <span>{next && <Link to={href.unit(next.id)}>{next.title} →</Link>}</span>
        </nav>
      </article>
      <aside className="sidebar">
        {introduces.length > 0 && (
          <section><h4>Introduces</h4><p>{introduces.map((e) => <ConceptChip key={e.to} id={e.to} note={e.perspective} />)}</p>
            {introduces.some((e) => e.perspective) && <ul className="small muted">{introduces.filter((e) => e.perspective).map((e) => <li key={e.to}>{node<ConceptNode>(d, e.to)?.title ?? e.to}: {e.perspective}</li>)}</ul>}
          </section>
        )}
        {requires.length > 0 && (
          <section><h4>Requires</h4>
            <ul>{requires.map((e) => <li key={e.to}><ConceptChip id={e.to} /> <Badge kind={e.strength ?? "hard"} /></li>)}</ul>
          </section>
        )}
        {reinforces.length > 0 && (
          <section><h4>Reinforces</h4>
            <ul>{reinforces.map((e) => <li key={e.to}><ConceptChip id={e.to} /> {e.perspective && <span className="small muted">— {e.perspective}</span>}</li>)}</ul>
          </section>
        )}
        {dependsOnOwn.length > 0 && (
          <section><h4>Builds on (this course)</h4>
            <ul>{dependsOnOwn.map((e) => <li key={e.to}><UnitLink id={e.to} withCourse={false} /> <span className="faint small">via {e.via.join(", ")}</span></li>)}</ul>
          </section>
        )}
        {dependsOn.length > 0 && (
          <section><h4>Depends on units</h4>
            <ul>{dependsOn.map((e) => <li key={e.to}><UnitLink id={e.to} /> <span className="faint small">via {e.via.join(", ")}</span></li>)}</ul>
          </section>
        )}
        {unit.notes && unit.notes.length > 0 && (
          <section><h4>Sources</h4><ul className="small muted">{unit.notes.map((n) => <li key={n}>{n}</li>)}</ul></section>
        )}
      </aside>
    </div>
  );
}
