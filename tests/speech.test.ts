import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type SpeechModule = typeof import("../src/lib/speech");

interface FakeVoice {
  name: string;
  voiceURI: string;
  lang: string;
}

class FakeUtterance {
  lang = "";
  voice: FakeVoice | null = null;
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

function fakeSynth(voices: FakeVoice[] = []) {
  return {
    voices,
    speaking: false,
    pending: false,
    getVoices: vi.fn(() => voices),
    speak: vi.fn<(utterance: FakeUtterance) => void>(),
    cancel: vi.fn(),
    addEventListener: vi.fn(),
  };
}

function voice(name: string, lang = "ja-JP", voiceURI = name): FakeVoice {
  return { name, voiceURI, lang };
}

/** Imports a fresh copy of the module, which reads `speechSynthesis` once at import. */
async function loadSpeech(synth?: ReturnType<typeof fakeSynth>): Promise<SpeechModule> {
  vi.resetModules();
  if (synth) vi.stubGlobal("speechSynthesis", synth);
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  // speak() schedules its safety timeout on window; Node has none.
  vi.stubGlobal("window", globalThis);
  return import("../src/lib/speech");
}

/** The utterance handed to the engine by the latest speak(). */
function spoken(synth: ReturnType<typeof fakeSynth>): FakeUtterance {
  return synth.speak.mock.lastCall![0];
}

/** Whether `promise` has settled once pending microtasks have run. */
async function settled(promise: Promise<unknown>): Promise<boolean> {
  let done = false;
  void promise.then(() => (done = true));
  await Promise.resolve();
  await Promise.resolve();
  return done;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("japaneseVoices", () => {
  it("keeps only Japanese voices, whatever the lang separator", async () => {
    const synth = fakeSynth([
      voice("A", "ja-JP"),
      voice("B", "ja_JP"),
      voice("C", "ja"),
      voice("D", "JA-jp"),
      voice("E", "en-US"),
      voice("F", "jav-ID"),
      voice("G", "zh-TW"),
    ]);
    const { japaneseVoices } = await loadSpeech(synth);
    expect(japaneseVoices().map((v) => v.name).sort()).toEqual(["A", "B", "C", "D"]);
  });

  it("ranks premium, enhanced, natural, Google, named voices, others, then novelty voices", async () => {
    const synth = fakeSynth([
      voice("Grandma", "ja-JP", "com.apple.eloquence.ja-JP.Grandma"),
      voice("Eloquence Reed"),
      voice("Unknown Voice"),
      voice("Kyoko", "ja-JP", "com.apple.voice.compact.ja-JP.Kyoko"),
      voice("Google 日本語"),
      voice("Microsoft Nanami Online (Natural) - Japanese (Japan)"),
      voice("Otoya", "ja-JP", "com.apple.voice.enhanced.ja-JP.Otoya"),
      voice("Kyoko (プレミアム)"),
    ]);
    const { japaneseVoices } = await loadSpeech(synth);
    expect(japaneseVoices().map((v) => v.name)).toEqual([
      "Kyoko (プレミアム)",
      "Otoya",
      "Microsoft Nanami Online (Natural) - Japanese (Japan)",
      "Google 日本語",
      "Kyoko",
      "Unknown Voice",
      "Grandma",
      "Eloquence Reed",
    ]);
  });

  it("is empty without a speech engine", async () => {
    const { japaneseVoices } = await loadSpeech();
    expect(japaneseVoices()).toEqual([]);
  });
});

describe("voiceStatus", () => {
  it("is unsupported without a speech engine", async () => {
    const { voiceStatus } = await loadSpeech();
    expect(voiceStatus()).toBe("unsupported");
  });

  it("is ok while the voice list is empty, since it may not have loaded yet", async () => {
    const { voiceStatus } = await loadSpeech(fakeSynth([]));
    expect(voiceStatus()).toBe("ok");
  });

  it("is missing when voices are listed but none is Japanese", async () => {
    const { voiceStatus } = await loadSpeech(fakeSynth([voice("Samantha", "en-US")]));
    expect(voiceStatus()).toBe("missing");
  });

  it("is ok when a Japanese voice is listed", async () => {
    const { voiceStatus } = await loadSpeech(fakeSynth([voice("Samantha", "en-US"), voice("Kyoko")]));
    expect(voiceStatus()).toBe("ok");
  });
});

describe("onVoicesChanged", () => {
  it("listens for voiceschanged on the engine", async () => {
    const synth = fakeSynth();
    const { onVoicesChanged } = await loadSpeech(synth);
    const listener = () => {};
    onVoicesChanged(listener);
    expect(synth.addEventListener).toHaveBeenCalledWith("voiceschanged", listener);
  });

  it("does nothing without a speech engine", async () => {
    const { onVoicesChanged } = await loadSpeech();
    expect(() => onVoicesChanged(() => {})).not.toThrow();
  });
});

describe("speak", () => {
  it("speaks plain Japanese text with the best voice at the default rate", async () => {
    const synth = fakeSynth([voice("Kyoko"), voice("Otoya (Enhanced)")]);
    const { speak } = await loadSpeech(synth);
    void speak("{電車|でんしゃ} は");
    const utterance = spoken(synth);
    expect(utterance.text).toBe("電車は");
    expect(utterance.lang).toBe("ja-JP");
    expect(utterance.voice?.name).toBe("Otoya (Enhanced)");
    expect(utterance.rate).toBe(1);
  });

  it("uses the configured voice and rate, and a per-call rate over both", async () => {
    const synth = fakeSynth([voice("Kyoko"), voice("Otoya (Enhanced)")]);
    const { configureSpeech, speak } = await loadSpeech(synth);
    configureSpeech({ voice: "Kyoko", rate: 0.9 });
    void speak("はい");
    expect(spoken(synth).voice?.name).toBe("Kyoko");
    expect(spoken(synth).rate).toBe(0.9);
    void speak("はい", { rate: 0.6 });
    expect(spoken(synth).rate).toBe(0.6);
  });

  it("falls back to the best voice when the configured one is gone", async () => {
    const synth = fakeSynth([voice("Kyoko")]);
    const { configureSpeech, speak } = await loadSpeech(synth);
    configureSpeech({ voice: "uninstalled", rate: 1 });
    void speak("はい");
    expect(spoken(synth).voice?.name).toBe("Kyoko");
  });

  it("leaves the voice unset when no Japanese voice is listed", async () => {
    const synth = fakeSynth([]);
    const { speak } = await loadSpeech(synth);
    void speak("はい");
    expect(spoken(synth).voice).toBeNull();
    expect(spoken(synth).lang).toBe("ja-JP");
  });

  it("resolves when the utterance ends", async () => {
    const synth = fakeSynth();
    const { speak } = await loadSpeech(synth);
    const done = speak("はい");
    expect(await settled(done)).toBe(false);
    spoken(synth).onend!();
    expect(await settled(done)).toBe(true);
  });

  it("resolves when the utterance fails", async () => {
    const synth = fakeSynth();
    const { speak } = await loadSpeech(synth);
    const done = speak("はい");
    spoken(synth).onerror!();
    expect(await settled(done)).toBe(true);
  });

  it("resolves on the safety timeout when the engine never reports back", async () => {
    const synth = fakeSynth();
    const { speak } = await loadSpeech(synth);
    // 2000 ms plus 400 ms per character at rate 1: two characters give 2800 ms.
    const done = speak("はい");
    vi.advanceTimersByTime(2799);
    expect(await settled(done)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(await settled(done)).toBe(true);
  });

  it("stretches the safety timeout for slower speech", async () => {
    const synth = fakeSynth();
    const { speak } = await loadSpeech(synth);
    // 2000 + 2 * 400 / 0.5 = 3600 ms.
    const done = speak("はい", { rate: 0.5 });
    vi.advanceTimersByTime(3599);
    expect(await settled(done)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(await settled(done)).toBe(true);
  });

  it("clears the safety timeout once speech ends", async () => {
    const synth = fakeSynth();
    const { speak } = await loadSpeech(synth);
    void speak("はい");
    spoken(synth).onend!();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("interrupts the previous utterance, cancelling only a busy engine", async () => {
    const synth = fakeSynth();
    const { speak } = await loadSpeech(synth);
    const first = speak("はい");
    // An idle engine is not cancelled: on iOS that can swallow the next utterance.
    const second = speak("いいえ");
    expect(await settled(first)).toBe(true);
    expect(synth.cancel).not.toHaveBeenCalled();

    synth.speaking = true;
    const third = speak("どうぞ");
    expect(await settled(second)).toBe(true);
    expect(synth.cancel).toHaveBeenCalledTimes(1);

    synth.speaking = false;
    synth.pending = true;
    void speak("すみません");
    expect(await settled(third)).toBe(true);
    expect(synth.cancel).toHaveBeenCalledTimes(2);
    expect(synth.speak).toHaveBeenCalledTimes(4);
  });

  it("ignores a late end event from an interrupted utterance", async () => {
    const synth = fakeSynth();
    const { speak } = await loadSpeech(synth);
    void speak("はい");
    const interrupted = spoken(synth);
    const current = speak("いいえ");
    interrupted.onend!();
    expect(await settled(current)).toBe(false);
  });

  it("resolves at once without an engine", async () => {
    const { speak } = await loadSpeech();
    expect(await settled(speak("はい"))).toBe(true);
  });

  // Regression: plain("") used to throw (parse treated "" as one empty word).
  it("resolves without speaking when the text is empty", async () => {
    const synth = fakeSynth();
    const { speak } = await loadSpeech(synth);
    expect(await settled(speak(""))).toBe(true);
    expect(await settled(speak("  "))).toBe(true);
    expect(synth.speak).not.toHaveBeenCalled();
  });
});

describe("stopSpeaking", () => {
  it("resolves the current utterance and cancels a busy engine", async () => {
    const synth = fakeSynth();
    const { speak, stopSpeaking } = await loadSpeech(synth);
    const done = speak("はい");
    synth.speaking = true;
    stopSpeaking();
    expect(await settled(done)).toBe(true);
    expect(synth.cancel).toHaveBeenCalledTimes(1);
  });

  it("does nothing when idle", async () => {
    const synth = fakeSynth();
    const { stopSpeaking } = await loadSpeech(synth);
    expect(() => stopSpeaking()).not.toThrow();
    expect(synth.cancel).not.toHaveBeenCalled();
  });
});
