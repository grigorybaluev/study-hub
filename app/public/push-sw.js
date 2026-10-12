// Review reminders (#224), imported into the service worker (vite.config.ts, workbox importScripts).
// A scheduled workflow sends a push in the owner's breaks ("remind") and on Sunday night ("week"); the
// text comes from the day's progress (#242) and the week (#243), which the app writes to a cache each time
// they change (src/review/push.ts). Each reminder's arrival is recorded for the week's "acted on".
const STATE_CACHE = "study-hub-state";              // the same names in src/review/push.ts
const STATE_URL = "./reminder-state.json";
const ARRIVALS_URL = "./reminder-arrivals.json";
const KEEP_ARRIVALS = 400;                           // about ten weeks of reminders

/** The day's progress as the app last saved it, or null when it says nothing about today. */
async function progress(now) {
  const res = await (await caches.open(STATE_CACHE)).match(STATE_URL);
  const s = res && (await res.json());
  if (!s) return null;
  if (now < s.until) return { done: s.done ?? 0, left: s.left };       // done: none in a state saved before #242
  // the app not opened yet this review day: the count it saved for it
  if (now < s.nextUntil) return { done: 0, left: s.next };
  return null;
}

/** The words for the day's progress at an hour of the day: the count in the morning, done out of the
 *  day's total during it, what is left to close it in the evening. Informative, never nagging. */
function words({ done, left }, hour) {
  const total = done + left, n = (k) => `${k} card${k === 1 ? "" : "s"}`;
  if (!total) return { title: "Nothing to review today", body: "No cards are due. Enjoy the day." };
  if (!left) return { title: "Done for today ✓", body: `All ${n(total)} reviewed. See you tomorrow.` };
  if (hour >= 18) return { title: `${left <= 20 ? "Just " : ""}${n(left)} left to close today`, body: done ? `${done} / ${total} done.` : "None done yet: 5–10 now make a start." };
  if (!done) return { title: `${n(total)} today`, body: hour < 12 ? "5–10 in each break and they are done by evening." : "None done yet: 5–10 in this break make a start." };
  return { title: `${done} / ${total} done · ${left} to go`, body: "5–10 cards in this break." };
}

/** The week as the app last saved it, while it is the current week. */
async function week(now) {
  const res = await (await caches.open(STATE_CACHE)).match(STATE_URL);
  const w = res && (await res.json())?.week;
  return w && now < w.until ? w : null;
}

/** The Sunday night summary: days closed, cards and time, recall and reminders acted on. */
function weekWords(w) {
  const m = Math.round(w.ms / 60_000), time = m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
  const recall = w.total ? `${Math.round((100 * w.passed) / w.total)} % recalled.` : "";
  const acted = w.arrived ? ` ${w.acted} of ${w.arrived} reminders led to a review.` : "";
  return { title: `Week: ${w.closed} / 7 days closed · ${w.cards} card${w.cards === 1 ? "" : "s"} · ${time}`, body: (recall + acted).trim() || "Open the stats for the week." };
}

async function weekMessage() {
  try {
    const w = await week(Date.now());
    if (w) return weekWords(w);
  } catch { /* the generic one */ }
  return { title: "Your week", body: "Open the stats for the week's summary." };
}

/** Keep when a reminder arrived (the app reads them back for the week). */
async function logArrival(at) {
  const cache = await caches.open(STATE_CACHE);
  const res = await cache.match(ARRIVALS_URL);
  const all = [...((res && (await res.json())) || []), at].slice(-KEEP_ARRIVALS);
  await cache.put(ARRIVALS_URL, new Response(JSON.stringify(all), { headers: { "content-type": "application/json" } }));
}

async function message() {
  try {
    const now = new Date(), day = await progress(now.getTime());
    if (day) return words(day, now.getHours());
  } catch { /* the generic reminder */ }
  return { title: "Cards are due", body: "Open your daily review." };
}

self.addEventListener("push", (event) => {
  const kind = event.data?.text() === "week" ? "week" : "remind";
  // iOS stops delivering to a subscription whose pushes show no notification, so every push shows one
  event.waitUntil((async () => {
    if (kind === "remind") await logArrival(Date.now()).catch(() => { /* not counted */ });
    const { title, body } = await (kind === "week" ? weekMessage() : message());
    const page = kind === "week" ? "./#/review/stats" : "./#/review";
    await self.registration.showNotification(title, {
      body, icon: "./pwa-192x192.png", badge: "./pwa-64x64.png", tag: kind === "week" ? "review-week" : "review-reminder", data: { page },
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.page ?? "./#/review", self.registration.scope).href;
  event.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const client = open.find((c) => c.url.startsWith(self.registration.scope));
    if (client) {
      await client.focus();
      // navigate() works only on a window this worker controls (not a first load or a hard reload)
      try { return await client.navigate(url); } catch { /* opened below */ }
    }
    return self.clients.openWindow(url);
  })());
});
