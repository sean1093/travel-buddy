import { isEmpty, loadProfile, type Profile, saveProfile } from "../profile/profile";
import { keepStorage } from "../lib/store";
import { decodeProfile } from "../share/codec";
import { BUTTON, fill, focusHeading, h, icon, type IconName } from "./dom";
import { setTitle } from "./layout";

/**
 * `#/s/<payload>`: a shared profile arriving. The URL is replaced at once so
 * the personal data does not linger in the address bar, history or a
 * bookmark; from then on it lives only in this phone's storage.
 */
export function renderImport(root: HTMLElement, [payload = ""]: string[]): void {
  const incoming = decodeProfile(payload);
  // The path alone: a query the link carried (?openExternalBrowser=1 for LINE) goes too. Home until
  // something is saved (done() says #/imported), so going back after 保留原本的 doesn't say 設定完成.
  history.replaceState(null, "", `${location.pathname}#/`);
  if (!incoming) {
    screen(root, "alert", "這個連結好像不完整", "請重新傳一次連結，或重新掃一次 QR code。", [
      h("a", { href: "#/", class: BUTTON.primary }, "回首頁"),
    ]);
    return;
  }
  const current = loadProfile();
  if (isEmpty(current) || JSON.stringify(current) === JSON.stringify(incoming)) {
    done(root, incoming);
    return;
  }
  // Whose is whose: one parent opening the other's link must not wipe their own card unawares.
  screen(root, "swap", "要換成新的資料嗎？", `這支手機裡已經有「${who(current)}」的資料。換成連結裡「${who(incoming)}」的資料，原本的就會被取代。`, [
    h("button", { type: "button", class: BUTTON.primary, onclick: () => done(root, incoming) }, icon("check"), "換成新的"),
    h("a", { href: "#/", class: BUTTON.secondary }, "保留原本的"),
  ]);
}

/** How a profile is named to the person choosing: its call name, else the passport name. */
const who = (profile: Profile) => profile.callName.trim() || profile.passportName.trim().toUpperCase() || "沒有稱呼";

function done(root: HTMLElement, profile: Profile): void {
  saveProfile(profile);
  history.replaceState(null, "", `${location.pathname}#/imported`);
  const name = profile.callName ? `${profile.callName}，` : "";
  screen(root, "checkcircle", "設定完成", `${name}之後直接打開這個網站就好，不用再點連結。沒有網路也能用。`, [
    ...(homeScreenSharesStorage() ? [h("p", { class: "text-lg leading-relaxed text-muted" }, HOME_SCREEN_TIP)] : []),
    // Asked on a deliberate tap, not as the screen opens: Firefox shows a prompt for it.
    h("a", { href: "#/", class: BUTTON.primary, onclick: keepStorage }, "開始使用"),
  ]);
}

/** Shown when setup arrives: an icon is easier to find again than a link in a chat. */
export const HOME_SCREEN_TIP = "建議把這個網站加到手機主畫面，下次點圖示就能打開。";

/**
 * Android's own browser only. On iPhone and iPad an app added to the home
 * screen keeps its own storage, apart from Safari's, so it would open without
 * what was just saved (docs/spec.md); a computer has no home screen; and an
 * app's built-in browser (LINE, Facebook, Instagram: "; wv)") can't add one.
 */
const homeScreenSharesStorage = () => {
  const agent = navigator.userAgent;
  return /Android/.test(agent) && !/; wv\)| Line\/|FBAN|FB_IAB|Instagram/.test(agent);
};

function screen(root: HTMLElement, glyph: IconName, title: string, body: string, actions: HTMLElement[]): void {
  setTitle(title);
  fill(
    root,
    h(
      "main",
      { class: "pt-safe flex min-h-dvh flex-col justify-center gap-4 px-6 pb-10 text-center" },
      h("p", { class: "flex justify-center text-ai" }, icon(glyph, "h-16 w-16")),
      h("h1", { class: "text-3xl font-bold" }, title),
      h("p", { class: "text-xl leading-relaxed" }, body),
      h("div", { class: "mt-4 space-y-3" }, actions),
    ),
  );
  focusHeading(root);
}

/** `#/imported`: what a reload of the finished import shows. */
export function renderImported(root: HTMLElement): void {
  done(root, loadProfile());
}
