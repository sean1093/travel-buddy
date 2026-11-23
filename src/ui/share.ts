import { isEmpty, loadProfile } from "../profile/profile";
import { shareUrl } from "../share/codec";
import { qrSvg } from "../share/qr";
import { BUTTON, h, icon } from "./dom";
import { page, section } from "./layout";

/** Above this, the QR code gets dense enough that some phones struggle to read it off a screen. */
const DENSE_QR = 1500;

export function renderShare(root: HTMLElement): void {
  const profile = loadProfile();
  if (isEmpty(profile)) {
    page(
      root,
      "分享",
      [
        h("p", { class: "mt-4 text-xl leading-relaxed" }, "還沒有填任何資料。先填好飯店、行程和聯絡人，再回來分享。"),
        h("a", { href: "#/setup", class: `${BUTTON.primary} mt-6` }, icon("edit"), "去填資料"),
      ],
      { back: "#/setup", backLabel: "設定資料" },
    );
    return;
  }
  const url = shareUrl(profile);
  // Empty until there is something to say, so it takes no space before then.
  const status = h("p", { class: "mt-2 text-center text-lg font-bold text-ok empty:mt-0", "aria-live": "polite" });
  const canShare = typeof navigator.share === "function";

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = "已複製，可以貼到 LINE 傳給旅客。";
    } catch {
      // Clipboard needs a secure context and permission; selecting lets the person copy by hand.
      // The text is folded away by default: unfold it so it can be selected by hand.
      linkDetails.open = true;
      linkBox.focus();
      linkBox.scrollIntoView({ block: "center" });
      linkBox.select();
      status.textContent = "請長按下面的連結，選「拷貝」。";
    }
  }

  async function share(): Promise<void> {
    try {
      await navigator.share({ title: "隨身旅伴", text: "點開這個連結，隨身旅伴就會帶入你的資料：", url });
    } catch {
      // Cancelled, or not allowed here: copying still works.
    }
  }

  const linkBox = h("textarea", {
    class: "mt-3 block h-28 w-full resize-none rounded-2xl bg-card p-3 font-mono text-sm text-ink ring-1 ring-muted/60",
    readonly: true,
    "aria-label": "分享連結",
    onfocus: (event: Event) => (event.target as HTMLTextAreaElement).select(),
  });
  linkBox.value = url;
  const linkDetails = h(
    "details",
    { class: "mt-3" },
    // inline-flex drops the native disclosure triangle, so draw one that turns when open.
    h(
      "summary",
      { class: "group inline-flex min-h-12 cursor-pointer list-none items-center gap-1 text-lg font-bold text-ai [&::-webkit-details-marker]:hidden" },
      icon("next", "h-5 w-5 transition-transform group-open:rotate-90"),
      "顯示連結文字",
    ),
    linkBox,
  );

  page(
    root,
    "分享給旅客",
    [
      h(
        "div",
        { class: "mt-2 flex gap-3 rounded-2xl bg-shu-soft p-4 text-lg leading-relaxed text-ink", role: "note" },
        h("span", { class: "shrink-0 text-shu" }, icon("alert", "h-7 w-7")),
        h(
          "p",
          null,
          h("b", { class: "text-shu" }, "這個連結裡有飯店地址、電話和健康資料。"),
          "只傳給本人，不要貼到群組或社群。任何拿到連結的人都看得到這些資料。",
        ),
      ),
      section(
        "1. 傳連結",
        canShare
          ? h("button", { type: "button", class: BUTTON.primary, onclick: () => void share() }, icon("share"), "分享連結")
          : null,
        h("button", { type: "button", class: `${canShare ? BUTTON.secondary : BUTTON.primary} mt-3`, onclick: () => void copy() }, icon("copy"), "複製連結"),
        status,
        linkDetails,
      ),
      section(
        "或 2. 用相機掃 QR code",
        h("p", { class: "mb-3 text-lg text-muted" }, "旅客用手機相機對準這個 QR code，點開出現的連結就好。"),
        h("div", { class: "mx-auto max-w-sm rounded-2xl bg-white p-2 ring-1 ring-hair" }, qrSvg(url)),
        url.length > DENSE_QR &&
          h("p", { class: "mt-2 text-lg text-muted" }, "資料比較多，QR code 比較密；掃不到的話請改用連結。"),
      ),
      section(
        "小提醒",
        h(
          "ul",
          { class: "list-disc space-y-2 pl-6 text-lg leading-relaxed" },
          h("li", null, "建議出發前一兩天再傳，並在出發當天打開一次：有些手機的瀏覽器會清掉太久沒開的網站資料。"),
          h("li", null, "打開連結後資料就存在旅客的手機裡，之後直接開網站就好，沒有網路也能用。"),
          h("li", null, "資料有改的話，這裡會產生新的連結，請重新傳一次。"),
          h("li", null, "也可以印一份護貝小卡帶著，手機沒電也不怕。"),
        ),
        h("a", { href: "#/print", class: `${BUTTON.secondary} mt-4` }, icon("print"), "列印護貝小卡"),
      ),
    ],
    { back: "#/setup", backLabel: "設定資料" },
  );
}
