import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, ConceptChip, CourseChip, UnitLink } from "../components/Chips";
import { node, useData } from "../data/load";
import type { ConceptNode, DsTier } from "../data/types";
import { TIERS, TIER_LABEL } from "./Explore";

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

      <DsRelevance />

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

/** DS relevance (#155): tiers, the load-bearing foundations, and where the periphery is taught. */
function DsRelevance() {
  const d = useData();
  const ds = d.derived.ds_relevance;
  const rows = Object.entries(ds.concepts);
  const count = (t: DsTier) => rows.filter(([, r]) => r.tier === t).length;
  const top = (t: DsTier, n: number) => rows.filter(([, r]) => r.tier === t).sort((a, b) => b[1].score - a[1].score).slice(0, n);
  const courses = Object.entries(ds.courses).map(([cid, c]) => ({ cid, ...c, share: c.concepts ? c.peripheral / c.concepts : 0 }))
    .sort((a, b) => b.share - a.share || a.cid.localeCompare(b.cid));
  const peripheralBy = new Map<string, string[]>();
  for (const [cid, r] of rows) {
    if (r.tier !== "peripheral") continue;
    for (const u of d.derived.concepts[cid]?.introduced_by ?? []) {
      const course = node(d, u) && (node(d, u) as { course: string }).course;
      const list = course ? peripheralBy.get(course) ?? peripheralBy.set(course, []).get(course)! : null;
      if (list && !list.includes(cid)) list.push(cid);
    }
  }
  return (
    <>
      <h2>DS relevance</h2>
      <p className="muted small">
        Concepts mapped to a <em>target</em> skill of the roadmap are the data-science work itself ({ds.anchors.length} anchors, taught in {ds.ds_units.length} DS units).
        Every other concept is scored by how many DS units rest on it through hard dependencies, weighted by distance, plus how many DS concepts rest on it and its
        betweenness in the dependency graph. <Link to="/explore">The DS map</Link> in Explore draws the tiers as concentric bands.
      </p>
      <table>
        <thead><tr>{TIERS.map((t) => <th key={t}>{TIER_LABEL[t]}</th>)}</tr></thead>
        <tbody><tr>{TIERS.map((t) => <td key={t}>{count(t)}</td>)}</tr></tbody>
      </table>

      <h3>Core foundations</h3>
      <p className="muted small">Not data science themselves, but the DS units rest on them most (depth-weighted reach ≥ {ds.core_weight}).</p>
      <table>
        <thead><tr><th>concept</th><th>score</th><th>DS units</th><th>weighted</th><th>DS concepts</th><th>reached through</th></tr></thead>
        <tbody>
          {top("core", 25).map(([cid, r]) => (
            <tr key={cid}>
              <td><ConceptChip id={cid} /></td><td>{r.score.toFixed(2)}</td><td>{r.ds_units}</td><td>{r.ds_weight.toFixed(1)}</td><td>{r.ds_reach}</td>
              <td className="small">{r.via.slice(0, 4).map((v) => <ConceptChip key={v} id={v} />)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Courses by DS relevance of what they introduce</h3>
      <p className="muted small">How the concepts each course introduces fall into the tiers; courses whose concepts are mostly peripheral to DS first.</p>
      <table>
        <thead><tr><th>course</th><th>concepts</th>{TIERS.map((t) => <th key={t}>{TIER_LABEL[t]}</th>)}<th>peripheral share</th></tr></thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.cid}>
              <td><CourseChip id={c.cid} /></td><td>{c.concepts}</td>
              {TIERS.map((t) => <td key={t}>{c[t]}</td>)}
              <td>{Math.round(c.share * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Peripheral concepts by course</h3>
      <p className="muted small">Taught for the degree; no DS unit rests on them. A missing edge is one way this list shrinks: an entry here is a finding to check, not a verdict.</p>
      <table>
        <thead><tr><th>course</th><th>peripheral concepts</th></tr></thead>
        <tbody>
          {[...peripheralBy.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).map(([cid, list]) => (
            <tr key={cid}>
              <td><CourseChip id={cid} /> <span className="muted small">{list.length}</span></td>
              <td className="small">{[...list].sort((a, b) => (node<ConceptNode>(d, a)?.domain ?? "").localeCompare(node<ConceptNode>(d, b)?.domain ?? "") || a.localeCompare(b)).map((x) => <ConceptChip key={x} id={x} />)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
