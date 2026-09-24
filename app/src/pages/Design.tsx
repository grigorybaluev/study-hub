// Unit-page design specimens (#89): one page per course kind, rendered by the real unit renderer.
// The specimen text is also the design doc: its rules and change log live in app/src/design/<kind>.md.
import { Link, useParams } from "react-router-dom";
import Markdown from "../components/Markdown";
import math from "../design/math.md?raw";

const SPECIMENS: Record<string, string> = { math };

export default function Design() {
  const { kind = "" } = useParams();
  const source = Object.hasOwn(SPECIMENS, kind) ? SPECIMENS[kind] : undefined;
  return (
    <article>
      <div className="crumbs">Design › {kind}</div>
      <p className="muted small">
        Specimens: {Object.keys(SPECIMENS).map((k) => <Link key={k} to={`/design/${k}`}>{k}</Link>)}
      </p>
      {source
        ? <div className={`unit-body prose pages-${kind}`}><Markdown key={kind} source={source} /></div>
        : <p>No specimen for “{kind}” yet.</p>}
    </article>
  );
}
