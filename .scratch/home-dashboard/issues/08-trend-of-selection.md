# 08 – Trend vybranej part group alebo scrap code

Status: todo
Rodič: [spec.md](../spec.md)
Blokované: [05](05-analytics-section-sparkline.md)

## Čo postaviť

- Dlaždica Trend of selection: výber druhu (Part group / Scrap code) a položky cez existujúci `Combobox`. Zoznam položiek je to, čo má v období a pri filtri projektu záznamy.
- Výber v URL (`?trend=partGroup:<id>` alebo `?trend=scrapCode:<kód>`), neplatná hodnota vráti 400; bez výberu výzva „Select a part group or scrap code".
- Graf cez zdieľaný `TrendChart` s rovnakými časovými košmi ako Trend; dáta len pre vybranú položku.
- Výber sa zahrnie do kľúča 60 s cache.

## Akceptačné kritériá

- [ ] Súčet stĺpcov sa rovná kusom vybranej položky za obdobie a projekt.
- [ ] Obnovenie stránky a zdieľaný link zachovajú výber.
- [ ] Zmena projektu, ktorý vybranú položku nemá, ukáže prázdny graf, nie chybu.
- [ ] Unit testy pre parsovanie výberu a načítanie s mockovaným Prisma klientom.
- [ ] `npm run check` a `npm run test` prechádzajú.
- [ ] Dotazy overené aj proti reálnej DB (iba čítanie).
