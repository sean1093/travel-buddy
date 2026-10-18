// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseSettings } from "../src/state";

describe("parseSettings", () => {
  it("returns the defaults for missing or malformed data", () => {
    expect(DEFAULT_SETTINGS).toEqual({ theme: "system", textSize: "large", voice: null });
    for (const data of [undefined, null, "dark", 42, [], ["dark"], {}]) {
      expect(parseSettings(data)).toEqual(DEFAULT_SETTINGS);
    }
  });

  it("returns a copy, never the shared defaults", () => {
    const settings = parseSettings(undefined);
    expect(settings).not.toBe(DEFAULT_SETTINGS);
    settings.theme = "dark";
    expect(DEFAULT_SETTINGS.theme).toBe("system");
  });

  it("keeps every valid field", () => {
    expect(parseSettings({ theme: "dark", textSize: "xlarge", voice: "com.apple.voice.enhanced.ja-JP.Kyoko" })).toEqual({
      theme: "dark",
      textSize: "xlarge",
      voice: "com.apple.voice.enhanced.ja-JP.Kyoko",
    });
    for (const theme of ["system", "light", "dark"]) expect(parseSettings({ theme }).theme).toBe(theme);
  });

  it("falls back on a bad theme alone", () => {
    for (const theme of ["Dark", "blue", "", 1, null, true]) {
      expect(parseSettings({ theme, textSize: "xlarge", voice: "Kyoko" })).toEqual({
        theme: "system",
        textSize: "xlarge",
        voice: "Kyoko",
      });
    }
  });

  it("falls back on a bad text size alone", () => {
    for (const textSize of ["small", "xxlarge", "", 2, null]) {
      expect(parseSettings({ theme: "light", textSize, voice: "Kyoko" })).toEqual({
        theme: "light",
        textSize: "large",
        voice: "Kyoko",
      });
    }
  });

  it("falls back on a voice that is not a string", () => {
    for (const voice of [null, 1, true, {}, ["Kyoko"]]) {
      expect(parseSettings({ theme: "light", textSize: "xlarge", voice })).toEqual({
        theme: "light",
        textSize: "xlarge",
        voice: null,
      });
    }
  });

  it("ignores unknown fields", () => {
    expect(parseSettings({ theme: "dark", extra: "x" })).toEqual({ ...DEFAULT_SETTINGS, theme: "dark" });
  });
});
