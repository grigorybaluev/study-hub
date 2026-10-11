// Review reminders (#224), imported into the service worker (vite.config.ts, workbox importScripts).
// A scheduled workflow sends an empty push at the owner's hours; the text comes from the day's progress
// (#242), which the app writes to a cache each time it changes (src/review/push.ts).
const STATE_CACHE = "study-hub-state";              // the same names in src/review/push.ts
const STATE_URL = "./reminder-state.json";

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

async function message() {
  try {
    const now = new Date(), day = await progress(now.getTime());
    if (day) return words(day, now.getHours());
  } catch { /* the generic reminder */ }
  return { title: "Cards are due", body: "Open your daily review." };
}

self.addEventListener("push", (event) => {
  // iOS stops delivering to a subscription whose pushes show no notification, so every push shows one
  event.waitUntil(message().then(({ title, body }) =>
    self.registration.showNotification(title, { body, icon: "./pwa-192x192.png", badge: "./pwa-64x64.png", tag: "review-reminder" })));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL("./#/review", self.registration.scope).href;
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
