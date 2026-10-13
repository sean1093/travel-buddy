# TravelBuddy (隨身旅伴)

> Travel abroad without speaking the language. Japan edition available now.

When something comes up, open your phone and tap one big button. The app **reads the Japanese aloud** for you, or **shows the Japanese in large text** for the other person. They can also tap an answer to reply. Before the trip, you or your family fill in the hotel, itinerary and health details. Once there, you don't need to type or search, and it works without internet.

- **Japan edition:** https://sean1093.github.io/travel-buddy/japan/
  (The site root https://sean1093.github.io/travel-buddy/ redirects to the Japan edition.)
- **For:** anyone who doesn't speak the local language.
- **Format:** a mobile web page you can add to your home screen. No sign-up, no app download.
- **Privacy:** no backend. Data stays on your own phone. When you share it with family, the data goes after the `#` in the link and is never sent to any server.

## Main features

| Feature | Description |
|---|---|
| 我需要幫忙 (I need help) | The big red button on the home screen. A help card to show passers-by, station staff or police. It fills in the hotel and family phone numbers automatically. At the bottom you can call family, 110 or 119 directly. |
| Scene phrasebook | Transport, hotel, luggage, restaurant, convenience store, shopping, drugstore, toilets and directions, travelling with kids, emergency and medical. Every phrase can be played, played slowly, or shown large to the other person. |
| Two-way communication | 「給對方點選」 (Let them tap): the other person taps a Japanese answer and you see it in Chinese. 「對方說」 (They say): see what staff commonly say in Chinese, and tap a Chinese reply. |
| Medical card, allergy card | Japanese cards generated from chronic conditions, medication, allergies and dietary needs (vegan, lacto-ovo vegetarian, five-pungent-free vegetarian, etc.). There is also a symptom pointing card. |
| Back-to-hotel card | The hotel name, address and phone number to show a taxi driver. |
| Travel cheat sheets | Step-by-step guides: the new departure tax refund system, large luggage on the Shinkansen, seeing a doctor and insurance claims, and recommended free tools. |
| Share and print | After family fills in the details, they send them to the traveller by link or QR code. You can also print a laminated card that works even when your phone is dead. |

Screenshots are in [`docs/screenshots/`](docs/screenshots/).

## Docs

| Doc | For |
|---|---|
| [User guide](docs/user-guide.md) | Travellers and family members who help set things up |
| [Product spec](docs/spec.md) | Anyone who wants to understand how the product works |
| [Design language](docs/design.md) | Anyone changing the UI |
| [Content guide](docs/content-guide.md) | Anyone adding phrases, guides or emergency numbers |
| [Development and deployment](docs/development.md) | Anyone changing code or deploying the site |
| [Pain points and competitor research](docs/research.md) | Anyone deciding which features to build |
| [Roadmap](docs/roadmap.md) | Multi-country editions and to-dos |
| [Changelog](docs/changelog.md) | Anyone who wants to know what changed and when |

Full index in [`docs/README.md`](docs/README.md).

## Quick start (development)

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev      # local development
npm test         # content checks and unit tests
npm run build    # type check + build to dist/ (Japan edition in dist/japan/)
```

Details in [Development and deployment](docs/development.md).

## Acknowledgements

The Japanese markup syntax, speech, local storage and offline caching approach come from the sister project [Ippo 一歩](https://github.com/sean1093/ippo).

## License

MIT
