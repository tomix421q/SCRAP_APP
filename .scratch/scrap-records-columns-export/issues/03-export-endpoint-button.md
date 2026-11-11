# 03 – Export scrap records do Excelu (endpoint + tlačidlo)

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [01](01-shared-filters-new-columns.md), [02](02-xlsx-helper.md)

## Čo postaviť

- Nová GET rúta vedľa stránky `scrapRecords`:
  - prijíma rovnaké query parametre ako stránka (bez `page`) a použije zdieľaný modul filtrov z tiketu 01,
  - načíta všetky vyhovujúce záznamy (`createdAt desc, id desc`, bez `skip/take`),
  - vytvorí súbor cez `buildXlsx` so stĺpcami z definície scrap records (bez Actions) a vráti ho cez `xlsxResponse` s názvom `scrap_records_<YYYY-MM-DD>.xlsx`.
- Hodnoty v exporte: Type ako text, Other component a Other variant ako Yes/No, Replacement part ako part number alebo prázdna bunka, Quantity ako číslo, Created at v lokálnom čase (formát ako `dateTimeLocalTimeDb`).
- Strop 50 000 riadkov → 400 s hláškou na zúženie filtra. Chyba DB → 500 s hláškou.
- Po úspechu `writeToLogger` (`EXPORT`, `ScrapRecord`). Zlyhanie logovania export nezablokuje.
- Tlačidlo `Export (N)` (N = `totalRecords`) v pätičke formulára filtrov:
  - exportuje podľa aktuálnej URL (aplikované filtre a kategória),
  - sťahuje cez `fetch` → blob → download, so spinnerom a zablokované počas exportu, pri 0 záznamoch neaktívne,
  - pri chybe zobrazí toast cez sonner (ako `DeleteBtn`) s hláškou zo servera.
- Starý `/api/export/scrap` sa nemení.

## Akceptačné kritériá

- [x] Testy endpointu s mockovaným Prisma klientom:
  - [x] hlavičky odpovede a názov súboru,
  - [x] obsah `.xlsx` (poradie stĺpcov, Yes/No, prázdne bunky, Type, Quantity ako číslo),
  - [x] rovnaké `where` ako load, bez `skip/take`,
  - [x] prázdny výsledok → len hlavička,
  - [x] strop → 400, chyba DB → 500,
  - [x] `activityLogs.create` s `EXPORT`.
- [x] Ručne overené používateľom: export rešpektuje filtre a kategóriu, spinner, neaktívne tlačidlo pri 0, toast pri chybe.
- [x] `bun run check` a `bun run test` prechádzajú.
