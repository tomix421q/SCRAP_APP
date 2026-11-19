# 01 – Schéma: allowed labels a updatedAt na Operator

Status: done
Rodič: [spec.md](../spec.md)
Blokované: —

## Čo postaviť

- **Schéma** `Scrapify/prisma/schema.prisma`:
  - `Operator.updatedAt DateTime? @updatedAt`
  - `Operator.hasLabelRestriction Boolean @default(false)`
  - `Operator.allowedLabels LabelGroup[] @relation("OperatorAllowedLabels")`
  - `LabelGroup.allowedOperators Operator[] @relation("OperatorAllowedLabels")`
- `npx prisma generate` (lokálne, bez zápisu do DB).
- **Žiadny `db push`.** Zmenu schémy odovzdať používateľovi na schválenie. `db push` spustí sám po zálohe.

## Akceptačné kritériá

- [x] Schéma obsahuje nové polia a implicitnú many-to-many reláciu.
- [x] `prisma generate` prejde a typy klienta obsahujú `allowedLabels` a `hasLabelRestriction`.
- [x] Existujúce riadky `Operator` dostanú `hasLabelRestriction = false` (default) a `updatedAt = NULL`.
- [x] `npm run check` prejde.
- [x] Používateľ potvrdil `db push`.

## Comments

- 2026-11-19: Schéma upravená, `prisma validate` + `prisma generate` + `npm run check` prešli (0 chýb). `prisma format` zarovnal aj ostatné modely (iba whitespace). Čaká sa na `db push` používateľom po zálohe.
- 2026-11-19: Používateľ spustil `db push`. Tiket uzavretý.
- 2026-11-19: Overené čítaním z DB: 6 operátorov, všetci `hasLabelRestriction = false`, `updatedAt = NULL`, žiadne väzby na `allowedLabels`.
