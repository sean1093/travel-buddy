/**
 * Offline cache for 隨身旅伴 TravelBuddy. The whole app is static, so the rules are simple:
 * a page load prefers the network and falls back to the cached shell, and
 * every other same-origin GET is served from the cache first. Bump CACHE to
 * ship a new build; the old cache is dropped on activate.
 *
 * All URLs are relative to the service worker's own scope, so the site works
 * from a GitHub Pages subpath as well as from the domain root.
 */
const CACHE = "travel-buddy-v2";
/** This app's cache names; other projects on the same origin keep theirs. */
const OWN_CACHE = /^travel-buddy-/;
const SHELL = ["./", "./index.html"];
/** Hashed assets referenced by index.html; see `precache`. */
const ASSET_HREF = /(?:src|href)="(\.\/assets\/[^"]+)"/g;

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  // Caching the script and stylesheet the shell names makes the very first
  // visit enough to go offline, without a build step that knows their hashes.
  const html = await (await cache.match("./index.html"))?.text();
  const assets = [...(html ?? "").matchAll(ASSET_HREF)].map((match) => match[1]);
  await Promise.allSettled(assets.map((url) => cache.add(url)));
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      // Cache storage is per origin, and a GitHub Pages account serves every
      // project from one: only ever drop this app's own caches.
      .then((keys) => Promise.all(keys.filter((key) => OWN_CACHE.test(key) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? navigation(request) : asset(request));
});

/** The app's own page; any other page in scope (a static guide page) is not the shell. */
const SHELL_PATHS = new Set([new URL("./", self.registration.scope).pathname, new URL("./index.html", self.registration.scope).pathname]);

/**
 * Pages: the network wins when it answers, so a new build is picked up at once.
 * Only the app's own page is stored as the offline shell; another page (a static
 * guide page) is kept under its own address, so it never replaces the app.
 */
async function navigation(request) {
  const url = new URL(request.url);
  const shell = SHELL_PATHS.has(url.pathname);
  // A page is the same page with or without ?fbclid=… from a share.
  const key = url.origin + url.pathname;
  try {
    const response = await fetch(request);
    // A 404 page or a captive portal's answer must never become the offline
    // shell, and a cache that refuses the write must not cost a good response.
    if (response.ok && response.type === "basic") {
      const cache = await caches.open(CACHE);
      await cache.put(shell ? "./index.html" : key, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    if (shell) return (await caches.match("./index.html")) ?? (await caches.match("./")) ?? Response.error();
    const cached = await caches.match(key, { ignoreVary: true });
    if (cached) return cached;
    // A guide page never opened online: the same guide is in the app, which works offline.
    const guide = /\/guide\/([a-z0-9-]+)\/?$/.exec(url.pathname)?.[1];
    return guide ? Response.redirect(new URL(`./#/guide/${guide}`, self.registration.scope).href, 302) : Response.error();
  }
}

/**
 * Everything else: the cache wins, and anything new is kept for next time.
 * ignoreVary: the app's script and stylesheet are requested with `crossorigin`,
 * so they carry an Origin header the precache requests didn't; a server that
 * answers `Vary: Origin` would make every cached copy miss, and the app would
 * load nothing offline. Same-origin, hashed files don't vary by origin.
 */
async function asset(request) {
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}
