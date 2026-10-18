import { describe, expect, it } from "vitest";
import { EMERGENCY_NUMBERS } from "../src/content/emergency";
import { GUIDES } from "../src/content/guides";
import { TOOLS } from "../src/content/tools";
import { CONDITIONS, DIETS, DRUG_ALLERGIES, FOOD_ALLERGIES, SYMPTOMS, SYMPTOMS_INTRO } from "../src/content/medical";
import { RESCUE } from "../src/content/rescue";
import { SCENES } from "../src/content/scenes";
import { checkJp, MIN_PHRASES, validateContent } from "../src/content/validate";
import { LINES } from "../src/profile/cards";

const content = {
  scenes: SCENES,
  rescue: RESCUE,
  presets: { CONDITIONS, DRUG_ALLERGIES, FOOD_ALLERGIES, DIETS, SYMPTOMS },
  emergency: EMERGENCY_NUMBERS,
  guides: GUIDES,
  extra: { ...LINES, SYMPTOMS_INTRO },
};

describe("content", () => {
  it("passes validation", () => {
    expect(validateContent(content)).toEqual([]);
  });

  it("has all ten scenes, each with enough phrases", () => {
    expect(SCENES.map((s) => s.id)).toEqual([
      "transport",
      "hotel",
      "luggage",
      "restaurant",
      "konbini",
      "shopping",
      "drugstore",
      "toilet",
      "family",
      "emergency",
    ]);
    for (const scene of SCENES) expect(scene.phrases.length).toBeGreaterThanOrEqual(MIN_PHRASES);
  });

  it("catches what it should", () => {
    const broken = {
      ...content,
      scenes: [
        {
          ...SCENES[0]!,
          phrases: [
            { id: "transport-a", zh: "", jp: "{駅|えき} です。" },
            { id: "transport-a", zh: "x", jp: "駅 です。" },
            { id: "Bad_Id", zh: "x", jp: "$dest に {行|い}く。" },
          ],
          heard: [],
        },
      ],
    };
    const problems = validateContent(broken).join("\n");
    expect(problems).toContain("missing Chinese");
    expect(problems).toContain('duplicate id "transport-a"');
    expect(problems).toContain("needs a {漢字|かな} reading");
    expect(problems).toContain("must be kebab-case");
    expect(problems).toContain("needs a fallback");
    expect(problems).toContain("should end politely");
    expect(problems).toContain("needs at least 18 phrases");
    expect(problems).toContain("missing required phrase transport-stops-at");
  });
});

describe("phrase groups", () => {
  it("puts every transport phrase under a heading", () => {
    const transport = SCENES[0]!;
    const ids = transport.groups!.map((g) => g.id);
    for (const p of transport.phrases) expect(ids).toContain(p.group);
  });

  it("splits the emergency scene into body, lost, separated and disaster", () => {
    const emergency = SCENES.find((s) => s.id === "emergency")!;
    expect(emergency.groups?.map((g) => g.id)).toEqual(["body", "lost", "separated", "disaster"]);
  });

  it("describes every recommended tool", () => {
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
    for (const tool of TOOLS) {
      expect(tool.name.trim(), tool.id).not.toBe("");
      expect(tool.use.trim(), tool.id).not.toBe("");
      expect(tool.links.length, tool.id).toBeGreaterThan(0);
      for (const link of tool.links) expect(link.url, tool.id).toMatch(/^https:\/\//);
    }
  });

  it("refuses a guide without a source or a verified date", () => {
    const guide = GUIDES[0]!;
    const problems = validateContent({ ...content, guides: [{ ...guide, sources: ["http://example.com"], verified: "soon" }] }).join("\n");
    expect(problems).toContain("needs https sources");
    expect(problems).toContain("needs a verified date");
  });

  it("catches a phrase outside the scene's groups", () => {
    const transport = SCENES[0]!;
    const broken = {
      ...content,
      scenes: [{ ...transport, phrases: transport.phrases.map((p, i) => (i === 0 ? { ...p, group: "nope" } : p)) }],
    };
    expect(validateContent(broken).join("\n")).toContain("transport-want-to-go needs a group");
    const stray = { ...content, scenes: [{ ...SCENES[1]!, phrases: SCENES[1]!.phrases.map((p) => ({ ...p, group: "x" })) }] };
    expect(validateContent(stray).join("\n")).toContain("has a group but the scene has none");
  });
});

describe("checkJp", () => {
  it.each([
    ["{私|わたし}は", "particle は must be its own word"],
    ["これを ください。", "particle を must be its own word"],
    ["{電車|でんしゃ} 駅", "needs a {漢字|かな} reading"],
    ["{駅|eki}", "reading must be kana"],
    ["$nope です", "unknown slot"],
    ["{新宿|しんじゅく}$dest", "a slot must be a whole word"],
    ["", "empty Japanese"],
    ["  ", "empty Japanese"],
    ["です  か", "empty word"],
  ])("rejects %j", (markup, problem) => {
    expect(checkJp(markup).join("\n")).toContain(problem);
  });
});
