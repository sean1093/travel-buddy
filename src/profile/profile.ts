import { asRecord, defineStore } from "../lib/store";

/**
 * Everything filled in before the trip. All of it is optional: the app works
 * with an empty profile, it just says "here" instead of a station name.
 */
export interface Profile {
  /** How the app addresses the traveller, e.g. 媽媽 or 小美. */
  callName: string;
  /** As printed in the passport, for police and hospitals. */
  passportName: string;
  birthYear: number | null;
  hotels: Hotel[];
  places: Place[];
  /** Emergency contacts, first is the main one. Usually family in Taiwan. */
  contacts: Contact[];
  /** Someone in Japan: a friend, relative or guide. Easiest for a local to call. */
  localContact: Contact;
  health: Health;
  insurance: Insurance;
}

export interface Hotel {
  /** Japanese name as written on the booking. */
  name: string;
  /** Reading in kana, optional. */
  kana: string;
  address: string;
  phone: string;
  /** Check-in and check-out, YYYY-MM-DD or "". */
  from: string;
  to: string;
}

export type PlaceKind = "station" | "place";

export interface Place {
  kind: PlaceKind;
  /** Japanese name, without 駅 for stations. */
  name: string;
  kana: string;
  /** Chinese name, for the traveller. */
  zh: string;
  /** YYYY-MM-DD or "". */
  date: string;
  /**
   * Elevator notes looked up before the trip, e.g. which exit has a lift and
   * whether it is inside the gates. Best pasted in Japanese from the
   * station's own page, so station staff can read it too.
   */
  note: string;
}

export interface Contact {
  relation: string;
  name: string;
  phone: string;
}

export interface Health {
  /** Preset ids from src/content/medical.ts. */
  conditions: string[];
  /** Free text, ideally in English so a Japanese doctor can read it. */
  conditionsOther: string;
  meds: Med[];
  drugAllergies: string[];
  foodAllergies: string[];
  diets: string[];
  allergyOther: string;
  bloodType: BloodType;
}

export interface Med {
  /** Active ingredient, ideally the English generic name. */
  ingredient: string;
  dose: string;
}

export type BloodType = "" | "A" | "B" | "O" | "AB";
const BLOOD_TYPES: readonly unknown[] = ["", "A", "B", "O", "AB"];

export interface Insurance {
  company: string;
  policy: string;
  phone: string;
}

/** Caps keep a hand-crafted link from bloating storage or the page. */
export const LIMITS = { short: 80, long: 200, list: 20 } as const;

export function emptyProfile(): Profile {
  return {
    callName: "",
    passportName: "",
    birthYear: null,
    hotels: [],
    places: [],
    contacts: [],
    localContact: { relation: "", name: "", phone: "" },
    health: {
      conditions: [],
      conditionsOther: "",
      meds: [],
      drugAllergies: [],
      foodAllergies: [],
      diets: [],
      allergyOther: "",
      bloodType: "",
    },
    insurance: { company: "", policy: "", phone: "" },
  };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function str(value: unknown, max: number = LIMITS.short): string {
  // Control characters have no business in any field and could hide text.
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
}

function date(value: unknown): string {
  return typeof value === "string" && DATE.test(value) ? value : "";
}

function list<T>(value: unknown, item: (raw: Record<string, unknown>) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, LIMITS.list)
    .map((raw) => {
      const record = asRecord(raw);
      return record ? item(record) : null;
    })
    .filter((x): x is T => x !== null);
}

function ids(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((x): x is string => typeof x === "string" && /^[a-z0-9-]{1,40}$/.test(x)))].slice(
    0,
    LIMITS.list * 2,
  );
}

function contact(raw: Record<string, unknown>): Contact {
  return { relation: str(raw.relation), name: str(raw.name), phone: str(raw.phone, 40) };
}

