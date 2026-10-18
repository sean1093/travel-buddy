import { readFileSync } from "node:fs";

/** src/style.css as text. Read from disk: Vitest stubs CSS imports, even with ?raw. */
export const css = readFileSync(new URL("../src/style.css", import.meta.url), "utf8");

/**
 * The `--name: R G B;` tokens of one theme block in src/style.css. Throws when
 * the block is missing, so a renamed selector fails loudly instead of reading
 * another block.
 */
export function tokens(selector: string): Record<string, number[]> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`no "${selector} {" block in style.css`);
  const block = css.slice(start, css.indexOf("}", start));
  const out: Record<string, number[]> = {};
  for (const [, name, r, g, b] of block.matchAll(/--([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+);/g)) {
    out[name!] = [Number(r), Number(g), Number(b)];
  }
  return out;
}

/** A token as #rrggbb. */
export function hex([r, g, b]: number[]): string {
  return `#${[r, g, b].map((c) => c!.toString(16).padStart(2, "0")).join("")}`;
}
