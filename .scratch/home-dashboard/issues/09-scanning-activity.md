# 09 – Aktivita skenovania podľa Card ID

Status: todo
Rodič: [spec.md](../spec.md)
Blokované: [05](05-analytics-section-sparkline.md)

## Čo postaviť

- Dlaždica Scanning activity: top 10 Card ID podľa počtu scrap recordov, pri každom aj kusy.
- Výhradne Card ID z `ScrapRecord.createdBy`; žiadne načítanie mien z `Operator` ani `User`.
- Popis „Scanning activity", neutrálne farby (pruh `chart-1`), žiadne hodnotenie ani vyznačenie „najlepší / najhorší".
- Rešpektuje project a obdobie; „Top 10 of N" ako v detailoch.

## Akceptačné kritériá

- [ ] V dlaždici ani v dátach nie je meno operátora ani usera.
- [ ] Počet recordov všetkých Card ID sa rovná Records v Total parts (pri zobrazení všetkých).
- [ ] Reaguje na project aj obdobie.
- [ ] Unit testy s mockovaným Prisma klientom.
- [ ] `npm run check` a `npm run test` prechádzajú.
- [ ] Dotazy overené aj proti reálnej DB (iba čítanie).
