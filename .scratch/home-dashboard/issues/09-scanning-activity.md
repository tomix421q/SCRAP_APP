# 09 – Aktivita skenovania podľa Card ID

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [05](05-analytics-section-sparkline.md)

## Čo postaviť

- Dlaždica Scanning activity: top 10 Card ID podľa počtu scrap recordov, pri každom aj kusy.
- Card ID z `ScrapRecord.createdBy`; meno operátora (`Operator.fullName`) sa ukáže iba v tooltipe pri hoveri, mená z `User` sa nenačítavajú.
- Popis „Scanning activity", neutrálne farby (pruh `chart-1`), žiadne hodnotenie ani vyznačenie „najlepší / najhorší".
- Rešpektuje project a obdobie; „Top 10 of N" ako v detailoch.

## Akceptačné kritériá

- [x] Meno operátora je iba v tooltipe pri hoveri, meno usera nikde.
- [x] Počet recordov všetkých Card ID sa rovná Records v Total parts (pri zobrazení všetkých).
- [x] Reaguje na project aj obdobie.
- [x] Unit testy s mockovaným Prisma klientom.
- [x] `npm run check` a `npm run test` prechádzajú.
- [x] Dotazy overené aj proti reálnej DB (iba čítanie).
