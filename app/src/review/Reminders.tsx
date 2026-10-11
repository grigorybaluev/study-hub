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

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));
  const refresh = () => pushState().then(setSt).catch(fail);
  const on = async () => {
    setError(null);
    try { setSt({ state: "on", subscription: await subscribe() }); } catch (e) { fail(e); await refresh(); }   // declined: "denied"
  };
  const off = async () => {
    setError(null);
    try { await unsubscribe(); } catch (e) { fail(e); }
    await refresh();
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(st.subscription ?? ""); setCopied(true); } catch { setError("Could not copy: select the text and copy it."); }
  };

  return (
    <div className="reminders">
      <h3>Reminders</h3>
      <p className="small muted">A notification {REMIND_AT} (GitHub may send one up to 20 minutes late), with the day's progress as this phone last saw it: the morning's count, then cards done and left.</p>
      {st.state === "install" && <p className="small">On an iPhone, reminders reach only the app added to the home screen: Share › Add to Home Screen, then open it from there.</p>}
      {st.state === "unsupported" && <p className="small muted">This browser cannot receive them.</p>}
      {st.state === "denied" && <p className="small">Notifications are blocked for this app: allow them in iOS Settings › Notifications › Study Hub.</p>}
      {st.state === "update" && <p className="small">An update of the app is waiting: tap Reload in its banner (or close and reopen the app) first.</p>}
      {st.state === "off" && <button type="button" onClick={on}>Enable reminders</button>}
      {st.state === "on" && st.subscription && (
        <>
          <p className="small">On for this device. For the reminders to be sent, this device's address has to be the repo secret
            {" "}<code>PUSH_SUBSCRIPTION</code>: copy it and pass it on (it is not a password, but keep it out of public places).</p>
          <textarea className="reminders-sub" readOnly rows={3} value={st.subscription} onFocus={(e) => e.currentTarget.select()} />
          <div className="reminders-actions">
            <button type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
            <button type="button" className="linkish" onClick={off} title="the repo secret stays until it is replaced or removed">Turn off</button>
          </div>
        </>
      )}
      {error && <p className="small deck-warn">{error}</p>}
    </div>
  );
}
