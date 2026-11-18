# 07 – Heatmapa deň × hodina

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [05](05-analytics-section-sparkline.md)

## Čo postaviť

- Dlaždica Heatmap: mriežka 7 dní (Po–Ne) × 24 hodín, intenzita farby podľa kusov (`chart-1` s priehľadnosťou škálovanou podľa maxima), prázdne bunky bez výplne.
- Dáta: súčet kusov a počet recordov na bunku; deň a hodina z lokálneho času DB, týždeň od pondelka (index dňa od 1900-01-01 modulo 7).
- Čistá funkcia na skladanie mriežky a škálovanie intenzity.
- Tooltip: deň, hodina, kusy, počet scrap recordov. Mriežka je ovládateľná čítačkou (popisky riadkov a stĺpcov).

## Akceptačné kritériá

- [x] Súčet všetkých buniek sa rovná Total parts.
- [x] Záznam o 23:59 je v hodine 23 a v správnom dni, aj pri zmene letného času.
- [x] Reaguje na project aj obdobie.
- [x] Na úzkej obrazovke sa dá horizontálne posúvať vnútri dlaždice, stránka sa neposúva.
- [x] Unit testy pre skladanie mriežky a škálovanie intenzity.
- [x] `npm run check` a `npm run test` prechádzajú.
- [x] Dotazy overené aj proti reálnej DB (iba čítanie).

## Comments

**2026-11-16 – uzavreté.** Rozhodnutia počas implementácie:

- **Bez graf knižnice:** heatmapa je HTML tabuľka 7 × 24 s popiskami riadkov a stĺpcov (`th scope`) a `sr-only` textom v každej bunke; tooltip je natívny `title`.
- **Dáta:** nový čítací dotaz `loadHeatmap` (`DATEDIFF(DAY, 0, createdAt) % 7`, `DATEPART(HOUR, createdAt)`, pondelok = 0), rovnaké záznamy ako Total parts. Pri 23:59 a zmene času je hodina 23, lebo DB drží lokálny čas bez posunu.
- **Intenzita:** `heatmapIntensity` – lineárne podľa maxima, neprázdna bunka má minimálne 15 % krytie, aby bola viditeľná; prázdne bunky bez výplne.
- **Úzka obrazovka:** tabuľka má min. šírku a posúva sa horizontálne vnútri dlaždice (`min-w-0` na karte).
- **Testy:** `heatmap.test.ts` (mriežka, deň v týždni, intenzita) a rozšírený `dashboard-load.test.ts`; trend dotaz sa v mocku rozlišuje podľa `AS bucket`, lebo `DATEDIFF` už používa aj heatmapa.
- **Overenie:** proti reálnej DB (iba čítanie) – 30 dní: 23 neprázdnych buniek, súčet 408 kusov / 226 recordov = Total parts. Vizuál neoverený v prehliadači.
