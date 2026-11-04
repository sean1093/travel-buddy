import { isEmpty, loadProfile, type Profile, saveProfile } from "../profile/profile";
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
  history.replaceState(null, "", "#/imported");
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
  screen(root, "swap", "要換成新的資料嗎？", "這支手機裡已經有一份資料。換成連結裡的新資料，舊的就會被取代。", [
    h("button", { type: "button", class: BUTTON.primary, onclick: () => done(root, incoming) }, icon("check"), "換成新的"),
    h("a", { href: "#/", class: BUTTON.secondary }, "保留原本的"),
  ]);
}

function done(root: HTMLElement, profile: Profile): void {
  saveProfile(profile);
  const name = profile.callName ? `${profile.callName}，` : "";
  screen(root, "checkcircle", "設定完成", `${name}之後直接打開這個網站就好，不用再點連結。沒有網路也能用。`, [
    h("a", { href: "#/", class: BUTTON.primary }, "開始使用"),
  ]);
}

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
