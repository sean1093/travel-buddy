import "./style.css";
import { onVoicesChanged } from "./lib/speech";
import { applySettings } from "./state";
import { focusHeading } from "./ui/dom";
import { setTitle } from "./ui/layout";
import { renderGuide, renderTools } from "./ui/guide";
import { renderHelp } from "./ui/help";
import { renderHome } from "./ui/home";
import { renderHotel } from "./ui/hotel";
import { renderImport, renderImported } from "./ui/import";
import { hush } from "./ui/japanese";
import { renderPrint } from "./ui/print";
import { renderScene } from "./ui/scene";
import { renderMedical } from "./ui/medical";
import { renderSettings } from "./ui/settings";
import { renderSetup } from "./ui/setup";
import { renderShare } from "./ui/share";

/** `args` are the path segments after the page name: `#/scene/transport` → ["transport"]. */
type Page = (root: HTMLElement, args: string[]) => void;

/**
 * Every page, by the first path segment of the hash. Routing lives in the
 * hash so the static build works from any GitHub Pages subpath.
 */
const PAGES: Record<string, Page> = {
  "": renderHome,
  guide: renderGuide,
  help: renderHelp,
  hotel: renderHotel,
  medical: renderMedical,
  print: renderPrint,
  scene: renderScene,
  settings: renderSettings,
  setup: renderSetup,
  share: renderShare,
  tools: renderTools,
  s: renderImport,
  imported: renderImported,
};

const root = document.getElementById("app") as HTMLElement;
/** The first render is the page that was opened: moving focus there would be noise. */
let routed = false;

function route(): void {
  hush();
  window.scrollTo(0, 0);
  const [name = "", ...args] = location.hash.replace(/^#\/?/, "").split("/");
  // hasOwn: the name comes from the URL, and "constructor" must not reach Object.prototype.
  const render = Object.hasOwn(PAGES, name) ? PAGES[name]! : PAGES[""]!;
  // A safety net: every page sets its own title, but one that forgets gets home's, never the previous page's.
  setTitle();
  render(root, args);
  if (routed) focusHeading(root);
  routed = true;
}

applySettings();
// The system theme can change while the app is open (e.g. at sunset).
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applySettings);
// The voice list arrives late on some browsers; the settings page shows it.
onVoicesChanged(() => {
  if (location.hash.startsWith("#/settings")) route();
});
window.addEventListener("hashchange", route);
route();

// Offline use: only the built site has a service worker to register, and the
// URL stays relative so it also works from a GitHub Pages subpath.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => void navigator.serviceWorker.register("./sw.js"));
}
