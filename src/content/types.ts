import type { IconName } from "../ui/dom";

/** Japanese in markup — see src/lib/jp.ts. May contain `$slot` words. */
export type Jp = string;

/**
 * Slots a phrase can use, filled from the traveller's data:
 *   - dest: a place to go, with 駅 added for stations (新宿駅)
 *   - stop: a station name alone, for "does this train stop at …" (新宿)
 *   - hotel: the current hotel's name
 */
export type Slot = "dest" | "stop" | "hotel";
export const SLOTS: readonly string[] = ["dest", "stop", "hotel"] satisfies Slot[];

/** One answer the other person can tap, or the traveller can give. */
export interface Reply {
  jp: Jp;
  /** What the traveller reads. */
  zh: string;
}

/** Ready-made answer sets, so common questions need not repeat them. */
export type ReplySet = "yesNo" | "platform" | "direction" | "time" | "place" | "exit" | "borrow" | "medicineOk" | "have";

/** Something the traveller needs to say. */
export interface Phrase {
  /** Globally unique kebab-case id, prefixed with the scene id. */
  id: string;
  zh: string;
  jp: Jp;
  /** Said instead when the phrase has a slot that no saved data fills. */
  fallback?: Jp;
  /** Chinese for the fallback, e.g. 我想去這裡. */
  fallbackZh?: string;
  /** Short usage tip, in Chinese. */
  tip?: string;
  /** Enables "給對方點選": the other person answers by tapping. */
  answers?: ReplySet | Reply[];
  /** A page that goes with the phrase, e.g. the allergy card. */
  link?: { href: string; label: string };
  /** Id of a heading in the scene's `groups`; required when the scene has groups. */
  group?: string;
}

/** Something staff commonly say. */
export interface Heard {
  id: string;
  jp: Jp;
  zh: string;
  /** What the traveller can answer, by tapping the Chinese. */
  replies: Reply[];
}

export type SceneId =
  | "transport"
  | "hotel"
  | "luggage"
  | "restaurant"
  | "konbini"
  | "shopping"
  | "drugstore"
  | "toilet"
  | "family"
  | "emergency";

export interface Scene {
  id: SceneId;
  title: string;
  /** A pictogram from src/ui/dom.ts: drawn as SVG, the same on every phone. */
  icon: IconName;
  /** Headings that split a long phrase list for scanning; phrases are shown under them in this order. */
  groups?: { id: string; title: string }[];
  phrases: Phrase[];
  heard: Heard[];
}

/** A checkbox in the setup form whose Japanese is written in advance. */
export interface Preset {
  id: string;
  zh: string;
  jp: Jp;
}

