// Registers the service worker (#189) and offers a reload when a new release has been downloaded.
// An installed app on iOS resumes instead of reloading, so it also checks for a release on every return.
import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const HOUR = 60 * 60 * 1000;

export default function UpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      setInterval(() => reg.update(), HOUR);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") reg.update();
      });
    },
  });

  useEffect(() => {
    // Ask iOS to keep this app's storage (review progress lives there from #192 on); granted silently
    // for an installed app, ignored elsewhere.
    const installed = matchMedia("(display-mode: standalone)").matches;
    if (installed) navigator.storage?.persist?.().catch(() => undefined);
  }, []);

  if (!needRefresh) return null;
  return (
    <div className="update-toast" role="status">
      <span>A new version is ready.</span>
      <button className="primary" onClick={() => updateServiceWorker(true)}>Reload</button>
      <button className="plain" onClick={() => setNeedRefresh(false)}>Later</button>
    </div>
  );
}
