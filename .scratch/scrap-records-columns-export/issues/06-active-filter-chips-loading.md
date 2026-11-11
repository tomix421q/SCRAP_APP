# 06 – Štítky aktívnych filtrov a stav načítavania

Status: done
Robí sa spolu s: [07](07-compact-filter-panel.md) (štítky sú posledný riadok kompaktného panelu)
Rodič: [spec.md](../spec.md)
Blokované: [01](01-shared-filters-new-columns.md), [04](04-visual-alignment-readability.md)

## Čo postaviť

- Nad tabuľkou riadok štítkov odvodených (`$derived`) z aktuálnej URL: každý aktívny filter (napr. `Project: X ×`, `Other variant: Yes ×`, `Date from: …`) a kategória, ak nie je `all`.
- Klik na × odstráni daný parameter z URL a resetuje `page` (rovnaký `goto` ako pri existujúcich filtroch). Pri zrušení projektu sa zachová existujúce správanie (vymazanie scrap code a part group).
- Riadok sa nezobrazí, ak nie je aktívny žiadny filter.
- Počas `navigating` má kontajner tabuľky `opacity-60` a `pointer-events-none`.
- Štítky používajú existujúci `ui/badge` a sémantické tokeny.

## Akceptačné kritériá

- [x] Štítky zodpovedajú URL aj po obnovení stránky a po kliknutí na Apply/Clear.
- [x] Zrušenie štítku odstráni iba daný filter a vráti stránkovanie na prvú stranu.
- [x] Počas načítavania je tabuľka stlmená a po načítaní sa vráti do normálu.
- [x] `bun run check` prechádza.
