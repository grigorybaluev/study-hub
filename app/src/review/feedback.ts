// Feedback a browser can give beyond the screen (#195): a haptic tick and a soft sound. Both are
// experiments where the platform allows them, and each can be switched off; the choices are per-device
// conveniences, so they live in localStorage (reads and writes may fail in a private window).
export interface FeedbackPrefs { motion: boolean; haptics: boolean; sound: boolean; badge: boolean }
const KEY = "study-hub-feedback";
const DEFAULTS: FeedbackPrefs = { motion: true, haptics: true, sound: false, badge: false };

let cached: FeedbackPrefs | null = null;

export function prefs(): FeedbackPrefs {
  if (!cached) {
    try { cached = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { cached = { ...DEFAULTS }; }
  }
  return cached!;
}

/** The settings toggles on the stats page (#195) write here. */
export function setPrefs(p: FeedbackPrefs) {
  cached = { ...p };
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* not kept: the defaults return next time */ }
}

/** Motion is on unless switched off here or the system asks for reduced motion. */
export function motionOn(): boolean {
  return prefs().motion && !matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// iOS has no Vibration API. Since iOS 18, toggling an <input type="checkbox" switch> through its label
// plays the system haptic, so a hidden one gives a tap: one fixed strength, so a longer buzz is two taps.
// Android gets navigator.vibrate with real lengths. Whether taps play in silent mode is the system's
// Sounds & Haptics setting.
let toggle: HTMLLabelElement | null = null;
function tap() {
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
}

/** Two phases (#223): "touch" as a finger lands on a grade button or a card starts to move; "short" as
 *  Again or Hard is let go; "long" for Good and Easy. */
export type Buzz = "touch" | "short" | "long";
const ANDROID_MS: Record<Buzz, number> = { touch: 4, short: 14, long: 32 };
export function haptic(kind: Buzz = "short") {
  if (!prefs().haptics || !matchMedia("(pointer: coarse)").matches) return;    // a phone or tablet only
  try {
    if ("vibrate" in navigator && /Android/i.test(navigator.userAgent)) { navigator.vibrate(ANDROID_MS[kind]); return; }
    tap();
    if (kind === "long") setTimeout(() => { try { tap(); } catch { /* one tap, then */ } }, 70);
  } catch { /* no haptics here */ }
}

let audio: AudioContext | null = null;
function context(): AudioContext {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) session.type = "ambient";     // on iOS the mute switch silences it
  audio ??= new AudioContext({ latencyHint: "interactive" });
  if (audio.state === "suspended") void audio.resume();
  return audio;
}

/** Start the audio as a finger lands, so the first click is not late (a context made later starts
 *  suspended and takes a moment to resume). */
export function warmUp() {
  if (!prefs().sound) return;
  try { context(); } catch { /* no sound here */ }
}

/** A short percussive click (#223): no fade-in, a pitch that drops, gone in 60 ms. */
export function tick(pitch = 660, at = 0) {
  if (!prefs().sound) return;
  try {
    const a = context(), t = a.currentTime + at;
    const osc = a.createOscillator(), gain = a.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(pitch * 1.6, t);
    osc.frequency.exponentialRampToValueAtTime(pitch, t + 0.025);
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  } catch { /* no sound here */ }
}

/** Each grade's click: lower for Again, brighter for Good and Easy. */
export const GRADE_PITCH: Record<1 | 2 | 3 | 4, number> = { 1: 300, 2: 470, 3: 760, 4: 1000 };

/** A level-up or a comeback: two quick rising clicks. */
export function chime() {
  tick(880);
  tick(1320, 0.07);
}
