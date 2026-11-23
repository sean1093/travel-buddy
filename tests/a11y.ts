/**
 * What a person sees and what a screen reader says, for happy-dom tests.
 * happy-dom computes neither, so these follow the simple rules the app uses.
 */

/** Text a sighted person sees: everything but `.sr-only` text. */
export function visibleText(el: Element): string {
  const copy = el.cloneNode(true) as Element;
  for (const hidden of copy.querySelectorAll(".sr-only")) hidden.remove();
  return copy.textContent?.trim() ?? "";
}

/** The accessible name: aria-label if set, otherwise the text, sr-only text included. */
export function accessibleName(el: Element): string {
  return (el.getAttribute("aria-label") ?? el.textContent ?? "").trim();
}

/** Japanese a screen reader would read in a Chinese voice: kana inside an attribute or outside lang="ja". */
export const KANA = /[぀-ヿ]/;

/** What the app's live region says once the next frame has run (announce() sets it on a frame). */
export async function spoken(): Promise<string> {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('[aria-live="polite"][aria-atomic="true"]')?.textContent ?? "";
}
