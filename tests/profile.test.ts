import { describe, expect, it } from "vitest";
import { currentHotel, emptyProfile, type Hotel, isEmpty, parseProfile, placesForToday } from "../src/profile/profile";
import { sampleProfile } from "./fixtures";

describe("parseProfile", () => {
  it.each([undefined, null, 42, "x", [], { hotels: "nope", health: [] }])("survives %j", (junk) => {
    expect(parseProfile(junk)).toEqual(emptyProfile());
  });

  it("drops rows without their key field and bad dates", () => {
    const profile = parseProfile({
      hotels: [{ phone: "03" }, { name: "A", from: "tomorrow" }],
      places: [{ zh: "沒有日文" }, { name: "新宿", kind: "weird" }],
      birthYear: 1800,
    });
    expect(profile.hotels).toEqual([{ name: "A", kana: "", address: "", phone: "", from: "", to: "" }]);
    expect(profile.places).toEqual([{ kind: "station", name: "新宿", kana: "", zh: "", date: "", note: "" }]);
    expect(profile.birthYear).toBeNull();
  });

  it("knows an empty profile", () => {
    expect(isEmpty(emptyProfile())).toBe(true);
    expect(isEmpty(sampleProfile())).toBe(false);
  });
});

describe("trip dates", () => {
  const profile = sampleProfile();

  it("picks the hotel for the night", () => {
    expect(currentHotel(profile, "2026-11-03")?.name).toBe("ホテルグレイスリー新宿");
    expect(currentHotel(profile, "2026-11-06")?.name).toBe("京都タワーホテル");
    // Before the trip: the first hotel.
    expect(currentHotel(profile, "2026-10-01")?.name).toBe("ホテルグレイスリー新宿");
    expect(currentHotel(emptyProfile())).toBeNull();
  });

  it("picks by date, never by the order the hotels were typed in, so a card printed before the trip is right", () => {
    const profile = sampleProfile();
    const [shinjuku, kyoto] = profile.hotels as [Hotel, Hotel];
    // Shinjuku deleted and added again: now last in the list.
    profile.hotels = [kyoto, shinjuku];
    expect(currentHotel(profile, "2026-10-01")?.name).toBe(shinjuku.name);
    // A night between stays: the next one.
    profile.hotels = [kyoto, { ...shinjuku, to: "2026-11-03" }];
    expect(currentHotel(profile, "2026-11-04")?.name).toBe(kyoto.name);
    // After the trip: the last one.
    profile.hotels = [kyoto, shinjuku];
    expect(currentHotel(profile, "2026-12-31")?.name).toBe(kyoto.name);
    // No dates at all: the first one entered.
    profile.hotels = [{ ...kyoto, from: "", to: "" }, { ...shinjuku, from: "", to: "" }];
    expect(currentHotel(profile, "2026-11-04")?.name).toBe(kyoto.name);
  });

  it("picks by date, never by the order the hotels were typed in, so a card printed before the trip is right", () => {
    const profile = sampleProfile();
    const [shinjuku, kyoto] = profile.hotels as [Hotel, Hotel];
    // Shinjuku deleted and added again: now last in the list.
    profile.hotels = [kyoto, shinjuku];
    expect(currentHotel(profile, "2026-10-01")?.name).toBe(shinjuku.name);
    // Between stays: the next one.
    profile.hotels = [kyoto, { ...shinjuku, to: "2026-11-04" }];
    expect(currentHotel(profile, "2026-11-04")?.name).toBe(shinjuku.name);
    // After the trip: the last one.
    expect(currentHotel(profile, "2026-12-31")?.name).toBe(kyoto.name);
    // No dates at all: the first one entered.
    profile.hotels = [{ ...kyoto, from: "", to: "" }, { ...shinjuku, from: "", to: "" }];
    expect(currentHotel(profile, "2026-11-04")?.name).toBe(kyoto.name);
  });

  it("puts today's places first", () => {
    expect(placesForToday(profile, "2026-11-03").map((p) => p.name).slice(0, 2)).toEqual(["浅草", "浅草寺"]);
  });
});
