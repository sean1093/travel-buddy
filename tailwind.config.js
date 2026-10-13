/**
 * Colours are CSS variables (see `:root` in src/style.css), so a theme only
 * swaps variables; `<alpha-value>` keeps modifiers such as `bg-paper/95` working.
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.ts"],
  theme: {
    extend: {
      // Titles in a Mincho-style serif, like a printed ryokan guide; everything else in the page font.
      fontFamily: { title: ["var(--font-title)"] },
      colors: {
        paper: token("paper"),
        card: token("card"),
        // Washi sand: secondary buttons and quiet surfaces.
        sand: token("sand"),
        ink: token("ink"),
        muted: token("muted"),
        hair: token("hair"),
        "on-accent": token("on-accent"),
        // 藍 indigo: actions. 朱 vermilion: help and emergencies.
        ai: { DEFAULT: token("ai"), soft: token("ai-soft") },
        shu: { DEFAULT: token("shu"), soft: token("shu-soft") },
        ok: { DEFAULT: token("ok"), soft: token("ok-soft") },
        warn: { soft: token("warn-soft") },
        // Exit-sign yellow, for exits and elevators.
        exit: { DEFAULT: token("exit"), on: token("on-exit") },
      },
    },
  },
  plugins: [],
};
