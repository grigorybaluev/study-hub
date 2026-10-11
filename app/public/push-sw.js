// Review reminders (#224), imported into the service worker (vite.config.ts, workbox importScripts).
// A scheduled workflow sends an empty push at the owner's hours; the text comes from the cards left
// today, which the app writes to a cache each time the deck changes (src/review/push.ts).
const STATE_CACHE = "study-hub-state";              // the same names in src/review/push.ts
const LEFT_URL = "./reminder-state.json";

async function message() {
  try {
    const res = await (await caches.open(STATE_CACHE)).match(LEFT_URL);
    const s = res && (await res.json());
    // a count from an earlier review day says nothing about today
    if (s && Date.now() < s.until) {
      if (s.left > 0) return { title: `${s.left} card${s.left === 1 ? "" : "s"} left today`, body: "A few minutes of review keeps the streak." };
      return { title: "Done for today", body: "Nothing left to review. Nice." };
    }
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
