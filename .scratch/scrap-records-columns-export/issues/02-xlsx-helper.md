# 02 – Univerzálny xlsx helper

Status: done
Rodič: [spec.md](../spec.md)
Blokované: –

## Čo postaviť

Generický, typovo bezpečný serverový helper v `$lib/utils` bez väzby na Prisma alebo scrap records. Použije existujúcu knižnicu `xlsx`.

```ts
type XlsxColumn<T> = {
	header: string;
	value: (row: T) => string | number | boolean | Date | null;
};
buildXlsx<T>(rows: T[], columns: XlsxColumn<T>[], sheetName: string): Buffer;
xlsxResponse(buffer: Buffer, fileName: string): Response;
```

- `null` → prázdna bunka, `number` → číselná bunka, `Date` → dátumová bunka, `boolean` → boolean bunka.
- `xlsxResponse` nastaví content-type pre `.xlsx` a `Content-Disposition: attachment; filename="…"`.
- Typ stĺpca navrhnúť tak, aby sa doň neskôr dalo doplniť mapovanie pre import (header ↔ kľúč). Import sa neimplementuje.

## Akceptačné kritériá

- [x] Test: riadky a stĺpce → `buildXlsx` → spätne načítané cez `xlsx`; overená hlavička v poradí, typy buniek (číslo, dátum, boolean, null → prázdna).
- [x] Test: `xlsxResponse` vracia správny content-type a `Content-Disposition`.
- [x] Prázdne `rows` → hárok len s hlavičkou.
- [x] Žiadne `any`; `bun run check` a `bun run test` prechádzajú. *Helper je v `$lib/utils/xlsx.server.ts` (prípona `.server` drží `xlsx` mimo klienta).*
