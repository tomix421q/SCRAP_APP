# 03 – Úprava mena a card ID operátora

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [02](02-require-role-engineer-access.md)

## Čo postaviť

- **Zod schéma** v `Scrapify/src/lib/utils/zod/index.ts`: `updateOperatorSchema` (`id`, `fullName` 5–255, `cardId` iba číslice, kladné bezpečné celé číslo).
- **Akcia `updateOperator`** v `operatorregister/+page.server.ts`:
  - `requireRole(event, ['ADMIN', 'MODERATOR', 'ENGINEER'])`,
  - 404, ak operátor neexistuje, a zrozumiteľná chyba pri duplicitnom `cardId` (`P2002`),
  - `writeToLogger` s akciou `EDIT` (existujúca hodnota `LoggerActionType`) a `entityType: 'Operator'`.
- **Dialóg** (lokálny komponent routy, napr. `_components/EditOperatorDialog.svelte`) nad `$lib/components/ui/dialog`:
  - tlačidlo **Edit** na karte operátora vedľa `DeleteBtn`,
  - polia Name a Card ID (`inputNormalize`), obsah v `cardNormalize`,
  - upozornenie pod Card ID: staré scrap recordy si ponechajú staré card ID,
  - `use:enhance`, výsledok cez `ResultInfo`, po úspechu sa dialóg zatvorí,
  - iba sémantické tokeny témy.

## Akceptačné kritériá

- [x] Úprava mena a card ID sa uloží a zoznam sa obnoví.
- [x] Duplicitné card ID vráti chybu a nič sa nezapíše.
- [x] Neplatný vstup (krátke meno, nečíselná karta) vráti 400.
- [x] Zmena sa zapíše do `ActivityLogs`.
- [x] Testy akcie s mockovaným Prisma klientom.
- [x] `npm run check` a `npm run test` prejdú.

## Comments
