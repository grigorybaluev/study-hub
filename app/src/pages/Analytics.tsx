import { useState } from "react";
import { Badge, ConceptChip, CourseChip, UnitLink } from "../components/Chips";
import { useData } from "../data/load";

const SEASON = { fall: "Fall", winter: "Winter", summer: "Summer" };

export default function Analytics() {
  const d = useData();
  const program = d.programs[0];
  const [vid, setVid] = useState(program.variants.find((v) => v.coop)?.id ?? program.variants[0].id);
  const v = d.derived.variants[`${program.id}/${vid}`];
  const debt = v.terms.flatMap((t) => (t.debt ?? []).map((x) => ({ ...x, term: t })));
  const uses = [...d.derived.course_uses].sort((a, b) => b.weight - a.weight);

  return (
    <>
      <h1>Analytics</h1>
      <p className="muted">Everything here is derived from the authored graph by <code>build/derive.py</code>; nothing is hand-written. Content version <code>{d.derived.meta.content_version}</code>.</p>

      <h2>Concept debt by term</h2>
      <p className="muted small">A unit has debt when it requires a concept not yet introduced by an earlier term (assumed-prior courses count as earlier) or by an earlier unit of its own course.</p>
      <div className="tabs">
        {program.variants.map((x) => <button key={x.id} className={x.id === vid ? "active" : ""} onClick={() => setVid(x.id)}>{x.name ?? x.id}</button>)}
      </div>
      <table>
        <thead><tr><th>term</th><th>courses</th><th>new concepts</th><th>same term</th><th>later</th><th>never</th></tr></thead>
        <tbody>
          {v.terms.map((t) => {
            const dl = t.debt ?? [];
            const same = dl.filter((x) => x.same_term).length;
            const never = dl.filter((x) => x.introduced_in_term === null).length;
            return (
              <tr key={t.index}>
                <td>Y{t.year} {SEASON[t.season]}</td>
                <td>{t.work_term ? <i className="muted">work term {t.work_term}</i> : t.courses?.map((c) => <CourseChip key={c} id={c} />)}</td>
                <td>{t.introduced?.length ?? ""}</td>
                <td>{t.work_term ? "" : same}</td><td>{t.work_term ? "" : dl.length - same - never}</td><td>{t.work_term ? "" : never}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {debt.length > 0 && (
        <table>
          <thead><tr><th>term</th><th>unit</th><th>needs</th><th></th><th>kind</th><th>introducer</th></tr></thead>
          <tbody>
            {debt.map((x, i) => (
              <tr key={i}>
                <td>Y{x.term.year} {SEASON[x.term.season]}</td>
                <td><UnitLink id={x.unit} /></td>
                <td><ConceptChip id={x.concept} /></td>
                <td><Badge kind={x.strength} /></td>
                <td><Badge kind={x.same_term ? "same" : x.introduced_in_term === null ? "never" : "later"}>{x.same_term ? "same term" : x.introduced_in_term === null ? "never" : "later"}</Badge></td>
                <td>{x.introducer ? <UnitLink id={x.introducer} /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {v.reteach.length > 0 && (
        <>
          <h2>Re-teaching</h2>
          <p className="muted small">Concepts introduced from scratch by two different courses.</p>
          <table>
            <thead><tr><th>concept</th><th>first</th><th>again</th><th>terms apart</th></tr></thead>
            <tbody>{v.reteach.map((r) => <tr key={r.concept + r.again}><td><ConceptChip id={r.concept} /></td><td><UnitLink id={r.first} /></td><td><UnitLink id={r.again} /></td><td>{r.terms_apart}</td></tr>)}</tbody>
          </table>
        </>
      )}

      <h2>Course coupling</h2>
      <p className="muted small">How many (unit, concept) requirements of one course point at concepts another course introduces.</p>
      <table>
        <thead><tr><th>uses</th><th>from</th><th>weight</th><th>hard</th><th>soft</th><th>via</th></tr></thead>
        <tbody>
          {uses.map((e) => (
            <tr key={e.from + e.to}>
              <td><CourseChip id={e.from} /></td><td><CourseChip id={e.to} /></td>
              <td>{e.weight}</td><td>{e.hard}</td><td>{e.soft}</td>
              <td className="small">{e.via.slice(0, 6).map((c) => <ConceptChip key={c} id={c} />)}{e.via.length > 6 ? "…" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
