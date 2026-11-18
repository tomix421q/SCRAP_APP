# 02 – Filter v scrap móde a serverová kontrola

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [01](01-schema-admin-boxes.md)

## Čo postaviť

- **`ScrapManager`:** v scrap móde pracovať iba s part groups bez `hiddenInScrap`:
  - riadky formulára,
  - kandidáti na príčinu other component,
  - `canSubmit`.
  Filter cez `$derived`. Rebuild a quantity scrap ostávajú bez zmeny.
- **`Scrap.svelte`:** pri 0 viditeľných part groups zobraziť hlášku, že žiadna part group nie je v scrap móde zapnutá. Uloženie nie je možné.
- **`scandmclabel/+page.server.ts` – `saveScrap`:** pri `isRebuild = false` overiť v DB, že žiadna part group z payloadu (riadok ani `otherComponentCauseGroupId`) nemá `hiddenInScrap`. Inak vrátiť 400 s hláškou.

## Akceptačné kritériá

- [x] Skrytá part group sa v scrap móde nezobrazí a nie je v ponuke príčin.
- [x] V rebuild móde sa skrytá part group zobrazí ako doteraz.
- [x] Label bez viditeľných part groups ukáže v scrap móde hlášku a nedá sa uložiť.
- [x] Server vráti 400 pre skrytú part group ako riadok aj ako príčinu, a rebuild so skrytou part group uloží.
- [x] Testy `saveScrap` s mockovaným Prisma klientom a testy `ScrapManager` (bez DOM).
- [x] `npm run check` a `npm run test` prechádzajú.

## Comments
