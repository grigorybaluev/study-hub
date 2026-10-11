// Vibration from a real tap (#223). WebKit plays the system haptic when a switch is toggled by a tap,
// but no longer for a click from script (WebKit bug 309082, iOS 26.5, and on the owner's iOS 18.7 too):
// so a hidden switch's label lies under the finger. `HapticTap` covers its parent (position it: a grade
// button, Show answer); `HapticArea` wraps content without a box of its own (the card's front, which
// scrolls). A tap is felt as the finger lifts; a swipe cannot be felt this way. The tap's own action waits
// for afterTap(), or its re-render would remove or disable the switch first. Only on iOS, where
// navigator.vibrate is missing; elsewhere haptic() vibrates.
import type { ReactNode } from "react";
import { onIOS, prefs } from "./feedback";

/** The `switch` attribute (Safari 17.4+), which React's types do not know yet. */
export const SWITCH: Record<string, string> = { switch: "" };
// the switch's own click (sent by the label) must not reach the button a second time. A label always holds
// its switch: one without would take the first button inside it as its control (a quiz's first option)
const hidden = (off = false) => (
  <input type="checkbox" {...SWITCH} tabIndex={-1} disabled={off} aria-hidden="true" className="haptic-switch" onClick={(e) => e.stopPropagation()} />
);

/** `force`: the settings' test, whatever the Vibration setting. */
export function HapticTap({ force = false }: { force?: boolean }) {
  if (!onIOS() || (!force && !prefs().haptics)) return null;
  return <label className="haptic-tap" aria-hidden="true">{hidden()}</label>;
}

/** `on`: taps here are felt now (the card's front, not its back); the label stays either way, so the
 *  tree under it, and the card's turn, are not rebuilt. */
export function HapticArea({ on, children }: { on: boolean; children: ReactNode }) {
  if (!onIOS()) return <>{children}</>;
  // role none: VoiceOver reads the card, not a switch named by all of it
  return <label className="haptic-area" role="none">{hidden(!on || !prefs().haptics)}{children}</label>;
}
