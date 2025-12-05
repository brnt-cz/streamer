# UI Testovací scénáře - Streamer

10 BDD scénářů pro testování Czech Internet Radio Player aplikace.

---

## Scénář 1: Přehrání rádia z katalogu

```gherkin
Feature: Přehrávání rádia z katalogu
  Jako uživatel
  Chci vybrat rádio z katalogu a přehrát ho
  Abych mohl poslouchat hudbu

  Scenario: Výběr a přehrání rádia
    Given jsem na hlavní stránce aplikace
    When kliknu na tlačítko "Browse Radios"
    And vyberu rádio "Radio 1" ze seznamu
    And kliknu na tlačítko "Add to Playlist"
    And kliknu na tlačítko play
    Then se zobrazí animace audio vlny
    And zobrazí se název stanice "Radio 1"
    And slyším audio stream
```

---

## Scénář 2: Filtrování rádií podle kategorie

```gherkin
Feature: Filtrování rádií
  Jako uživatel
  Chci filtrovat rádia podle kategorie
  Abych rychle našel žánr, který mě zajímá

  Scenario: Filtrování podle kategorie Rock
    Given jsem v modálním okně pro výběr rádia
    When vyberu kategorii "Rock" z dropdown menu
    Then se zobrazí pouze rádia s kategorií Rock
    And ostatní rádia jsou skryta
```

---

## Scénář 3: Vyhledávání rádia podle názvu

```gherkin
Feature: Vyhledávání rádií
  Jako uživatel
  Chci vyhledávat rádia podle názvu
  Abych rychle našel konkrétní stanici

  Scenario: Vyhledání rádia pomocí textového pole
    Given jsem v modálním okně pro výběr rádia
    When zadám "Impuls" do vyhledávacího pole
    Then se seznam rádií filtruje v reálném čase
    And zobrazí se pouze rádia obsahující "Impuls" v názvu
```

---

## Scénář 4: Přidání vlastní stanice do playlistu

```gherkin
Feature: Přidání vlastní stanice
  Jako uživatel
  Chci přidat vlastní internetové rádio
  Abych mohl poslouchat stanice mimo katalog

  Scenario: Ruční přidání vlastní stanice
    Given jsem na hlavní stránce aplikace
    When kliknu na tlačítko "Add" v sekci "Your Stations"
    And vyplním název stanice "Moje Rádio"
    And vyplním URL streamu "https://example.com/stream.mp3"
    And kliknu na tlačítko "Add Station"
    Then se stanice "Moje Rádio" zobrazí v playlistu
    And formulář se zavře
```

---

## Scénář 5: Editace existující stanice v playlistu

```gherkin
Feature: Editace stanice
  Jako uživatel
  Chci upravit existující stanici v playlistu
  Abych mohl opravit název nebo URL

  Scenario: Úprava názvu stanice
    Given mám v playlistu stanici "Staré Jméno"
    When najedu myší na stanici v playlistu
    And kliknu na ikonu tužky (edit)
    And změním název na "Nové Jméno"
    And kliknu na tlačítko "Save Changes"
    Then se stanice přejmenuje na "Nové Jméno"
    And změna je uložena v cookies
```

---

## Scénář 6: Ovládání hlasitosti přehrávače

```gherkin
Feature: Ovládání hlasitosti
  Jako uživatel
  Chci regulovat hlasitost přehrávání
  Abych měl kontrolu nad úrovní zvuku

  Scenario: Změna hlasitosti pomocí slideru
    Given přehrávám rádio
    And hlasitost je nastavena na 80%
    When posunu slider hlasitosti na 50%
    Then se zobrazí hodnota "50%"
    And hlasitost audio streamu se změní na 50%
```

---

## Scénář 7: Export a import playlistu

```gherkin
Feature: Export a import playlistu
  Jako uživatel
  Chci exportovat a importovat svůj playlist
  Abych mohl zálohovat nebo přenést stanice

  Scenario: Export playlistu do JSON souboru
    Given mám v playlistu alespoň jednu stanici
    When kliknu na tlačítko export (ikona stažení)
    Then se stáhne soubor "playlist.json"
    And soubor obsahuje všechny moje stanice

  Scenario: Import playlistu z JSON souboru
    Given mám prázdný playlist
    When kliknu na tlačítko import (ikona nahrání)
    And vyberu validní JSON soubor s playlistem
    Then se stanice ze souboru načtou do playlistu
```

---

## Scénář 8: Výběr formátu a bitrate streamu

```gherkin
Feature: Výběr kvality streamu
  Jako uživatel
  Chci vybrat formát a bitrate streamu
  Abych měl kontrolu nad kvalitou přehrávání

  Scenario: Výběr MP3 formátu s vysokým bitratem
    Given jsem v modálním okně pro výběr rádia
    And vybral jsem rádio s více formáty
    When kliknu na tlačítko "MP3"
    And kliknu na tlačítko "320k"
    Then se ve footer sekci zobrazí vybraný formát a bitrate
    And tlačítka jsou vizuálně označena jako aktivní
```

---

## Scénář 9: Přepínání mezi stanicemi v playlistu

```gherkin
Feature: Přepínání stanic
  Jako uživatel
  Chci rychle přepínat mezi stanicemi v playlistu
  Abych mohl snadno měnit to, co poslouchám

  Scenario: Přepnutí na jinou stanici během přehrávání
    Given přehrávám stanici "Radio 1"
    And mám v playlistu další stanici "Radio 2"
    When kliknu na stanici "Radio 2" v playlistu
    Then se zastaví přehrávání "Radio 1"
    And začne se přehrávat "Radio 2"
    And indikátor aktivity se přesune na "Radio 2"
```

---

## Scénář 10: Ošetření chyby při přehrávání

```gherkin
Feature: Ošetření chyb
  Jako uživatel
  Chci vidět srozumitelnou chybovou hlášku
  Když stream nelze přehrát

  Scenario: Zobrazení chyby při nedostupném streamu
    Given mám v playlistu stanici s neplatnou URL
    When kliknu na tuto stanici
    And kliknu na tlačítko play
    Then se zobrazí chybová zpráva
    And ikona chyby je viditelná
    And tlačítko play zůstává funkční pro opakovaný pokus
```

---

## Pokrytí funkcionality

| Oblast | Scénáře |
|--------|---------|
| Přehrávání | 1, 6, 9 |
| Katalog rádií | 1, 2, 3, 8 |
| Playlist management | 4, 5, 7 |
| Error handling | 10 |
| Perzistence | 5, 7 |
