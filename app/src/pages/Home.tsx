import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, ConceptChip } from "../components/Chips";
import { href, node, useData } from "../data/load";
import type { CourseNode, UnitNode, VariantTerm } from "../data/types";

const SEASON = { fall: "Fall", winter: "Winter", summer: "Summer" };
// Concept-debt badges per course: hidden for now, kept for later use.
const SHOW_DEBT = false;

export default function Home() {
  const d = useData();
  const program = d.programs[0];
  const [vid, setVid] = useState(program.variants.find((v) => v.coop)?.id ?? program.variants[0].id);
  const variant = program.variants.find((v) => v.id === vid)!;
  const analysis = d.derived.variants[`${program.id}/${vid}`];
  const uni = d.universities.find((u) => u.id === program.university);

  return (
    <>
      <h1>{program.name}</h1>
      <p className="muted">
        {uni?.name}. {d.courses.filter((c) => c.kind === "core").length} core courses · {d.units.length} units ·{" "}
        {d.concepts.length} concepts. Content version <code>{d.graph.meta.content_version}</code>.
      </p>
      <div className="tabs">
        {program.variants.map((v) => (
          <button key={v.id} className={v.id === vid ? "active" : ""} onClick={() => setVid(v.id)}>{v.name ?? v.id}</button>
        ))}
      </div>
      <div className="terms">
        {(analysis?.terms ?? variant.terms).map((t: VariantTerm) => (
          <div className="term" key={t.index}>
            <h3>
              <span>Year {t.year} · {SEASON[t.season]}</span>
              {t.introduced && t.introduced.length > 0 && <span className="faint small">{t.introduced.length} new concepts</span>}
            </h3>
            {t.work_term ? <div className="work">Work term {t.work_term}</div> : (
              <ul>
                {t.courses?.map((cid) => {
                  const c = node<CourseNode>(d, cid)!;
                  const units = d.unitsOf.get(cid) ?? [];
                  const debt = t.debt?.filter((x) => x.unit.startsWith(cid + "/")) ?? [];
                  return (
                    <li key={cid}>
                      <span><Link to={href.course(cid)}>{c.code}</Link> <span className="muted small">{c.title}</span></span>
                      <span className="small">
                        {units.length === 0 ? <Badge kind="external">no units</Badge> : <Progress units={units} />}
                        {SHOW_DEBT && debt.length > 0 && <> <Badge kind={debt.some((x) => x.introduced_in_term === null) ? "never" : "same"}>{debt.length} debt</Badge></>}
                      </span>
                    </li>
                  );
                })}
                {t.electives ? <li className="work">+ {t.electives} elective{t.electives > 1 ? "s" : ""}</li> : null}
              </ul>
            )}
          </div>
        ))}
      </div>
      <p className="progress-legend faint small">
        <span className="progress"><span className="reviewed" style={{ flexGrow: 1 }} /></span> reviewed
        <span className="progress"><span className="drafted" style={{ flexGrow: 1 }} /></span> drafted
        <span className="progress" /> not written yet
      </p>

      <h2>Assumed prior and external courses</h2>
      <p className="muted small">Assumed-prior courses carry the concepts the program expects on entry; external ones appear only as prerequisite alternatives.</p>
      <p>
        {d.courses.filter((c) => c.kind !== "core").map((c) => (
          <Link key={c.id} className="chip" to={href.course(c.id)} title={c.title}>{c.code} <span className="faint">· {c.kind.replace("_", " ")}</span></Link>
        ))}
      </p>

      {d.derived.unmet.length > 0 && (
        <>
          <h2>Unmet dependencies</h2>
          <p className="muted small">Concepts required somewhere but introduced by no course in the program.</p>
          <ul>
            {d.derived.unmet.map((u) => (
              <li key={u.concept}><ConceptChip id={u.concept} /> <Badge kind={u.strength} /> — required by {u.required_by.length} unit{u.required_by.length > 1 ? "s" : ""}</li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

// Per-course unit progress: reviewed, drafted (written, not yet reviewed), not written (outline/planned).
function Progress({ units }: { units: UnitNode[] }) {
  const reviewed = units.filter((u) => u.review === "reviewed").length;
  const drafted = units.filter((u) => u.review !== "reviewed" && u.status === "detailed").length;
  const empty = units.length - reviewed - drafted;
  const title = `${reviewed} reviewed · ${drafted} drafted · ${empty} not written yet`;
  return (
    <span className="progress-cell" title={title}>
      <span className="progress" aria-hidden>
        {reviewed > 0 && <span className="reviewed" style={{ flexGrow: reviewed }} />}
        {drafted > 0 && <span className="drafted" style={{ flexGrow: drafted }} />}
        {empty > 0 && <span style={{ flexGrow: empty }} />}
      </span>
      <span className={reviewed === units.length ? "done" : "faint"}>{reviewed + drafted}/{units.length}</span>
    </span>
  );
}
