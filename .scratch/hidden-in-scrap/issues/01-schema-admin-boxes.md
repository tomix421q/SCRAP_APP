# 01 – Schéma, admin checkbox a ohraničené boxy

Status: done
Rodič: [spec.md](../spec.md)
Blokované: —

## Čo postaviť

- **Schéma:** `PartGroup.hiddenInScrap Boolean @default(false)` v `schema.prisma`, `prisma generate`. Návrh na `db push` odovzdať používateľovi.
- **Zod:** rozšíriť schému vstupu part group v `src/lib/utils/zod/index.ts` o `hiddenInScrap` (rovnaký `preprocess` ako `isRebuild`). Žiadna väzba na `isRebuild`.
- **Server `admin/partgroups`:** create aj update akcia zapíše `hiddenInScrap`.
- **Formulár `admin/partgroups/+page.svelte`:**
  - `$state` `hiddenInScrap`, reset po uložení, načítanie pri edite, odoslanie vo `FormData`,
  - dva `<fieldset>` s `<legend>`: „Re-build mode options“ (existujúce „Rebuild group“, „Cannot be main reason“) a „Scrap mode options“ (nový checkbox „Hide in scrap mode“),
  - `rounded-md border border-border`, legenda `text-muted-foreground`, na desktope vedľa seba, na mobile pod sebou.
- **Tabuľka:** `NewGroupTable.svelte` dostane stĺpec „Hidden in scrap“.

## Akceptačné kritériá

- [x] Nová part group má `hiddenInScrap = false`, ak checkbox nikto nezaškrtol.
- [x] Zaškrtnutý checkbox sa uloží pri create aj update a pri edite sa načíta.
- [x] Zmena „Rebuild group“ neovplyvní „Hide in scrap mode“ a naopak.
- [x] Oba boxy sú ohraničené, majú legendu a na mobile sú pod sebou.
- [x] Tabuľka part groups zobrazuje stĺpec „Hidden in scrap“.
- [x] Iba sémantické tokeny, žiadne priame farby.
- [x] Testy admin akcií s mockovaným Prisma klientom.
- [x] `npm run check` a `npm run test` prechádzajú.

## Comments
