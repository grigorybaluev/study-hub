// "Review this unit / course / concept" (#197): opens the deck on that scope, when it has cards.
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCards, useData } from "../data/load";
import { inScope, scopeQuery, type Scope } from "../review/scope";
import { scopes } from "../review/scopeContext";

export default function ReviewThis({ scope, what }: { scope: Scope; what: string }) {
  const cards = useCards();
  const d = useData();
  const sc = useMemo(() => scopes(d), [d]);
  const n = cards ? cards.filter((c) => inScope(c, scope, sc)).length : 0;
  if (!n) return null;
  return (
    <Link className="review-this" to={`/review${scopeQuery(scope)}`} title={`Review the ${n} card${n === 1 ? "" : "s"} of this ${what}`}>
      ↻ Review this {what} <span className="muted">· {n} card{n === 1 ? "" : "s"}</span>
    </Link>
  );
}
