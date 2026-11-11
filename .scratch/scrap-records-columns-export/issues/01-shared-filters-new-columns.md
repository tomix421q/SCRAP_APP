# 01 – Zdieľané filtre, definícia stĺpcov, nové stĺpce a filtre

Status: done
Rodič: [spec.md](../spec.md)
Blokované: –

## Čo postaviť

Prvý tenký rez end-to-end: tabuľka scrap records zobrazí nové stĺpce a dá sa podľa nich filtrovať. Vizuál sa ešte nemení.

- Vytiahnuť parsovanie query parametrov a skladanie `Prisma.ScrapRecordWhereInput` (vrátane kategórií cez `quantityScrapLabelPrefix`) zo server load do zdieľaného modulu. Server load ho použije a správanie existujúcich filtrov ostane rovnaké (chyby 400, horná hranica dátumu +60 s).
- Pridať query parametre `otherVariant` (`true` → `replacementPartMaterial` nie je null, `false` → je null, iná hodnota → 400) a `replacementPart` (`contains`).
- Vytvoriť definíciu stĺpcov scrap records (kľúč, popis, skupina, možnosť skryť, hodnota pre export) v poradí: `ID · DMC` | `Type` | `Part group · Project` | `Scrap code · Description` | `Other component · Other variant · Replacement part` | `Quantity` | `Created by · Created at` | `Actions`.
- Hlavičky a poradie tabuľky čítať z tejto definície. Pribudnú stĺpce Other component (Yes/No), Other variant (odvodené `replacementPartMaterial != null`, prázdny reťazec = null) a Replacement part (part number alebo „—“). Upraviť `min-w` a `colspan` prázdneho riadku.
- Do formulára filtrov pridať Other variant (All/Yes/No, rovnaký vzor ako Other component) a textový filter Replacement part. Doplniť ich do stavu filtrov, synchronizácie z URL aj `clearFilters`.

## Akceptačné kritériá

- [x] Tabuľka zobrazuje 13 stĺpcov v poradí z definície (Actions len pri oprávnení). *Neskôr zmenené po dizajnovej revízii: 13 dátových stĺpcov (export), 10 stĺpcov tabuľky s dvojriadkovými bunkami, viď spec.*
- [x] `otherVariant=true/false` a `replacementPart` filtrujú záznamy aj súčty kategórií; neplatné `otherVariant` → 400.
- [x] Existujúce filtre fungujú bez zmeny.
- [x] Testy server loadu s mockovaným Prisma klientom (prior art `tests/partgroup-photo.test.ts`): nové filtre, chyba 400, regresia existujúcich filtrov a kategórií.
- [x] `cd Scrapify && bun run check` a `bun run test` prechádzajú.
- [x] Zápis na `scandmclabel` je nedotknutý; schéma Prisma sa nemení.
