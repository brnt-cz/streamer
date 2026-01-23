# Streamer

Minimalistický webový přehrávač českých a zahraničních internetových rádií postavený na Vue 3.

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss)

## Funkce

- **113 rádií** - 81 českých + 32 zahraničních (BBC, NPR, France Radio, Radio ZET, aj.)
- **Více formátů** - podpora MP3, AAC a WMA streamů s filtrováním ve výběru
- **Výběr kvality** - různé bitrate varianty (32-320 kbps)
- **Playlist s složkami** - organizace stanic do složek s drag & drop řazením
- **Vlastní stanice** - možnost přidat vlastní stream URL
- **Import/Export** - záloha a obnova playlistu (JSON)
- **Vícejazyčné rozhraní** - čeština a angličtina
- **Media Session API** - ovládání z lock screen a media keys s artwork
- **Přehrávání na pozadí** - funguje i při vypnuté obrazovce na mobilu
- **Loga stanic** - optimalizovaná loga 100x100 zobrazená v přehrávači
- **Responzivní design** - desktop i mobilní offcanvas panel
- **Úspora dat** - automatické zastavení streamu při pauze na mobilu
- **Offline databáze** - žádné API volání za běhu

## Instalace

```bash
git clone https://github.com/brnt-cz/streamer.git
cd streamer
npm install
npm run dev
```

Aplikace poběží na `http://localhost:5173`

## Skripty

```bash
npm run dev        # Vývojový server
npm run build      # Produkční build
npm run preview    # Náhled produkčního buildu
npm run typecheck  # Kontrola TypeScript typů
npm run lint       # ESLint kontrola
npm run lint:fix   # ESLint oprava
npm run test       # E2E testy (Playwright)
npm run test:ui    # E2E testy s UI
```

## Struktura projektu

```
src/
├── components/
│   ├── StreamPlayer.vue      # Hlavní přehrávač s Media Session
│   ├── RadioSelector.vue     # Modal pro výběr rádia
│   ├── PlaylistManager.vue   # Správa playlistu se složkami
│   └── LanguageSwitcher.vue  # Přepínač jazyků
├── stores/
│   ├── radios.ts             # Store s daty rádií
│   ├── playlist.ts           # Store pro playlist a složky
│   └── language.ts           # Store pro jazyk
├── i18n/
│   └── translations.ts       # Překlady (EN/CZ)
├── data/
│   ├── radios.json           # Databáze 81 českých rádií
│   └── radios-international.json  # Databáze 32 zahraničních rádií
├── composables/
│   └── useMediaSession.ts    # Media Session API s artwork
└── App.vue

public/
└── logos/                    # 113 optimalizovaných log (100x100 PNG)
```

## Aktualizace databáze rádií

```bash
node scripts/fetch-radios.cjs
```

## Tech stack

- **Vue 3** - Composition API + Pinia
- **TypeScript 5** - typová bezpečnost
- **Vite 7** - dev server a build
- **Tailwind CSS 4** - styling
- **Playwright** - E2E testování
- **ESLint** - linting

## License

MIT

feat: Add mobile background playback support

- Add playsinline attributes for iOS audio playback
- Handle visibility change to resume playback after screen unlock
- Add keep-alive interval to detect silent browser pauses
- Handle stalled event to auto-reload interrupted streams
- Add artwork (station logo) to Media Session metadata
- Update README with new features
