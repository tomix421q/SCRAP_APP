# 05 – Kontrola allowed labels pri skene a uložení

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [01](01-schema.md)

## Čo postaviť

- **`Scrapify/src/lib/server/operatorLabelAccess.ts`:**
  - `getAllowedLabelIds(cardId: number): Promise<Set<number> | null>`
  - `null` vráti, keď card ID patrí useri s účtom alebo operátorovi s `hasLabelRestriction = false`. Ak má card ID operátor aj user, platí operátor (ako v `findCardHolder`).
  - inak vráti množinu ID allowed labels, aj prázdnu.
- **`scanDmc`:** formulár v `Scan.svelte` pošle aj `operator` (`$operatorCardId`). Po nájdení masky sa overí právo.
- **`saveScrap`:** pred zápisom sa overí právo na masku, ktorá zodpovedá `dmc`.
- **`saveQuantityScrap`:** pred zápisom sa overí právo na `labelGroupId`.
- Nepovolená maska vráti `fail(403, …)` s textom
  „Operátor {meno} nemá povolenú masku {code} ({vProject}). Kontaktujte správcu.“

## Akceptačné kritériá

- [x] Neobmedzený operátor a user s účtom skenujú a ukladajú ako doteraz.
- [x] Obmedzený operátor naskenuje a uloží povolenú masku.
- [x] Nepovolená maska skončí chybou 403 v `scanDmc`, `saveScrap` aj `saveQuantityScrap` (aj priamym POST).
- [x] Obmedzený operátor bez masiek nesmie nič.
- [x] Testy `getAllowedLabelIds` (user, neobmedzený, obmedzený prázdny, obmedzený s maskami) a 403 v troch akciách, s mockovaným Prisma klientom.
- [x] `npm run check` a `npm run test` prejdú.

## Comments
