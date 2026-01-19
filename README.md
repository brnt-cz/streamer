# Streamer

Minimalistický webový přehrávač českých internetových rádií postavený na Vue 3.

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss)

## Funkce

- **81 českých rádií** - předem načtená databáze stanic z play.cz
- **Více formátů** - podpora MP3, AAC a WMA streamů
- **Výběr kvality** - různé bitrate varianty (32-320 kbps)
- **Playlist s složkami** - organizace stanic do složek s drag & drop řazením
- **Vlastní stanice** - možnost přidat vlastní stream URL
- **Import/Export** - záloha a obnova playlistu (JSON)
- **Vícejazyčné rozhraní** - čeština a angličtina
- **Media Session API** - ovládání z lock screen a media keys
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
│   └── radios.json           # Databáze 81 rádií
└── App.vue
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
