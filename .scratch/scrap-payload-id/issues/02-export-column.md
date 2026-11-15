# 02 – Payload ID v exporte

Status: ready-for-agent
Rodič: [spec.md](../spec.md)
Blokované: [01](01-schema-and-save.md)

## Čo postaviť

- `Scrapify/src/routes/(Client)/scrapRecords/columns.ts`: do `scrapRecordColumns` pridať na koniec `{ key: 'payloadRecId', label: 'Payload ID', exportValue: (r) => r.payloadRecId ?? null }` (a rozšíriť `ScrapRecordColumnKey`).
- `scrapRecordTableColumns` (tabuľka) sa nemení.

## Akceptačné kritériá

- [ ] Export `.xlsx` má posledný stĺpec **Payload ID**, existujúce stĺpce sa neposunuli.
- [ ] Staré záznamy majú v exporte prázdnu bunku.
- [ ] Tabuľka `scrapRecords` vyzerá rovnako ako predtým.
- [ ] `tests/scrap-records-export.test.ts` je upravený a `bun run check` + `bun run test` prechádzajú.
