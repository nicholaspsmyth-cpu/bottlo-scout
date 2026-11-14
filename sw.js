// Bottlo Scout background helper: keeps the app shell handy and shows alerts.
const CACHE = "bottlo-scout-v2";
const SHELL = ["./", "index.html", "style.css", "app.js", "config.js", "icons/icon-192.png"];
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
  const d = e.data ? e.data.json() : { title: "🔔 Bottlo Scout deal!", body: "Open Bottlo Scout to see it." };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: "icons/icon-192.png" }));
});
self.addEventListener("notificationclick", e => { e.notification.close(); e.waitUntil(self.clients.openWindow("./")); });
