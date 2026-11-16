# 09 – Aktivita skenovania podľa Card ID

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [05](05-analytics-section-sparkline.md)

## Čo postaviť

- Dlaždica Scanning activity: top 10 Card ID podľa počtu scrap recordov, pri každom aj kusy.
- Výhradne Card ID z `ScrapRecord.createdBy`; žiadne načítanie mien z `Operator` ani `User`.
- Popis „Scanning activity", neutrálne farby (pruh `chart-1`), žiadne hodnotenie ani vyznačenie „najlepší / najhorší".
- Rešpektuje project a obdobie; „Top 10 of N" ako v detailoch.

## Akceptačné kritériá

- [x] V dlaždici ani v dátach nie je meno operátora ani usera.
- [x] Počet recordov všetkých Card ID sa rovná Records v Total parts (pri zobrazení všetkých).
- [x] Reaguje na project aj obdobie.
- [x] Unit testy s mockovaným Prisma klientom.
- [x] `npm run check` a `npm run test` prechádzajú.
- [x] Dotazy overené aj proti reálnej DB (iba čítanie).
