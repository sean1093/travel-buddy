import type { Line } from "../profile/cards";
import { h } from "./dom";

/**
 * One extra line of a card. A phone number stays on one line with its "TEL"
 * and shrinks on narrow screens rather than break; a labelled number (the
 * 010 form) may wrap after its label, never inside the number.
 */
export function lineNode(line: Line, cls = ""): HTMLElement {
  if (typeof line === "string") return h("p", { class: `break-words ${cls}` }, line);
  // Up to 20 characters on one line ("TEL +886 912-345-678", "010-886-912-345-678）"): shrinks to fit.
  const number = h("span", { class: "inline-block whitespace-nowrap text-[min(1em,7vw)]" }, line.label ? `${line.phone}）` : `TEL\u00a0${line.phone}`);
  return h("p", { class: cls }, line.label && `（${line.label}：`, number);
}
