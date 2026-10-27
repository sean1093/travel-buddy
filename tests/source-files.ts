import { readdirSync, readFileSync } from "node:fs";

/**
 * Every .ts file under src/, read once, with a "/"-separated path on every OS.
 * Leaves out src/content/validate.ts: it defines the @checked marker, so its
 * comments and messages spell the marker out. It holds rules, not dated facts.
 */
export const SOURCES: { path: string; text: string }[] = (() => {
  const root = new URL("../src/", import.meta.url);
  return (readdirSync(root, { recursive: true }) as string[])
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => file.endsWith(".ts") && file !== "content/validate.ts")
    .map((file) => ({ path: `src/${file}`, text: readFileSync(new URL(file, root), "utf8") }));
})();
