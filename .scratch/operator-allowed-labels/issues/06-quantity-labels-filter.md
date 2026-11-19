# 06 – Filtrovanie quantity scrap labelov podľa operátora

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [05](05-scan-save-guard.md)

## Čo postaviť

- **Akcia `allowedQuantityScrapLabels`** v `scandmclabel/+page.server.ts`:
  - vstup `operator` (card ID, iba číslice),
  - vráti quantity scrap labely (rovnaký tvar ako `data.quantityScrapLabels`), vyfiltrované cez `getAllowedLabelIds`. Ak funkcia vráti `null`, vráti všetky.
- **`Scan.svelte`:** po prihlásení alebo zmene operátora (`$operatorCardId`) zavolá akciu a zobrazí jej výsledok namiesto `data.quantityScrapLabels`.
  - počas načítania je zoznam neaktívny,
  - prázdny výsledok zobrazí existujúci prázdny stav,
  - stav odvodiť cez `$derived` tam, kde to ide. `$effect` použiť iba na spustenie načítania pri zmene karty.
- Uloženie chráni už [05](05-scan-save-guard.md).

## Akceptačné kritériá

- [x] Neobmedzený operátor a user s účtom vidia všetky quantity scrap labely.
- [x] Obmedzený operátor vidí iba povolené. Bez masiek nevidí žiadny.
- [x] Po zmene operátora sa zoznam obnoví a nezostanú v ňom labely predchádzajúceho operátora.
- [x] Testy akcie s mockovaným Prisma klientom.
- [x] `npm run check` a `npm run test` prejdú.

## Comments
