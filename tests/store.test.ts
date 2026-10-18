import { beforeEach, describe, expect, it, vi } from "vitest";
import { asRecord, defineStore, STORE_PREFIX } from "../src/lib/store";

/** A minimal in-memory localStorage. */
function memoryStorage() {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
  };
}

/** Storage that refuses every call, like Safari's old private mode or a full quota. */
function throwingStorage() {
  const fail = () => {
    throw new Error("SecurityError");
  };
  return { getItem: fail, setItem: fail, removeItem: fail };
}

let storage: ReturnType<typeof memoryStorage>;

beforeEach(() => {
  storage = memoryStorage();
  vi.stubGlobal("localStorage", storage);
});

describe("defineStore", () => {
  it("saves under the edition prefix with a version wrapper", () => {
    defineStore("notes", 3, (data) => data).save({ a: 1 });
    expect(STORE_PREFIX).toBe("travelbuddy.japan.");
    expect(JSON.parse(storage.items.get("travelbuddy.japan.notes")!)).toEqual({ v: 3, data: { a: 1 } });
  });

  it("round-trips a saved value through parse", () => {
    const store = defineStore("notes", 1, (data) => (asRecord(data) ?? { empty: true }) as Record<string, unknown>);
    store.save({ name: "新宿", list: [1, 2] });
    expect(store.load()).toEqual({ name: "新宿", list: [1, 2] });
  });

  it("passes the version the value was saved under", () => {
    defineStore("notes", 2, (data) => data).save("old");
    const parse = vi.fn(() => "migrated");
    expect(defineStore("notes", 5, parse).load()).toBe("migrated");
    expect(parse).toHaveBeenCalledWith("old", 2);
  });

  it("keeps falsy data such as null, 0 and an empty string", () => {
    const parse = vi.fn((data: unknown) => data);
    const store = defineStore("notes", 1, parse);
    for (const value of [null, 0, "", false]) {
      store.save(value);
      expect(store.load()).toBe(value);
      expect(parse).toHaveBeenLastCalledWith(value, 1);
    }
  });

  it.each([
    ["a missing key", undefined],
    ["malformed JSON", "{not json"],
    ["a non-object", "42"],
    ["a string", '"text"'],
    ["null", "null"],
    ["an array", "[1, 2]"],
    ["an object without v", '{"data": {}}'],
    ["an object without data", '{"v": 1}'],
    ["a non-numeric version", '{"v": "1", "data": {}}'],
  ])("gives parse (undefined, 0) for %s", (_label, raw) => {
    if (raw !== undefined) storage.items.set("travelbuddy.japan.notes", raw);
    const parse = vi.fn(() => "default");
    expect(defineStore("notes", 1, parse).load()).toBe("default");
    expect(parse).toHaveBeenCalledWith(undefined, 0);
  });

  it("clear removes only its own key", () => {
    storage.items.set("travelbuddy.japan.other", "keep");
    const store = defineStore("notes", 1, (data) => data ?? "empty");
    store.save("value");
    store.clear();
    expect(storage.items.has("travelbuddy.japan.notes")).toBe(false);
    expect(storage.items.get("travelbuddy.japan.other")).toBe("keep");
    expect(store.load()).toBe("empty");
  });

  it("keeps working when storage throws on every call", () => {
    vi.stubGlobal("localStorage", throwingStorage());
    const parse = vi.fn(() => "default");
    const store = defineStore("notes", 1, parse);
    expect(() => store.save("value")).not.toThrow();
    expect(store.load()).toBe("default");
    expect(parse).toHaveBeenCalledWith(undefined, 0);
    expect(() => store.clear()).not.toThrow();
  });

  it("keeps working when localStorage itself is missing", () => {
    vi.stubGlobal("localStorage", undefined);
    const store = defineStore("notes", 1, () => "default");
    expect(() => store.save("value")).not.toThrow();
    expect(store.load()).toBe("default");
    expect(() => store.clear()).not.toThrow();
  });
});

describe("asRecord", () => {
  it("returns plain objects as they are", () => {
    const value = { a: 1 };
    expect(asRecord(value)).toBe(value);
    expect(asRecord({})).toEqual({});
  });

  it("returns null for anything that is not a plain object", () => {
    for (const value of [null, undefined, 0, 1, "", "text", true, [], [1], () => {}]) {
      expect(asRecord(value)).toBeNull();
    }
  });
});
