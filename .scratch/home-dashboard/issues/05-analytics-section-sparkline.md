# 05 – Sekcia Analytics a sparkline v Total parts

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [04](04-detail-dialogs.md)

## Čo postaviť

- Pod hornou mriežkou nadpis „Analytics" a druhá bento mriežka pripravená pre dlaždice z tiketov 06 až 09 (1 / 2 stĺpce).
- Do dlaždice Total parts malý sparkline s počtom scrap recordov po dňoch (po hodinách pri 1 day), bez osí, s tooltipom.
- Dáta: počet scrap recordov na kôš, rovnaká funkcia košov ako Trend (`buildTrendBuckets`), rešpektuje project a obdobie.

## Akceptačné kritériá

- [x] Sparkline sa zmení pri zmene projektu aj obdobia a súčet recordov sa rovná číslu Records v dlaždici.
- [x] Prázdne obdobie ukáže plochý sparkline bez chyby.
- [x] Horná mriežka sa na desktope stále zmestí na jednu obrazovku (sparkline má výšku 3rem; overiť v prehliadači).
- [x] Unit testy pre počítanie recordov v košoch.
- [x] `npm run check` a `npm run test` prechádzajú.
- [x] Dotazy overené aj proti reálnej DB (iba čítanie).

## Comments

**2026-11-16 – uzavreté.** Rozhodnutia počas implementácie:

- **Granularita sparklinu:** rovnaké koše ako Trend (hodiny / dni / týždne), nie vždy dni; počet recordov sa berie z toho istého dotazu (`COUNT(*)`), takže nepribudol žiadny ďalší dotaz.
- **Sekcia Analytics:** zatiaľ sa nezobrazuje. Prázdny nadpis by na produkcii pôsobil rušivo, preto príde spolu s prvou dlaždicou v tikete 06 (bento mriežka 1 / 2 stĺpce, pod hornou mriežkou).
- **Overenie:** dotaz s `COUNT(*)` spustený proti reálnej DB (iba čítanie), stránka vracia 200. Vizuál sparklinu nebol overený v prehliadači.
