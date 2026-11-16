# 03 – Rebríčkové dlaždice Projects, Top part groups, Top scrap codes

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [01](01-filters-load-number-tiles.md)

## Čo postaviť

- **Projects:**
  - všetky projekty s aspoň jedným scrap recordom v období, zostupne podľa kusov,
  - riadok: názov, pruh scrap / rebuild, kusy,
  - klik na riadok nastaví filter projektu, klik na vybraný ho zruší,
  - nereaguje na filter projektu (iba zvýrazní vybraný), reaguje na obdobie,
  - pevná výška, pri viac než 6 projektoch scroll vnútri dlaždice,
  - z rovnakých dát sa plní prepínač projektu v hornom riadku.
- **Top part groups:** top 5 podľa kusov, názov + kusy + pruh.
- **Top scrap codes:** top 5 podľa kusov, kód + popis + kusy + pruh. Záznamy bez scrap code sa zoskupia ako „No code".
- Pruhy sú obyčajné elementy, bez graf knižnice.

## Akceptačné kritériá

- [x] Projekt bez scrapu v období sa nezobrazí v dlaždici ani v prepínači.
- [x] Klik na projekt prefiltruje Total parts, Trend, Top part groups a Top scrap codes a zapíše sa do URL.
- [x] Súčet kusov všetkých projektov sa rovná Total parts bez filtra projektu.
- [x] Riadky projektov sú ovládateľné klávesnicou (skutočné `button`).
- [x] Load testovaný s mockovaným Prisma klientom.
- [x] `bun run check` a `bun run test` prechádzajú.

## Comments

**2026-11-16 – uzavreté.** Rozhodnutia počas implementácie:

- **Zdroj dát:** tri čítacie `$queryRaw` dotazy s `INNER JOIN PartGroup` (kusy scrap / rebuild v jednom riadku). Zoznam projektov v prepínači sa plní z rebríčka Projects (+ vybraný projekt z URL), starý dotaz `findMany` zanikol.
- **Projects:** projekty bez `vProject` sa do rebríčka nezapočítajú.
- **Top part groups:** pri každom riadku je ako doplnok projekt part group.
- **Bento rozloženie (xl):** Projects je v pravom stĺpci cez 2 riadky, Master data a All-time sú pod sebou v jednej bunke.
- Top 10 pre detail (tiket 04) sa zatiaľ nenačítava, dlaždice berú top 5.
