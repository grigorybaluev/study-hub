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

// iOS has no Vibration API. A tap on a button or the card is felt through HapticTap (a real tap on a
// hidden switch). tap() is the fallback for the rest (a swipe, a key): a script click on a fresh hidden
// switch, which plays the system haptic on older WebKit and nothing on newer (the owner's iPhone, #223).
// One fixed strength, so a longer buzz is two taps. Android gets navigator.vibrate with real lengths.
// Whether taps play in silent mode is the system's Sounds & Haptics setting.
function tap() {
  const label = document.createElement("label");
  label.ariaHidden = "true";
  label.style.display = "none";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  label.remove();
}

let ios: boolean | null = null;
/** An iPhone or iPad (iPadOS Safari says Macintosh; a touch screen gives it away); read once. */
export function onIOS(): boolean {
  ios ??= /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return ios;
}

/** A tap's action on iOS waits for the next task: the hidden switch under the finger gets the tap's click
 *  after the click's handlers, and a re-render first would remove or disable it (no vibration). */
export function afterTap(f: () => void) {
  if (onIOS()) setTimeout(f, 0); else f();
}

/** Two phases (#223): "touch" as a finger lands on a grade button or a card starts to move; "short" as
 *  Again or Hard is let go; "long" for Good and Easy. */
export type Buzz = "touch" | "short" | "long";
const ANDROID_MS: Record<Buzz, number> = { touch: 4, short: 14, long: 32 };
/** `test`: the settings' test buttons, which play whatever the setting and the screen. `tapped`: a finger's
 *  tap on a HapticTap or HapticArea, already felt on iOS. */
export function haptic(kind: Buzz = "short", { test = false, tapped = false } = {}) {
  if (tapped && onIOS()) return;
  if (!test && (!prefs().haptics || !matchMedia("(pointer: coarse)").matches)) return;    // a phone or tablet only
  try {
    if ("vibrate" in navigator && /Android/i.test(navigator.userAgent)) { navigator.vibrate(ANDROID_MS[kind]); return; }
    tap();
    if (kind === "long") setTimeout(() => { try { tap(); } catch { /* one tap, then */ } }, 120);   // closer, iOS plays one
  } catch { /* no haptics here */ }
}

let audio: AudioContext | null = null;
function context(): AudioContext {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) session.type = "ambient";     // on iOS the mute switch silences it
  audio ??= new AudioContext({ latencyHint: "interactive" });
  if (audio.state === "suspended") audio.resume().catch(() => { /* resumed by the next gesture */ });
  return audio;
}

/** Start the audio as a finger lands, so the first click is not late (a context made later starts
 *  suspended and takes a moment to resume). */
export function warmUp() {
  if (!prefs().sound) return;
  try { context(); } catch { /* no sound here */ }
}

/** A pitched blip: `from` to `to` Hz over `glide` s, gone by `len` s. */
function blip(a: AudioContext, t: number, type: OscillatorType, from: number, to: number, glide: number, len: number, gain: number) {
  const osc = a.createOscillator(), g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + glide);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + len + 0.01);
}

/** A short percussive click (#223): no fade-in, a pitch that drops, gone in 60 ms. */
export function tick(pitch = 660, at = 0) {
  if (!prefs().sound) return;
  try { const a = context(); blip(a, a.currentTime + at, "triangle", pitch * 1.6, pitch, 0.025, 0.06, 0.16); } catch { /* no sound here */ }
}

// 20 ms of decaying noise, made once per audio context
let noise: AudioBuffer | null = null;
/** A burst of noise through a band-pass: the "snap" of Good and Easy. */
function snap(a: AudioContext, t: number, freq = 3200, gain = 0.22) {
  if (!noise || noise.sampleRate !== a.sampleRate) {
    const n = Math.ceil(a.sampleRate * 0.02);
    noise = a.createBuffer(1, n, a.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  }
  const src = a.createBufferSource(), band = a.createBiquadFilter(), g = a.createGain();
  src.buffer = noise;
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = 1.2;
  g.gain.value = gain;
  src.connect(band).connect(g).connect(a.destination);
  src.start(t);
}

/** Each grade's sound (#223): Again a low thock, Hard a click, Good a crisp snap, Easy the snap with a
 *  rising chirp. All percussive, no fade-in, under 80 ms but Easy's chirp. `at`: seconds from now. */
export function gradeSound(r: 1 | 2 | 3 | 4, at = 0) {
  if (!prefs().sound) return;
  try {
    const a = context(), t = a.currentTime + at;
    if (r === 1) blip(a, t, "sine", 210, 85, 0.04, 0.09, 0.42);
    else if (r === 2) blip(a, t, "triangle", 760, 470, 0.025, 0.06, 0.16);
    else {
      snap(a, t);
      blip(a, t, "triangle", 1250, 820, 0.02, 0.05, 0.12);
      if (r === 4) blip(a, t + 0.035, "sine", 900, 1800, 0.08, 0.11, 0.1);
    }
  } catch { /* no sound here */ }
}

/** A level-up or a comeback: two quick rising clicks. */
export function chime() {
  tick(880);
  tick(1320, 0.07);
}
