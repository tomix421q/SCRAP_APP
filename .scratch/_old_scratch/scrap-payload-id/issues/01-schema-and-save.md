# 01 – Schéma a zápis payloadRecId

Status: done
Rodič: [spec.md](../spec.md)

## Čo postaviť

- `Scrapify/prisma/schema.prisma`: `payloadRecId String? @db.UniqueIdentifier` + `@@index([payloadRecId])`. Claude iba upraví súbor a spustí `prisma generate` (bez zápisu do DB); `db push` spraví používateľ po zálohe.
- `Scrapify/src/routes/(Client)/scandmclabel/+page.server.ts`:
  - `saveScrap`: po všetkých validáciách `const payloadRecId = randomUUID()` (z `node:crypto`) a pridať ho do každého riadku v `recordsToInsert`.
  - `saveQuantityScrap`: rovnako pre každý riadok v `createMany`.
- Zod (`src/lib/utils/zod/index.ts`) sa nemení – ID nejde z klienta.
- Klientovi sa `payloadRecId` nevracia.

## Akceptačné kritériá

- [ ] Všetky záznamy jedného uloženia (scrap, rebuild, quantity) majú rovnaké `payloadRecId`.
- [ ] Dve uloženia (aj pre to isté DMC) majú rôzne `payloadRecId`.
- [ ] Hodnota z formulára (ak by ju klient poslal) sa ignoruje.
- [ ] Test s mockovaným Prisma klientom (`Scrapify/tests/`, vzor `operator-history.test.ts`) overuje body vyššie pre `saveScrap` aj `saveQuantityScrap`.
- [ ] `bun run check` a `bun run test` prechádzajú.
