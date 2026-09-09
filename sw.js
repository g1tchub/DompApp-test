
const CACHE_PREFIX = "memory-mastery-" + self.registration.scope;
const CACHE = CACHE_PREFIX + "294572866a88f633";
const ASSETS = ["./index.html","./manifest.webmanifest","./src/app.js","./src/assets/dominic/dominic-coaching.png","./src/assets/dominic/dominic-congratulations.png","./src/assets/dominic/dominic-neutral.png","./src/assets/dominic/dominic-photo.png","./src/assets/favicon.svg","./src/assets/fonts/OFL.txt","./src/assets/fonts/noto-sans-italic-variable.ttf","./src/assets/fonts/noto-sans-variable.ttf","./src/assets/icons/icon-180.png","./src/assets/icons/icon-192.png","./src/assets/icons/icon-512.png","./src/brain.js","./src/content.js","./src/design-preview.css","./src/dominic.css","./src/foundations.css","./src/home-preview.css","./src/install.js","./src/learning.js","./src/storage.js","./src/styles.css","./src/typography.css"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    // Keep each installed version consistent; a new worker takes over after all app windows close.
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    if (event.request.mode === "navigate") return cache.match("./index.html");
    return fetch(event.request);
  }));
});
