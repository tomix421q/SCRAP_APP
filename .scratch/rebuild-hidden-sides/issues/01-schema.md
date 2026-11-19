# 01 – Schéma: hiddenInRebuild príznaky strán na PartGroup

Status: done
Rodič: [spec.md](../spec.md)
Blokované: —

## Čo postaviť

- `Scrapify/prisma/schema.prisma`, model `PartGroup`:
  - `hiddenInRebuildFR Boolean? @default(false)`
  - `hiddenInRebuildFL Boolean? @default(false)`
  - `hiddenInRebuildRR Boolean? @default(false)`
  - `hiddenInRebuildRL Boolean? @default(false)`
- Polia sú nullable, aby sa nerozbili existujúce dáta.
- `npx prisma generate` (lokálne, bez zápisu do DB).
- **Žiadny `db push`.** Zmenu odovzdať používateľovi, `db push` spustí sám po zálohe.

## Akceptačné kritériá

- [x] Schéma obsahuje 4 nové nullable polia s defaultom `false`.
- [x] `prisma validate` a `prisma generate` prejdú.
- [x] `npm run check` prejde.
- [x] Používateľ potvrdil `db push`.

## Comments
