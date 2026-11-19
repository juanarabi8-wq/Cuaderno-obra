// Guarda la app en el móvil para que abra sin cobertura.
const VERSION = "obra-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Página: primero la red (para recibir mejoras), si no hay cobertura la copia guardada.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(ca => ca.put("index.html", c)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // Resto (iconos, tipografías): la copia guardada y se actualiza por detrás.
  if (url.origin === location.origin || url.host.endsWith("fonts.googleapis.com") || url.host.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.open(VERSION).then(async ca => {
      const hit = await ca.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") ca.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
