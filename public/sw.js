/**
 * Offline cache for 隨身旅伴 TravelBuddy. The whole app is static, so the rules are simple:
 * a page load prefers the network, for a few seconds, and falls back to the cached shell, and
 * every other same-origin GET is served from the cache first. Bump CACHE to
 * ship a new build; the old cache is dropped on activate.
 *
 * All URLs are relative to the service worker's own scope, so the site works
 * from a GitHub Pages subpath as well as from the domain root.
 */
const CACHE = "travel-buddy-v3";
/** This app's cache names; other projects on the same origin keep theirs. */
const OWN_CACHE = /^travel-buddy-/;
const SHELL = ["./", "./index.html"];
/** Hashed assets referenced by index.html; see `precache`. */
const ASSET_HREF = /(?:src|href)="(\.\/assets\/[^"]+)"/g;
/** The icons and manifest index.html names: fetched by the first load, before this worker was there to keep them. */
const ICON_HREF = /href="(\.\/[\w.-]+\.(?:svg|png|webmanifest))"/g;

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  // Caching the script and stylesheet the shell names makes the very first
  // visit enough to go offline, without a build step that knows their hashes.
  const html = await (await cache.match("./index.html"))?.text();
  const assets = [ASSET_HREF, ICON_HREF].flatMap((pattern) => [...(html ?? "").matchAll(pattern)].map((match) => match[1]));
  await Promise.allSettled(assets.map((url) => cache.add(url)));
  // The home-screen icons are named in the manifest, not the page.
  try {
    const manifest = await (await cache.match("./manifest.webmanifest"))?.json();
    const icons = (manifest?.icons ?? []).map((icon) => icon.src).filter((src) => typeof src === "string" && src.startsWith("./"));
    await Promise.allSettled(icons.map((url) => cache.add(url)));
  } catch {
    // No manifest or not JSON: the app works without its icons.
  }
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
  event.respondWith(request.mode === "navigate" ? navigation(event) : asset(request));
});

/** Where the hashed build files live. */
const ASSETS = new URL("./assets/", self.registration.scope).href;
/** Where the static guide pages live: <scope>guide/<id>/. */
const GUIDE_PATH = new URL("./guide/", self.registration.scope).pathname;
/** The app's own page; any other page in scope (a static guide page) is not the shell. */
const SHELL_PATHS = new Set([new URL("./", self.registration.scope).pathname, new URL("./index.html", self.registration.scope).pathname]);
/**
 * How long a page load waits for the network before it uses the copy it has.
 * A weak signal (roaming, a platform underground, hotel Wi-Fi) often neither
 * answers nor fails: without a limit, 我需要幫忙 (I need help) would wait for it.
 */
const NETWORK_TIMEOUT = 4000;

/**
 * Pages: the network wins when it answers in time, so a new build is picked up
 * at once; when it doesn't, the cached copy is used and the network's answer,
 * whenever it comes, refreshes the cache for next time. A page never cached
 * waits for the network as long as it takes. Only the app's own page is stored
 * as the offline shell; another page (a static guide page) is kept under its
 * own address, so it never replaces the app.
 */
async function navigation(event) {
  const { request } = event;
  const url = new URL(request.url);
  const shell = SHELL_PATHS.has(url.pathname);
  // A page is the same page with or without ?fbclid=… from a share.
  const key = url.origin + url.pathname;
  // The copy to cache is taken at once, before the page can read the body.
  const network = fetch(request).then((response) => ({
    response,
    // A 404 page or a captive portal's answer must never become the offline shell.
    copy: response.ok && response.type === "basic" ? response.clone() : null,
  }));
  event.waitUntil(network.then(({ response, copy }) => copy && keep(copy, response, request, shell, key)).catch(() => {}));

  const cached = shell ? await cachedShell() : await caches.match(key, { ignoreVary: true });
  try {
    if (!cached) return (await network).response;
    const timer = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT, null));
    const answer = (await Promise.race([network, timer]))?.response;
    // An error is no better than no answer: use the copy. The app's page always exists, so any
    // error for it is passing (a redeploy, rate limiting); a guide page's 404 means it was removed.
    // A redirect (status 0 when not followed: the site moved) always passes.
    return answer && answer.status < (shell ? 400 : 500) ? answer : cached;
  } catch {
    if (cached) return cached;
    // A guide page never opened online: the same guide is in the app, which works offline.
    const guide = url.pathname.startsWith(GUIDE_PATH) ? /^([a-z0-9-]+)\/?$/.exec(url.pathname.slice(GUIDE_PATH.length))?.[1] : undefined;
    return guide ? Response.redirect(new URL(`./#/guide/${guide}`, self.registration.scope).href, 302) : Response.error();
  }
}

async function cachedShell() {
  return (await caches.match("./index.html")) ?? (await caches.match("./"));
}

/** Stores a page the network returned. A cache that refuses the write must not cost anything else. */
async function keep(copy, response, request, shell, key) {
  const cache = await caches.open(CACHE);
  if (shell) {
    // A new shell names new hashed files: store them first, and the shell only once they are
    // all in. Otherwise an offline start could load a shell whose script was never cached,
    // which shows a blank page.
    const named = (html) => [...html.matchAll(ASSET_HREF)].map((match) => match[1]);
    const assets = named(await copy.clone().text());
    const missing = [];
    for (const asset of assets) if (!(await cache.match(asset, { ignoreVary: true }))) missing.push(asset);
    await cache.addAll(missing);
    const previous = named((await (await cache.match("./index.html"))?.text()) ?? "");
    await cache.put("./index.html", copy);
    // Asset names are hashed per build: without this, every deploy would add its files to the phone
    // for good. The build being replaced keeps its files until the next page load, since a page may
    // have just opened it (the cached copy served while this download ran).
    const keep = new Set([...assets, ...previous].map((asset) => new URL(asset, self.registration.scope).href));
    // Only scripts and stylesheets: fonts and images a stylesheet names are not in `keep`, so they
    // are left alone. A lazy-loaded chunk would be dropped here too: the build has none, and adding
    // one needs this and precache() to learn about it.
    const stale = (await cache.keys()).filter((req) => {
      const url = req.url.split("?")[0];
      return url.startsWith(ASSETS) && /\.(?:js|css)$/.test(url) && !keep.has(url);
    });
    await Promise.all(stale.map((req) => cache.delete(req)));
    return;
  }
  // After a redirect (…/guide/x → …/guide/x/), keep it under the address it ended at:
  // a redirected response can't answer a navigation to the address that redirected.
  const final = new URL(response.url || request.url);
  await cache.put(response.redirected ? final.origin + final.pathname : key, copy).catch(() => {});
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
    // A full or refusing cache must not cost the response the page is waiting for.
    await cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}
