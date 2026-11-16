# 08 – Trend vybranej part group alebo scrap code

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [05](05-analytics-section-sparkline.md)

## Čo postaviť

- Dlaždica Trend of selection: výber druhu (Part group / Scrap code) a položky cez existujúci `Combobox`. Zoznam položiek je to, čo má v období a pri filtri projektu záznamy.
- Výber v URL (`?trend=partGroup:<id>` alebo `?trend=scrapCode:<kód>`), neplatná hodnota vráti 400; bez výberu výzva „Select a part group or scrap code".
- Graf cez zdieľaný `TrendChart` s rovnakými časovými košmi ako Trend; dáta len pre vybranú položku.
- Výber sa zahrnie do kľúča 60 s cache.

## Akceptačné kritériá

- [x] Súčet stĺpcov sa rovná kusom vybranej položky za obdobie a projekt.
- [x] Obnovenie stránky a zdieľaný link zachovajú výber.
- [x] Zmena projektu, ktorý vybranú položku nemá, ukáže prázdny graf, nie chybu.
- [x] Unit testy pre parsovanie výberu a načítanie s mockovaným Prisma klientom.
- [x] `npm run check` a `npm run test` prechádzajú.
- [x] Dotazy overené aj proti reálnej DB (iba čítanie).

## Comments

**2026-11-16 – uzavreté.** Rozhodnutia počas implementácie:

- **Výber v URL:** `parseTrendSelection` (`trendSelection.ts`) vracia `partGroup:<id>` (kladné celé číslo) alebo `scrapCode:<kód>` (neprázdny, max 50 znakov); všetko ostatné je 400. Neexistujúca položka 400 nevracia, ukáže prázdny graf.
- **Zoznam položiek:** part groups a scrap codes s aspoň jedným záznamom v období a projekte; záznamy bez scrap code sa nedajú vybrať. Vybraná položka, ktorá v zozname chýba (iný projekt), sa doplní, aby ju `Combobox` vedel pomenovať.
- **Dáta:** `loadTrend` dostal voliteľný výber (podmienka `sr.partGroupId` / `sr.scrapCode`), takže koše sú rovnaké ako v Trend. Bez výberu sa trend nenačítava.
- **Cache:** výber je súčasťou kľúča 60 s cache.
- **UI:** dve `Combobox`y (druh, položka), graf cez `TrendChart`; zmena druhu zruší `trend` v URL.
- **Overenie:** proti reálnej DB (iba čítanie) – 30 dní: 17 part groups a 14 scrap codes v zozname, súčet stĺpcov vybranej part group aj scrap code sa rovná súčtu kusov. Vizuál neoverený v prehliadači.
