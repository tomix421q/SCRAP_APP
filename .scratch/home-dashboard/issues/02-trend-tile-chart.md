# 02 – Dlaždica Trend a graf knižnica

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [01](01-filters-load-number-tiles.md)

## Čo postaviť

- Pridať shadcn-svelte `chart` (LayerChart) do `ui/`.
- **Časové koše:** čistá funkcia, ktorá podľa dĺžky obdobia zvolí granularitu (po hodinách do 2 dní, po dňoch do 90 dní, po týždňoch nad 90 dní) a doplní prázdne koše nulami.
- **Dáta:** súčet `quantity` na kôš, zvlášť scrap a rebuild, s rešpektovaním filtrov project a obdobie.
- **Dlaždica Trend:** stacked stĺpce, scrap `chart-1`, rebuild `chart-warning`, legenda, popisky osi primerané granularite, tooltip s kusmi.

## Akceptačné kritériá

- [x] Granularita sa mení podľa obdobia podľa pravidiel vyššie.
- [x] Koše bez záznamov sa zobrazia ako prázdne, os nemá diery.
- [x] Súčet stĺpcov sa rovná číslu v dlaždici Total parts.
- [x] Časy sú v lokálnom čase servera, rovnako ako na `/scrapRecords`.
- [x] Unit testy pre voľbu granularity a dopĺňanie košov.
- [x] `bun run check` a `bun run test` prechádzajú.
