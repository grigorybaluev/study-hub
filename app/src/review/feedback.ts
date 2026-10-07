// Feedback a browser can give beyond the screen (#195): a haptic tick and a soft sound. Both are
// experiments where the platform allows them, and each can be switched off; the choices are per-device
// conveniences, so they live in localStorage (reads and writes may fail in a private window).
export interface FeedbackPrefs { motion: boolean; haptics: boolean; sound: boolean }
const KEY = "study-hub-feedback";
const DEFAULTS: FeedbackPrefs = { motion: true, haptics: true, sound: false };

export function prefs(): FeedbackPrefs {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return { ...DEFAULTS }; }
}

export function setPrefs(p: FeedbackPrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* not kept: the defaults return next time */ }
}

/** Motion is on unless switched off here or the system asks for reduced motion. */
export function motionOn(): boolean {
  return prefs().motion && !matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// iOS has no Vibration API. Since iOS 18, toggling an <input type="checkbox" switch> through its label
// plays the system haptic, so a hidden one gives a tick. Elsewhere navigator.vibrate is tried.
let toggle: HTMLLabelElement | null = null;
export function haptic() {
  if (!prefs().haptics || !matchMedia("(pointer: coarse)").matches) return;    // a phone or tablet only
  try {
    if ("vibrate" in navigator && /Android/i.test(navigator.userAgent)) { navigator.vibrate(8); return; }
    if (!toggle) {
      toggle = document.createElement("label");
      toggle.setAttribute("aria-hidden", "true");
      toggle.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;left:-10px;top:0";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("switch", "");
      input.tabIndex = -1;
      toggle.appendChild(input);
      document.body.appendChild(toggle);
    }
    // the click moves focus into the hidden checkbox; give it back, or keys would go to that input
    const before = document.activeElement as HTMLElement | null;
    toggle.click();
    (toggle.firstChild as HTMLInputElement).blur();
    before?.focus?.({ preventScroll: true });
  } catch { /* no haptics here */ }
}

let audio: AudioContext | null = null;
/** A short soft tick (off by default). On iOS the "ambient" audio session lets the mute switch silence it. */
export function tick(pitch = 660) {
  if (!prefs().sound) return;
  try {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = "ambient";
    audio ??= new AudioContext();
    const t = audio.currentTime, osc = audio.createOscillator(), gain = audio.createGain();
    osc.frequency.value = pitch;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  } catch { /* no sound here */ }
}
