# Docs index

All docs for TravelBuddy (隨身旅伴). The app UI uses Traditional Chinese (Taiwan usage) and Japanese. Docs, code, comments, issues and PRs use English.

| Doc | Contents | For |
|---|---|---|
| [user-guide.md](user-guide.md) | Features, how to set up and share, privacy, no sound, printing, FAQ | Travellers, family members who help set up |
| [spec.md](spec.md) | Users and flows, spec for each feature, routes, data structures, share links, speech | Product, design, development |
| [design.md](design.md) | Design language (washi, soft): colours, icons, borders, font weights, button hierarchy | Anyone changing the UI |
| [content-guide.md](content-guide.md) | Japanese markup, slots, polite language, answer sets, travel cheat sheets, emergency numbers, verification rules, how to add a scene | Content writers |
| [testing.md](testing.md) | Test plan: risks, test layers, coverage by feature, layout matrix, how to run, manual device check | QA, development |
| [development.md](development.md) | Environment, commands, project structure, tests, screenshots, deployment, URLs and storage, workflow | Development, operations |
| [research.md](research.md) | Traveller pain points, competitor analysis, what we built because of it and what we didn't | Anyone deciding on features |
| [roadmap.md](roadmap.md) | Approach to multi-country editions, to-dos and follow-ups | Planners |
| [changelog.md](changelog.md) | Release changes by date, with PR links | Everyone |
| [screenshots/](screenshots/) | Screenshots at phone size (390×844) | Everyone |

## Principles you must know

- **A service for everyone:** the UI and docs don't use terms aimed at a specific age group (for example 「長輩」, "elders"). Large text, large buttons and no typing are there so anyone can use it when panicking.
- **No emoji:** icons always use the line icons in `src/ui/dom.ts` (see [design.md](design.md)).
- **Emergency and medical information must be verified:** every entry has a source and a verification date. If there is no reliable source, leave it out (see [content-guide.md](content-guide.md)).
- **Don't rebuild tools others already do well:** translation, maps, ride-hailing and alerts are left to dedicated apps. We focus on "show it to the other person, let them tap an answer, and have family fill it in beforehand" (see [research.md](research.md)).
