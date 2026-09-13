import { Link } from "react-router-dom";
import { href, node, useData } from "../data/load";
import type { ConceptNode, CourseNode, UnitNode } from "../data/types";

export function ConceptChip({ id, note }: { id: string; note?: string | null }) {
  const d = useData();
  const c = node<ConceptNode>(d, id);
  if (!c) return <span className="chip">{id}</span>;
  return (
    <Link className="chip dom" style={{ ["--dom" as string]: `var(--dom-${c.domain.replace(".", "-")})` }} to={href.concept(id)} title={note ?? c.body}>
      {c.title}
    </Link>
  );
}

export function CourseChip({ id }: { id: string }) {
  const d = useData();
  const c = node<CourseNode>(d, id);
  return <Link className="chip" to={href.course(id)} title={c?.title}>{c?.code ?? id}</Link>;
}

export function UnitLink({ id, withCourse = true }: { id: string; withCourse?: boolean }) {
  const d = useData();
  const u = node<UnitNode>(d, id);
  if (!u) return <span>{id}</span>;
  const course = node<CourseNode>(d, u.course);
  return (
    <Link to={href.unit(id)}>
      {withCourse && course ? <span className="muted">{course.code} · </span> : null}
      {u.title}
    </Link>
  );
}

export function Badge({ kind, children }: { kind: string; children?: React.ReactNode }) {
  return <span className={`badge ${kind}`}>{children ?? kind.replace("_", " ")}</span>;
}
