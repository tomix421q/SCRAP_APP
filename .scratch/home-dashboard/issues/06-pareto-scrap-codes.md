# 06 – Pareto scrap codes

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [05](05-analytics-section-sparkline.md)

## Čo postaviť

- Dlaždica Pareto: top 10 scrap codes zostupne podľa kusov ako stĺpce (`chart-1`), zvyšok ako jeden stĺpec „Others", čiara kumulatívneho podielu v % (`chart-2`, os 0 – 100 %).
- Záznamy bez scrap code ako „No code".
- Dáta z rovnakého dotazu ako Top scrap codes, rozšíreného o zvyšok („Others"); podiely sa rátajú z celku za obdobie a filter.
- Tooltip: kód, popis, kusy, podiel, kumulatívny podiel.

## Akceptačné kritériá

- [x] Kumulatívna čiara končí na 100 % a posledný stĺpec „Others" zodpovedá zvyšku.
- [x] Súčet všetkých stĺpcov sa rovná Total parts.
- [x] Reaguje na project aj obdobie; prázdne obdobie ukáže „No parts in this period".
- [x] Unit testy pre kumulatívny podiel a zlúčenie zvyšku.
- [x] `npm run check` a `npm run test` prechádzajú.
- [x] Dotazy overené aj proti reálnej DB (iba čítanie).

## Comments

**2026-11-16 – uzavreté.** Rozhodnutia počas implementácie:

- **Bez graf knižnice:** Pareto je HTML (stĺpce) + SVG (čiara), nie LayerChart. Kombinácia stĺpcov a čiary by v LayerChart vyžadovala vlastné `marks`, ktoré sa nedali overiť bez prehliadača; takto sa vykreslí aj na serveri a dá sa overiť v SSR výstupe.
- **Jedna os:** výška stĺpca aj čiara sú na tej istej škále 0 – 100 % všetkých kusov (os vpravo).
- **Farba čiary:** `chart-info` namiesto `chart-2`, lebo `chart-2` je v tmavej téme príliš tmavý. Stĺpec „Others" je `muted-foreground`.
- **Dáta:** žiadny nový dotaz; Pareto sa skladá z rebríčka Top scrap codes (top 10 + „Others" = Total parts − súčet top 10) čistou funkciou `buildPareto`.
- **Tooltip:** natívny `title` (kód, popis, kusy, podiel, kumulatívny podiel), plus `sr-only` text pre čítačky.
- **Sekcia Analytics:** pridaná pod hornú mriežku (1 / 2 stĺpce), Pareto zaberá na xl oba stĺpce.
- **Overenie:** proti reálnej DB (iba čítanie) – 30 dní: 10 kódov + „Others · 7 more", čiara končí na 100 %. Vizuál neoverený v prehliadači.
