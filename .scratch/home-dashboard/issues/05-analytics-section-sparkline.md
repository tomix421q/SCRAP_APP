# 05 – Sekcia Analytics a sparkline v Total parts

Status: todo
Rodič: [spec.md](../spec.md)
Blokované: [04](04-detail-dialogs.md)

## Čo postaviť

- Pod hornou mriežkou nadpis „Analytics" a druhá bento mriežka pripravená pre dlaždice z tiketov 06 až 09 (1 / 2 stĺpce).
- Do dlaždice Total parts malý sparkline s počtom scrap recordov po dňoch (po hodinách pri 1 day), bez osí, s tooltipom.
- Dáta: počet scrap recordov na kôš, rovnaká funkcia košov ako Trend (`buildTrendBuckets`), rešpektuje project a obdobie.

## Akceptačné kritériá

- [ ] Sparkline sa zmení pri zmene projektu aj obdobia a súčet recordov sa rovná číslu Records v dlaždici.
- [ ] Prázdne obdobie ukáže plochý sparkline bez chyby.
- [ ] Horná mriežka sa na desktope stále zmestí na jednu obrazovku.
- [ ] Unit testy pre počítanie recordov v košoch.
- [ ] `npm run check` a `npm run test` prechádzajú.
- [ ] Dotazy overené aj proti reálnej DB (iba čítanie).
