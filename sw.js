
const CACHE_PREFIX = "memory-mastery-" + self.registration.scope;
const CACHE = CACHE_PREFIX + "b44f30ea77c9e03e";
const ASSETS = ["./index.html","./manifest.webmanifest","./src/app.js","./src/assets/dominic/dominic-coaching.png","./src/assets/dominic/dominic-congratulations.png","./src/assets/dominic/dominic-neutral.png","./src/assets/dominic/dominic-photo.png","./src/assets/favicon.svg","./src/assets/fonts/OFL.txt","./src/assets/fonts/noto-sans-italic-variable.ttf","./src/assets/fonts/noto-sans-variable.ttf","./src/assets/icons/icon-180.png","./src/assets/icons/icon-192.png","./src/assets/icons/icon-512.png","./src/assets/lessons/first-win-scene-final.png","./src/assets/lessons/first-win-scene.mp4","./src/assets/lessons/independent-scene-final.png","./src/assets/lessons/independent-scene.mp4","./src/assets/lessons/lemon-final.png","./src/assets/lessons/lemon-kitchen.png","./src/assets/lessons/lemon-object.png","./src/assets/lessons/lemon-scene-final.png","./src/assets/lessons/lemon-scene.mp4","./src/assets/lessons/linking-scene-final.png","./src/assets/lessons/linking-scene.mp4","./src/assets/lessons/my-journey-scene-final.png","./src/assets/lessons/my-journey-scene.mp4","./src/assets/lessons/real-life-scene-final.png","./src/assets/lessons/real-life-scene.mp4","./src/assets/lessons/reflect-scene-final.png","./src/assets/lessons/reflect-scene.mp4","./src/brain.js","./src/content.js","./src/design-preview.css","./src/dominic.css","./src/foundations.css","./src/home-preview.css","./src/install.js","./src/journey-walk.js","./src/learning.js","./src/lesson-media.js","./src/lesson-scenes.js","./src/lesson-visual.css","./src/lesson-visual.js","./src/media-response.js","./src/storage.js","./src/styles.css","./src/typography.css"];
const respondToMediaRange = async function respondToMediaRange(request, response) {
  const range = request.headers.get("range");
  if (!range || response.status !== 200) return response;
  const bytes = await response.arrayBuffer();
  const size = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  const unsatisfiable = () =>
    new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" },
    });
  if (!match || (!match[1] && !match[2]) || !size) return unsatisfiable();
  let start = match[1]
    ? Number(match[1])
    : Math.max(0, size - Number(match[2]));
  let end = match[1] && match[2] ? Number(match[2]) : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    (!match[1] &&
      (!Number.isSafeInteger(Number(match[2])) || Number(match[2]) <= 0)) ||
    start >= size ||
    start > end
  )
    return unsatisfiable();
  end = Math.min(end, size - 1);
  const headers = new Headers(response.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  headers.set("Accept-Ranges", "bytes");
  headers.delete("Content-Encoding");
  return new Response(
    request.method === "HEAD" ? null : bytes.slice(start, end + 1),
    {
      status: 206,
      headers,
    },
  );
};
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
    if (cached) return url.pathname.endsWith(".mp4") ? respondToMediaRange(event.request, cached) : cached;
    if (event.request.mode === "navigate") return cache.match("./index.html");
    return fetch(event.request);
  }));
});
