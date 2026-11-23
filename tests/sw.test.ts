import { readFileSync } from "node:fs";
import { runInNewContext, Script } from "node:vm";
import { describe, expect, it } from "vitest";

// public/sw.js is plain JavaScript outside the typechecked bundle. If it doesn't
// parse, the browser silently keeps no service worker and the app stops working
// offline, with nothing failing at build time.
const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

describe("service worker (public/sw.js)", () => {
  it("parses as a script", () => {
    expect(() => new Script(source, { filename: "sw.js" })).not.toThrow();
  });
});

// Page loads, run in a sandbox with a fake cache and network. The e2e offline
// journeys cover the real browser; these cover what e2e can't time: a network
// that neither answers nor fails.

const SCOPE = "https://example.test/japan/";
const shellHtml = (script: string) => `<!doctype html><script type="module" crossorigin src="./assets/${script}"></script>`;

/** A same-origin response, as a browser's fetch returns it (type "basic"). */
function page(body: string, status = 200): Response {
  const response = new Response(body, { status, headers: { "content-type": "text/html" } });
  Object.defineProperty(response, "type", { value: "basic" });
  return response;
}

type Fetch = (url: string) => Promise<Response>;

/** Loads sw.js with `fetch` as its network. `slow`: the network-timeout timer fires at once. */
function worker(network: Fetch, { slow = false } = {}) {
  const listeners: Record<string, (event: unknown) => void> = {};
  const stored = new Map<string, Response>();
  const abs = (u: string | { url: string }) => new URL(typeof u === "string" ? u : u.url, `${SCOPE}sw.js`).href;
  const get = (u: string) => network(abs(u)).then((r) => (r.ok ? r : Promise.reject(new TypeError(`${r.status}`))));
  const cache = {
    match: async (u: string) => stored.get(abs(u))?.clone(),
    put: async (u: string, r: Response) => void stored.set(abs(u), r),
    add: async (u: string) => void stored.set(abs(u), await get(u)),
    addAll: async (urls: string[]) => {
      const responses = await Promise.all(urls.map(get));
      urls.forEach((u, i) => stored.set(abs(u), responses[i]!));
    },
  };
  const context = {
    self: {
      addEventListener: (type: string, listener: (event: unknown) => void) => (listeners[type] = listener),
      location: new URL(`${SCOPE}sw.js`),
      registration: { scope: SCOPE },
      skipWaiting: async () => undefined,
    },
    caches: { open: async () => cache, match: (u: string) => cache.match(u) },
    fetch: (request: { url: string }) => network(request.url),
    setTimeout: (fn: (arg: unknown) => void, _ms: number, arg: unknown) => (slow ? queueMicrotask(() => fn(arg)) : 0),
    Response,
    URL,
    Set,
  };
  runInNewContext(source, context);

  return {
    stored,
    async install() {
      let done!: Promise<unknown>;
      listeners.install!({ waitUntil: (p: Promise<unknown>) => (done = p) });
      await done;
    },
    async seed(path: string, body: string) {
      stored.set(abs(path), page(body));
    },
    /** Opens `path` (relative to the scope); `done` settles once the worker has stored what it fetched. */
    open(path: string) {
      let answer!: Promise<Response>;
      const waits: Promise<unknown>[] = [];
      listeners.fetch!({
        request: { method: "GET", mode: "navigate", url: SCOPE + path },
        respondWith: (p: Promise<Response>) => (answer = p),
        waitUntil: (p: Promise<unknown>) => waits.push(p),
      });
      return { answer, done: Promise.all(waits) };
    },
  };
}

describe("first visit (sw.js install)", () => {
  it("keeps the app, its script and its icons, so the first visit is enough to go offline", async () => {
    const html = `${shellHtml("index-a.js")}<link rel="icon" href="./favicon.svg" /><link rel="manifest" href="./manifest.webmanifest" /><a href="./guide/tax-refund/">`;
    const manifest = JSON.stringify({ icons: [{ src: "./icon-192.png" }, { src: "https://elsewhere.test/x.png" }] });
    const sw = worker(async (url) => page(url.endsWith("/japan/") || url.endsWith("index.html") ? html : url.endsWith(".webmanifest") ? manifest : "file"));
    await sw.install();
    expect([...sw.stored.keys()].map((u) => u.slice(SCOPE.length)).sort()).toEqual(
      ["", "assets/index-a.js", "favicon.svg", "icon-192.png", "index.html", "manifest.webmanifest"].sort(),
    );
  });
});

const never: Fetch = () => new Promise(() => {});
const offline: Fetch = () => Promise.reject(new TypeError("Failed to fetch"));

describe("page loads (sw.js navigation)", () => {
  it("opens the cached app when the network neither answers nor fails", async () => {
    const sw = worker(never, { slow: true });
    await sw.seed("./index.html", "cached app");
    expect(await (await sw.open("").answer).text()).toBe("cached app");
  });

  it("waits for the network, however slow, for a page it has no copy of", async () => {
    let answer!: (r: Response) => void;
    const sw = worker(() => new Promise((resolve) => (answer = resolve)), { slow: true });
    const { answer: response } = sw.open("guide/tax-refund/");
    await new Promise((resolve) => setTimeout(resolve, 10));
    answer(page("guide page"));
    expect(await (await response).text()).toBe("guide page");
  });

  it("prefers the network when it answers in time, and keeps the new app with its script", async () => {
    const sw = worker(async (url) => page(url.endsWith(".js") ? "script" : shellHtml("index-new.js")));
    await sw.seed("./index.html", "old app");
    const { answer, done } = sw.open("");
    expect(await (await answer).text()).toBe(shellHtml("index-new.js"));
    await done;
    expect(await sw.stored.get(`${SCOPE}index.html`)!.text()).toBe(shellHtml("index-new.js"));
    expect(sw.stored.has(`${SCOPE}assets/index-new.js`)).toBe(true);
  });

  it("keeps the old app when the new one's script can't be cached, so offline never opens blank", async () => {
    const sw = worker(async (url) => (url.endsWith(".js") ? page("", 503) : page(shellHtml("index-new.js"))));
    await sw.seed("./index.html", shellHtml("index-old.js"));
    await sw.seed("./assets/index-old.js", "old script");
    const { answer, done } = sw.open("");
    expect(await (await answer).text()).toBe(shellHtml("index-new.js"));
    await done;
    expect(await sw.stored.get(`${SCOPE}index.html`)!.text()).toBe(shellHtml("index-old.js"));
  });

  it("opens the cached app instead of an error page (a captive portal's, a 5xx), and never keeps the error", async () => {
    const sw = worker(async () => page("captive portal", 503));
    await sw.seed("./index.html", "cached app");
    const { answer, done } = sw.open("");
    expect(await (await answer).text()).toBe("cached app");
    await done;
    expect(await sw.stored.get(`${SCOPE}index.html`)!.text()).toBe("cached app");
  });

  it("shows the error page for a page it has no copy of", async () => {
    const sw = worker(async () => page("not found", 404));
    expect((await sw.open("guide/nope/").answer).status).toBe(404);
  });

  it("offline: opens the cached app, and sends a guide page never opened to the same guide in the app", async () => {
    const sw = worker(offline);
    await sw.seed("./index.html", "cached app");
    expect(await (await sw.open("?openExternalBrowser=1").answer).text()).toBe("cached app");
    const redirect = await sw.open("guide/tax-refund/").answer;
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get("location")).toBe(`${SCOPE}#/guide/tax-refund`);
  });
});
