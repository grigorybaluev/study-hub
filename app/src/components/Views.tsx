// Two views of one object side by side — a transition table and its diagram (#111). When the
// column is narrow (a phone), a "Table | Diagram" switch shows one at a time; the layout is a CSS
// container query, the switch only sets which view is active.
import { Children, useState, type ReactNode } from "react";

export default function Views({ children }: { children: ReactNode }) {
  const kids = Children.toArray(children).filter((c) => typeof c !== "string" || c.trim() !== "");
  const [active, setActive] = useState(0);
  const labels = ["Table", "Diagram"];
  return (
    <div className="views">
      <div className="views-switch" role="tablist">
        {kids.map((_, i) => (
          <button key={i} role="tab" aria-selected={i === active} className={i === active ? "on" : ""} onClick={() => setActive(i)}>{labels[i] ?? `View ${i + 1}`}</button>
        ))}
      </div>
      <div className="views-panes">
        {kids.map((k, i) => <div key={i} className={`views-pane${i === active ? " on" : ""}`}>{k}</div>)}
      </div>
    </div>
  );
}
