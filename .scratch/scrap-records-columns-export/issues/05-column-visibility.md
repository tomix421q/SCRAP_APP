# 05 – Skrývanie stĺpcov

Status: wontfix

> Zrušené po dizajnovej revízii: tabuľka má 10 stĺpcov s dvojriadkovými bunkami, všetky údaje sú potrebné a zmestia sa na šírku. Príznak `hideable` bol z definície stĺpcov odstránený.
Rodič: [spec.md](../spec.md)
Blokované: [04](04-visual-alignment-readability.md)

## Čo postaviť

- Tlačidlo **Columns** nad tabuľkou s existujúcim `ui/dropdown-menu` a checkboxmi, vygenerovanými zo stĺpcov tabuľky (`scrapRecordTableColumns`, 10 stĺpcov vrátane dvojriadkových Part group / Project a Scrap code / Description).
- Predvolene sú viditeľné všetky stĺpce. ID, DMC a Actions sa skryť nedajú (podľa príznaku v definícii).
- Voľba sa ukladá do `localStorage` (pohodlie pre daného používateľa). Každé čítanie a zápis je v `try/catch` a bez úložiska sa použije predvolené nastavenie. Neznáme alebo zastarané kľúče sa ignorujú.
- Viditeľné stĺpce sa odvodzujú cez `$derived`, nie synchronizáciou v `$effect`. `colspan` prázdneho riadku a oddeľovače skupín sa počítajú z viditeľných stĺpcov (oddeľovač dostane prvý viditeľný stĺpec skupiny).
- Skryté stĺpce nemajú vplyv na export.
- Part group a Scrap code nemajú pevnú šírku a delia sa o voľné miesto. Ak sa skryjú oba, voľné miesto sa rozdelí medzi ostatné stĺpce a posun prilepeného DMC (`left-14`) prestane sedieť. Treba zabezpečiť, aby vždy ostal aspoň jeden flexibilný stĺpec (alebo počítať posun inak).

## Akceptačné kritériá

- [ ] Skrytie a zobrazenie stĺpca funguje bez reloadu a pretrvá po obnovení stránky.
- [ ] S nedostupným `localStorage` (privátne okno) stránka funguje s predvolenými stĺpcami.
- [ ] ID, DMC a Actions nemajú v menu aktívny checkbox na skrytie.
- [ ] Export obsahuje všetky stĺpce bez ohľadu na skrytie.
- [ ] `bun run check` prechádza.
