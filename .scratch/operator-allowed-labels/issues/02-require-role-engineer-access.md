# 02 – requireRole a prístup ENGINEER na operatorregister

Status: done
Rodič: [spec.md](../spec.md)
Blokované: —

## Čo postaviť

- **`requireRole(event, roles)`** v `Scrapify/src/lib/utils` (najprv skontrolovať existujúce `getUserServer` a `ErrorHandler`):
  - neprihlásený vráti 401, nepovolená rola 403,
  - typovo bezpečná a generická (`roles: readonly Role[]`), vráti prihláseného usera s rolou.
- **Layout guard** `(Admin)/admin/+layout.server.ts`:
  - ADMIN a MODERATOR: bez zmeny,
  - ENGINEER: povolená iba cesta `/admin/operatorregister`. Na `/admin` ho presmeruje na `/admin/operatorregister`, inde na `/`.
- **Akcie operatorregister** (`createOperator`, `deleteOperator`): na začiatku `requireRole(event, ['ADMIN', 'MODERATOR', 'ENGINEER'])`.
- `createdBy` brať zo session (výsledok `requireRole`), nie zo skrytého inputu formulára.
- Odstrániť `any` v `catch` blokoch routy.

## Akceptačné kritériá

- [x] ENGINEER otvorí `/admin/operatorregister`. Na `/admin` je presmerovaný na operatorregister, na `/admin/partgroups` na `/`.
- [x] ADMIN a MODERATOR majú prístup ako doteraz.
- [x] Priamy POST na `createOperator` alebo `deleteOperator` bez prihlásenia vráti 401, s rolou USER 403.
- [x] ENGINEER vytvorí aj zmaže operátora.
- [x] Testy `requireRole` a akcií s mockovaným Prisma klientom.
- [x] `npm run check` a `npm run test` prejdú.

## Comments
