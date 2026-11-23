import { deflateSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { emptyProfile } from "../src/profile/profile";
import { decodeProfile, encodeProfile, shareUrl } from "../src/share/codec";
import { sampleProfile } from "./fixtures";

describe("share codec", () => {
  it("round-trips a full profile", () => {
    const profile = sampleProfile();
    expect(decodeProfile(encodeProfile(profile))).toEqual(profile);
  });

  it("round-trips an empty profile", () => {
    expect(decodeProfile(encodeProfile(emptyProfile()))).toEqual(emptyProfile());
  });

  it("builds a link LINE opens in the phone's own browser, with the profile in the fragment", () => {
    const base = "https://sean1093.github.io/travel-buddy/japan/";
    const url = shareUrl(sampleProfile(), base);
    expect(url).toBe(`${base}?openExternalBrowser=1#/s/${encodeProfile(sampleProfile())}`);
    expect(decodeProfile(new URL(url).hash.slice("#/s/".length))).toEqual(sampleProfile());
  });


  it("keeps an ordinary trip short enough for a QR code", () => {
    const payload = encodeProfile(sampleProfile());
    expect(payload).toMatch(/^1\.[A-Za-z0-9_-]+$/);
    expect(payload.length).toBeLessThan(1500);
  });

  it.each([
    ["", "empty"],
    ["2.abc", "unknown version"],
    ["1.", "no data"],
    ["1.!!!", "bad characters"],
    ["1.AAAA", "not deflate"],
    [`1.${"A".repeat(7000)}`, "too long"],
  ])("rejects %j (%s)", (payload) => {
    expect(decodeProfile(payload)).toBeNull();
  });

  it("rejects a truncated link", () => {
    const payload = encodeProfile(sampleProfile());
    expect(decodeProfile(payload.slice(0, payload.length / 2))).toBeNull();
  });

  it("refuses a decompression bomb", () => {
    const bomb = deflateSync(strToU8(`{"n":"${"x".repeat(200_000)}"}`));
    let binary = "";
    for (const b of bomb) binary += String.fromCharCode(b);
    const payload = `1.${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
    expect(payload.length).toBeLessThan(6000);
    expect(decodeProfile(payload)).toBeNull();
  });

  it("sanitises whatever a crafted link contains", () => {
    const json = JSON.stringify({ n: 42, h: [{ n: "<img src=x onerror=alert(1)>", a: "x".repeat(999) }], m: { c: ["__proto__", "ok"] } });
    let binary = "";
    for (const b of deflateSync(strToU8(json))) binary += String.fromCharCode(b);
    const profile = decodeProfile(`1.${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`);
    expect(profile?.callName).toBe("");
    expect(profile?.hotels[0]?.address.length).toBe(200);
    expect(profile?.health.conditions).toEqual(["ok"]);
  });
});
