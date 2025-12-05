# Streamer

Minimalistický webový přehrávač českých internetových rádií postavený na Vue 3.

![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)

## Funkce

- **81 českých rádií** - předem načtená databáze stanic z play.cz
- **Více formátů** - podpora MP3, AAC a WMA streamů
- **Výběr kvality** - různé bitrate varianty (32-320 kbps)
- **Playlist** - ukládání oblíbených stanic do localStorage
- **Vyhledávání** - rychlé filtrování podle názvu
- **Kategorie** - filtrování podle žánru (rock, pop, jazz, klasika...)
- **Responzivní design** - funguje na desktopu i mobilu
- **Offline databáze** - žádné API volání za běhu, vše je v bundlu

## Instalace

```bash
# Klonování repozitáře
git clone https://github.com/brnt-cz/streamer.git
cd streamer

# Instalace závislostí
npm install

# Spuštění dev serveru
npm run dev
```

Aplikace poběží na `http://localhost:5173`

## Použití

1. Klikni na **Browse Radios** pro otevření seznamu stanic
2. Vyber kategorii nebo vyhledej rádio podle názvu
3. Klikni na rádio a zvol formát/kvalitu streamu
4. Přidej do playlistu tlačítkem **Add to Playlist**
5. Ovládej přehrávání tlačítkem play/pause a hlasitostí

## Struktura projektu

```
src/
├── components/
│   ├── StreamPlayer.vue    # Hlavní přehrávač
│   ├── RadioSelector.vue   # Modal pro výběr rádia
│   └── PlaylistManager.vue # Správa playlistu
├── stores/
│   ├── radios.ts          # Store s daty rádií
│   └── playlist.ts        # Store pro playlist
├── data/
│   └── radios.json        # Databáze 81 rádií s URL streamy
└── App.vue
```

## Aktualizace databáze rádií

Pro stažení aktuálních dat z play.cz:

```bash
node scripts/fetch-radios.cjs
```

Skript projde všechna rádia a uloží jejich stream URL do `src/data/radios.json`.

## Tech stack

- **Vue 3** - Composition API
- **TypeScript** - typová bezpečnost
- **Vite** - rychlý dev server a build
- **HTML5 Audio API** - přehrávání streamů

## License

MIT
