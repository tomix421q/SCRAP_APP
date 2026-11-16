# 04 – Detailné dialógy a prechod na scrap records

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [02](02-trend-tile-chart.md), [03](03-ranking-tiles.md)

## Čo postaviť

- Odkaz „Details ›" v hlavičke dlaždíc Trend, Projects, Top part groups a Top scrap codes. Total parts, Master data a All-time ho nemajú.
- Detail v existujúcom `ui/dialog`:
  - Trend: väčší graf za zvolené obdobie,
  - Projects / Top part groups / Top scrap codes: rebríček top 10 s poradím, kusmi, podielom v % a rozpadom scrap / rebuild, plus text „Top 10 of N".
- Hlavička dialógu ukazuje aktívne obdobie a projekt.
- Tlačidlo „Open in scrap records" otvorí `/scrapRecords` s predvyplneným obdobím a projektom; názvy parametrov podľa `parseScrapRecordFilters`.
- Top 10 sa načíta spolu s dlaždicami (žiadny ďalší request pri otvorení), pokiaľ to výrazne nespomalí load.

## Akceptačné kritériá

- [x] Dialóg sa otvára iba cez „Details ›"; klik na riadok projektu naďalej filtruje.
- [x] Podiely v % sa rátajú z celku za obdobie a filter, nie z top 10.
- [x] „Open in scrap records" zobrazí na `/scrapRecords` rovnaké obdobie a projekt ako dashboard.
- [x] Dialóg sa dá zavrieť klávesom Esc a je použiteľný na úzkej obrazovke.
- [x] `bun run check` a `bun run test` prechádzajú.

## Comments

**2026-11-16 – uzavreté.** Rozhodnutia počas implementácie:

- **Top 10:** načíta sa spolu s dlaždicami; dlaždice Top part groups a Top scrap codes z neho ukazujú prvých 5. Počet položiek („Top 10 of N") ide z `COUNT(*) OVER ()` v tom istom dotaze.
- **Podiely v %:** základ je Total parts za obdobie a filter (pri Projects súčet všetkých projektov, lebo ignoruje filter projektu).
- **Open in scrap records:** posiela `dateFrom`, `dateTo` (posledná minúta obdobia, lebo `/scrapRecords` berie `dateTo` vrátane minúty) a `project`. Rolling obdobia sú zaokrúhlené na minúty.
- **Dialóg Projects:** hlavička ukazuje aj vybraný projekt a odkaz ho obsahuje, hoci rebríček projektov filter projektu ignoruje.
