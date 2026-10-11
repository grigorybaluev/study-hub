// Review reminders (#224): this phone's push subscription, and the day's progress for the reminder's text
// (#242). A scheduled workflow (.github/workflows/remind.yml) sends an empty push at the owner's hours to
// the subscription kept as the repo secret PUSH_SUBSCRIPTION; public/push-sw.js shows it.
import { onIOS } from "./feedback";
import type { DayProgress } from "./progress";

/** The public half of the VAPID pair (the private half is the repo secret VAPID_PRIVATE_KEY). */
const VAPID_PUBLIC_KEY = "BNOftj9zYlisgH2J90WpoiXWgnU1ov0L5d-pO-cUcaHUVCtUyEZPB1huwUabLCB9Q07n1t5XhBgWI20IVy6Okh8";
/** When reminders come (#235): the phone's morning Shortcut sends the day's calendar, see remind.yml. */
export const REMIND_AT = "in each break between the day's calendar events (the phone's morning Shortcut sends them), or at 9:00 and 20:00 on a day it sent none";

const STATE_CACHE = "study-hub-state";        // the same names in public/push-sw.js
const STATE_URL = "reminder-state.json";     // next to sw.js, where push-sw.js looks for it

/** Keep the day's progress where the service worker can read it when a reminder arrives (#242):
 *  `until`, the end of today's review day, after which `done` and `left` say nothing; `nextUntil`, the
 *  end of the next one, until which `next` is the morning's count. */
export function saveProgress(p: DayProgress, until: number, nextUntil: number) {
  if (!("caches" in window)) return;
  const state = { ...p, until, nextUntil };
  caches.open(STATE_CACHE)
    .then((c) => c.put(new URL(STATE_URL, document.baseURI).href, new Response(JSON.stringify(state), { headers: { "content-type": "application/json" } })))
    .catch(() => { /* the reminder says "Cards are due" */ });
}

/** `update`: the service worker with the push handler is installed but waits for a reload. */
export type PushState = "on" | "off" | "denied" | "install" | "update" | "unsupported";


/** The service worker, if this page has one (none in the dev server). */
async function worker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

/** Where reminders stand on this device: on an iPhone only the app added to the home screen can get them. */
export async function pushState(): Promise<{ state: PushState; subscription: string | null }> {
  if (!("PushManager" in window) || !("Notification" in window)) return { state: onIOS() ? "install" : "unsupported", subscription: null };
  if (Notification.permission === "denied") return { state: "denied", subscription: null };
  const reg = await worker();
  if (!reg) return { state: "unsupported", subscription: null };
  const sub = await reg.pushManager.getSubscription();
  if (sub) return { state: "on", subscription: JSON.stringify(sub) };
  // a subscription made under the old worker would get pushes it cannot show, and iOS drops such a one
  return { state: reg.waiting ? "update" : "off", subscription: null };
}

/** Ask for permission and subscribe; the subscription (JSON) goes to the repo secret PUSH_SUBSCRIPTION. */
export async function subscribe(): Promise<string> {
  if ((await Notification.requestPermission()) !== "granted") throw new Error("Notifications were not allowed.");
  const reg = await worker();
  if (!reg) throw new Error("This page has no service worker (the dev server has none).");
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key(VAPID_PUBLIC_KEY) });
  return JSON.stringify(sub);
}

export async function unsubscribe() {
  await (await (await worker())?.pushManager.getSubscription())?.unsubscribe();
}

/** base64url -> bytes, as pushManager.subscribe wants the key. */
function key(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}
