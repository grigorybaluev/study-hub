// Review reminders on the stats page (#224): turn them on for this phone and copy its subscription, which
// the owner keeps as the repo secret PUSH_SUBSCRIPTION for the scheduled workflow.
import { useEffect, useState } from "react";
import { REMIND_AT, pushState, subscribe, unsubscribe, type PushState } from "./push";

export default function Reminders() {
  const [st, setSt] = useState<{ state: PushState; subscription: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { pushState().then(setSt).catch(() => setSt({ state: "unsupported", subscription: null })); }, []);
  if (!st) return null;

  const on = async () => {
    setError(null);
    try { setSt({ state: "on", subscription: await subscribe() }); } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };
  const off = async () => {
    try { await unsubscribe(); } finally { setSt(await pushState()); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(st.subscription ?? ""); setCopied(true); } catch { setError("Could not copy: select the text and copy it."); }
  };

  return (
    <div className="reminders">
      <h3>Reminders</h3>
      <p className="small muted">A notification at {REMIND_AT} (up to half an hour late), with the cards left today as this phone last saw them.</p>
      {st.state === "install" && <p className="small">On an iPhone, reminders reach only the app added to the home screen: Share › Add to Home Screen, then open it from there.</p>}
      {st.state === "unsupported" && <p className="small muted">This browser cannot receive them.</p>}
      {st.state === "denied" && <p className="small">Notifications are blocked for this app: allow them in iOS Settings › Notifications › Study Hub.</p>}
      {st.state === "off" && <button type="button" onClick={on}>Enable reminders</button>}
      {st.state === "on" && st.subscription && (
        <>
          <p className="small">On for this device. For the reminders to be sent, this device's address has to be the repo secret
            {" "}<code>PUSH_SUBSCRIPTION</code>: copy it and pass it on (it is not a password, but keep it out of public places).</p>
          <textarea className="reminders-sub" readOnly rows={3} value={st.subscription} onFocus={(e) => e.currentTarget.select()} />
          <div className="reminders-actions">
            <button type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
            <button type="button" className="linkish" onClick={off}>Turn off</button>
          </div>
        </>
      )}
      {error && <p className="small deck-warn">{error}</p>}
    </div>
  );
}
