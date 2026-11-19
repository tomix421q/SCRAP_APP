# 04 – Skenovanie: skrytie v rebuilde a serverová kontrola

Status: done
Rodič: [spec.md](../spec.md)
Blokované: 01, 02

## Čo postaviť

- `scandmclabel` load/scan vráti v `groups` aj 4 príznaky.
- `ScrapManager.svelte.ts`: `visibleRows` pre každý mód filtruje cez `getHiddenReason` (nahradí dnešnú podmienku `hiddenInScrap`), main reason a cause candidates počítajú iba z viditeľných riadkov.
- Hláška pri prázdnom zozname v rebuilde a zablokované uloženie.
- `+page.server.ts` `saveScrap`: obe dnešné kontroly `hiddenInScrap` nahradiť `getHiddenReason` (scrap aj rebuild); `fail(400)` s textom z `describeHiddenReason` pre skrytú part group aj skrytú príčinu other component.
- Testy s mockovaným Prisma klientom pre oba 400 prípady.

## Akceptačné kritériá

- [x] Rebuild s DMC so stranou skryje označené part groups. Scrap a quantity scrap bez zmeny.
- [x] Priamy POST so skrytou part group vráti 400, nič sa nezapíše.
- [x] Prázdny zoznam zobrazí hlášku.
- [x] Part group bez QAD identity je viditeľná iba v quantity scrape.
- [x] Scrap mód so `hiddenInScrap` sa správa rovnako ako pred zmenou (regresia).
- [x] Testy a `npm run check` prejdú.

## Comments
