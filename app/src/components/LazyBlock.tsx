// Suspense for a lazily loaded block (sim, automaton, solution map, a graph page) that also catches a failed load.
// The Sim chunk is not precached (#189): offline before its first use, or in an installed app still on
// an old release whose chunk the new deploy removed, the import fails. Without this boundary that
// failure would unmount the whole app; with it, the block shows a note and the rest of the page stays.
import { Component, Suspense, type ReactNode } from "react";

/** What to say when the code of `what` could not load (also used by Sim when Plotly cannot load). */
export function loadFailedText(what = "interactive example") {
  return navigator.onLine
    ? `This ${what} could not load. Reload the page to get the latest version.`
    : `This ${what} needs a connection the first time it opens.`;
}

interface Props { fallback: ReactNode; children: ReactNode; what?: string }

export default class LazyBlock extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <div className="sim-box"><div className="sim-note">{loadFailedText(this.props.what)}</div></div>;
    return <Suspense fallback={this.props.fallback}>{this.props.children}</Suspense>;
  }
}