/** Saved or shared data as a well-formed profile; anything malformed is dropped field by field. */
export function parseProfile(data: unknown): Profile {
  const raw = asRecord(data);
  const profile = emptyProfile();
  if (!raw) return profile;
  profile.callName = str(raw.callName, 20);
  profile.passportName = str(raw.passportName);
  const year = raw.birthYear;
  if (typeof year === "number" && Number.isInteger(year) && year >= 1900 && year <= 2100) profile.birthYear = year;
  profile.hotels = list(raw.hotels, (h) => {
    const hotel: Hotel = {
      name: str(h.name),
      kana: str(h.kana),
      address: str(h.address, LIMITS.long),
      phone: str(h.phone, 40),
      from: date(h.from),
      to: date(h.to),
    };
    return hotel.name || hotel.address ? hotel : null;
  });
  profile.places = list(raw.places, (p) => {
    const place: Place = {
      kind: p.kind === "place" ? "place" : "station",
      name: str(p.name),
      kana: str(p.kana),
      zh: str(p.zh),
      date: date(p.date),
      note: str(p.note, LIMITS.long),
    };
    return place.name ? place : null;
  });
  profile.contacts = list(raw.contacts, (c) => {
    const parsed = contact(c);
    return parsed.phone || parsed.name ? parsed : null;
  });
  profile.localContact = contact(asRecord(raw.localContact) ?? {});
  const health = asRecord(raw.health) ?? {};
  profile.health = {
    conditions: ids(health.conditions),
    conditionsOther: str(health.conditionsOther, LIMITS.long),
    meds: list(health.meds, (m) => {
      const med: Med = { ingredient: str(m.ingredient), dose: str(m.dose) };
      return med.ingredient ? med : null;
    }),
    drugAllergies: ids(health.drugAllergies),
    foodAllergies: ids(health.foodAllergies),
    diets: ids(health.diets),
    allergyOther: str(health.allergyOther, LIMITS.long),
    bloodType: BLOOD_TYPES.includes(health.bloodType) ? (health.bloodType as BloodType) : "",
  };
  const insurance = asRecord(raw.insurance) ?? {};
  profile.insurance = {
    company: str(insurance.company),
    policy: str(insurance.policy),
    phone: str(insurance.phone, 40),
  };
  return profile;
}

/** True when nothing has been filled in. */
export function isEmpty(profile: Profile): boolean {
  return JSON.stringify(profile) === JSON.stringify(emptyProfile());
}

/** Today in the traveller's time zone, as YYYY-MM-DD. */
export function today(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * The hotel for tonight: the one whose stay covers `day` (check-out day
 * included, for the last morning of a trip; on a day one stay ends and the
 * next begins, the new one, since that is where tonight is). Otherwise the
 * next one by date (before the trip: the first night's), then the last one
 * (after it), and only without any dates the first one entered. The order
 * the hotels were typed in means nothing: a printed card must be right.
 * A stay with only a check-in date runs until another stay starts (the
 * check-out isn't typed yet); one with only a check-out date covers that day.
 */
export function currentHotel(profile: Profile, day = today()): Hotel | null {
  const hotels = profile.hotels;
  const start = (h: Hotel) => h.from || h.to;
  const end = (h: Hotel) => h.to || h.from;
  const covers = (h: Hotel) => {
    if (!start(h) || start(h) > day) return false;
    if (h.to) return day <= h.to;
    // Check-in only: until another stay has started by `day`.
    return !hotels.some((other) => other !== h && start(other) > h.from && start(other) <= day);
  };
  // Of the stays covering the day, the one that started last.
  const covering = hotels.filter(covers).sort((a, b) => start(b).localeCompare(start(a)))[0];
  const next = hotels.filter((h) => start(h) > day).sort((a, b) => start(a).localeCompare(start(b)))[0];
  const last = hotels.filter((h) => start(h) && end(h) < day).sort((a, b) => end(b).localeCompare(end(a)))[0];
  return covering ?? next ?? last ?? hotels[0] ?? null;
}

/** The place is planned for `day`. */
export function isPlannedFor(place: Place, day = today()): boolean {
  return place.date === day;
}

/** Places with today's first, then undated ones, then the other days in date order. */
export function placesForToday(profile: Profile, day = today()): Place[] {
  const rank = (p: Place) => (isPlannedFor(p, day) ? 0 : p.date === "" ? 1 : 2);
  return [...profile.places].sort((a, b) => rank(a) - rank(b) || a.date.localeCompare(b.date));
}

const store = defineStore("profile", 1, (data) => parseProfile(data));

export function loadProfile(): Profile {
  return store.load();
}

export function saveProfile(profile: Profile): void {
  store.save(profile);
}

export function clearProfile(): void {
  store.clear();
}
