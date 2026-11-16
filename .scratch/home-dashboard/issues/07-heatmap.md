# 07 – Heatmapa deň × hodina

Status: todo
Rodič: [spec.md](../spec.md)
Blokované: [05](05-analytics-section-sparkline.md)

## Čo postaviť

- Dlaždica Heatmap: mriežka 7 dní (Po–Ne) × 24 hodín, intenzita farby podľa kusov (`chart-1` s priehľadnosťou škálovanou podľa maxima), prázdne bunky bez výplne.
- Dáta: súčet kusov a počet recordov na bunku; deň a hodina z lokálneho času DB, týždeň od pondelka (index dňa od 1900-01-01 modulo 7).
- Čistá funkcia na skladanie mriežky a škálovanie intenzity.
- Tooltip: deň, hodina, kusy, počet scrap recordov. Mriežka je ovládateľná čítačkou (popisky riadkov a stĺpcov).

## Akceptačné kritériá

- [ ] Súčet všetkých buniek sa rovná Total parts.
- [ ] Záznam o 23:59 je v hodine 23 a v správnom dni, aj pri zmene letného času.
- [ ] Reaguje na project aj obdobie.
- [ ] Na úzkej obrazovke sa dá horizontálne posúvať vnútri dlaždice, stránka sa neposúva.
- [ ] Unit testy pre skladanie mriežky a škálovanie intenzity.
- [ ] `npm run check` a `npm run test` prechádzajú.
- [ ] Dotazy overené aj proti reálnej DB (iba čítanie).
