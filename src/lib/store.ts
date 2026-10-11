/**
 * App data lives in localStorage, one key per store. Values are written as
 * `{ v, data }` so a later release can recognise an older shape and migrate
 * it. Adapted from Ippo (github.com/sean1093/ippo).
 */
export interface Store<T> {
  load(): T;
  save(value: T): void;
  clear(): void;
}

/** Storage key prefix of the Japan edition; index.html reads the settings key directly. */
export const STORE_PREFIX = "travelbuddy.japan.";

/**
 * Defines the store `travelbuddy.japan.<name>`. `parse` receives whatever was
 * saved (or `undefined`) with the version it was saved under, and must always
 * return a well-formed value: storage is user-editable and may hold anything.
 *
 * Every country edition shares the origin (sean1093.github.io), so each one
 * keeps its data under its own prefix.
 */
export function defineStore<T>(
  name: string,
  version: number,
  parse: (data: unknown, savedVersion: number) => T,
): Store<T> {
  const key = `${STORE_PREFIX}${name}`;
  return {
    load() {
      const wrapped = asRecord(parseJson(read(key)));
      return wrapped && typeof wrapped.v === "number" && "data" in wrapped
        ? parse(wrapped.data, wrapped.v)
        : parse(undefined, 0);
    },
    save(value) {
      write(key, JSON.stringify({ v: version, data: value }));
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {
        // See read().
      }
    },
  };
}

/** `value` as a plain object, or null: the first step of every `parse`. */
export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseJson(raw: string | null): unknown {
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

// Storage throws in some private-browsing modes and when full: the app then
// still works, it just does not remember.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // See read().
  }
}
