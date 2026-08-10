# Kurátorský seznam ~100 světových rádií

Cíl: rozšířit `src/data/radios-international.json` (dnes 32 stanic) o ~100 známých
světových stanic. Radio Browser API slouží jen jako **zdroj stream URL**, ne jako
zdroj řazení podle popularity (hlasování je farmené — viz zamítnutá varianta A).

## Plán

- [x] Odstranit 6 mrtvých stanic z `radios.json` (play.cz je už nehlásí)
- [x] Ověřit Radio Browser jako zdroj (62k stanic, bez klíče, CORS `*`)
- [x] Zamítnout import podle popularity (42/100 bez kategorie, 39/100 bez loga, Korán + MW relaye)
- [x] Sepsat kurátorský seznam značek (135 dotazů, ze dvou vln)
- [x] Resolver: pro každou značku najít stanici v Radio Browseru a vybrat nejlepší stream
      (https, bez HLS, mp3/aac, nejvyšší bitrate, `lastcheckok`, kontrola shody názvu)
- [x] Ověřit každý stream skutečným přehráním (redirecty + prvních 32 kB)
- [x] Ruční kontrola napárování (co resolver vybral vs. co jsme chtěli) — našla ~20 chyb, viz Review
- [x] Stáhnout loga (favicon → sharp → 100×100 PNG do `public/logos/`)
- [x] Zmergovat do `radios-international.json` + dedup proti stávajícím 107 stanicím
- [x] Kontrola: `npm run lint`, `npm run typecheck`, kategorie jen z existujícího slovníku
- [x] Vyloučit náboženskou tematiku (zadání uživatele) — filtr v `assemble.cjs`

## Omezení, která platí pro každou stanici

1. **Jen `https`** a bez redirectu na http — appka běží přes https, jinak mixed content.
2. **Žádné HLS** — `StreamPlayer.vue` používá plain `audio.src`, hls.js tam není.
   (Pozn.: 10 ze 32 stávajících mezinárodních stanic je HLS-only, tedy nehrají mimo Safari.)
3. **Kategorie jen z existujícího slovníku 31 hodnot** — jinak se zaplevelí filtr v UI.
4. **Logo lokálně** v `public/logos/<id>.png`, ne hotlink (kvůli offline/PWA).

## Review

Přidáno **100 stanic** do `radios-international.json` (32 → 132), celkem v aplikaci 207 stanic
(75 CZ + 132 mezinárodních). Loga v `public/logos/` (107 → 207 souborů).

Cesta k výsledku:

1. Kurátorský seznam 135 značek → resolver našel v Radio Browseru 105 s použitelným streamem.
   Neprošlo 45 značek, protože jejich stream je **http-only nebo HLS** — typicky veřejnoprávní
   sítě: BBC (kromě už zařazených), triple j / ABC, RNZ, DR, RTÉ, VRT (Studio Brussel, Klara),
   NHK, KBS, ZA sítě (Metro FM, 5FM, Kaya).
2. První běh resolveru napároval ~20 značek špatně — sub-brand nebo jiný kanál
   (`Capital Dance` místo Capital FM, `Heart 80s` místo Heart, `Rai Radio 3 Classica`,
   `EduNeu Radio 3: DJ Johnson` místo RNE Radio 3). Řešení: skóre napárování, kde **každé slovo
   navíc v názvu stanice = jiný kanál** (−150 b), technický šum v názvu se odstraňuje
   (`(128k MP3)`, `[Mobile 48kbps]`, `| DLF | AAC`). Výjimky vědomě označené `loose: true`
   (regionální feedy sítí: Cadena SER Madrid, CBC Radio One Toronto, Jovem Pan FM…).
3. Ověření: 144 URL protečeno naživo, 7 mrtvých vyhozeno, 2 stanice tím padly celé
   (Radio Swiss Classic a SRF 3 — redirect z https na http).
4. Loga: 63 z favicon z API, 37 doplněno přes favicon služby (DuckDuckGo + Google, jen při
   buildu dat), **0 placeholderů** ve výsledku.

Kontroly: `npm run lint` a `npm run typecheck` procházejí, žádné duplicitní id ani názvy,
kategorie jen z existujícího slovníku, žádné http URL, každá stanice má logo i stream.
`npm run build` v tomto prostředí padá i bez našich změn — Vite 7 vyžaduje Node 20.19+,
lokálně je Node 18.19.1. Ze stejného důvodu neproběhly e2e testy.

### Co dál / známé mezery

- 45 světových značek zůstává mimo, protože nemají https/non-HLS stream. Přidat **hls.js** do
  `StreamPlayer.vue` by je odemklo — a zároveň spravilo 10 z původních 32 stanic
  (BBC, talkSPORT), které dnes hrají jen v Safari.
- Radio Browser vrací jen jedno URL na záznam; matice `streams[format][bitrate]` se plní
  jen tam, kde má databáze víc záznamů téže stanice (SomaFM 4 varianty, KINK 2, Radio Paradise 2).
- Skripty zůstaly ve scratchpadu, ne v `scripts/` — jsou to jednorázové nástroje. Pokud má být
  aktualizace opakovatelná, stojí za to `resolve.cjs` + `verify-prune.cjs` do repa přenést.
