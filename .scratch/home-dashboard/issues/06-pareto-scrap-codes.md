# 06 – Pareto scrap codes

Status: todo
Rodič: [spec.md](../spec.md)
Blokované: [05](05-analytics-section-sparkline.md)

## Čo postaviť

- Dlaždica Pareto: top 10 scrap codes zostupne podľa kusov ako stĺpce (`chart-1`), zvyšok ako jeden stĺpec „Others", čiara kumulatívneho podielu v % (`chart-2`, os 0 – 100 %).
- Záznamy bez scrap code ako „No code".
- Dáta z rovnakého dotazu ako Top scrap codes, rozšíreného o zvyšok („Others"); podiely sa rátajú z celku za obdobie a filter.
- Tooltip: kód, popis, kusy, podiel, kumulatívny podiel.

## Akceptačné kritériá

- [ ] Kumulatívna čiara končí na 100 % a posledný stĺpec „Others" zodpovedá zvyšku.
- [ ] Súčet všetkých stĺpcov sa rovná Total parts.
- [ ] Reaguje na project aj obdobie; prázdne obdobie ukáže „No parts in this period".
- [ ] Unit testy pre kumulatívny podiel a zlúčenie zvyšku.
- [ ] `npm run check` a `npm run test` prechádzajú.
- [ ] Dotazy overené aj proti reálnej DB (iba čítanie).
