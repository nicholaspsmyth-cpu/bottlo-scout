// Bottlo Scout background helper: keeps the app shell handy and shows alerts.
const CACHE = "bottlo-scout-v5";
const SHELL = ["./", "index.html", "style.css", "app.js", "config.js", "icons/icon-192.png", "img/scotty.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(self.clients.claim()); });
// Network first, so prices are always fresh; fall back to the saved copy if you're offline.
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request)));
});
// Step 4 (background deal alerts) will send pushes here.
self.addEventListener("push", e => {
  let d = { title: "🔔 Bottlo Scout deal!", body: "Open Bottlo Scout to see it." };
  try { if (e.data) d = { ...d, ...e.data.json() }; } catch {}
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", data: { url: d.url || "./" } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (wins[0]) return wins[0].focus();
    return self.clients.openWindow(e.notification.data?.url || "./");
  })());
});
