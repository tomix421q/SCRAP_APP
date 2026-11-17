# 01 – Schéma a príznak v admin paneli

Spec: [../spec.md](../spec.md)

## Čo

- `PartGroupScrapCodes.isOtherComponent Boolean @default(false)` v `schema.prisma` + generovanie klienta. `db push` robí používateľ.
- Admin `partgroups`: checkbox „Is other component?“ pri každom slote scrap code, správa sa ako radio.
- Formulár posiela kódy spolu s príznakom. Zod vstupu a `getScrapCodeRecords` príznak preberú pri vytvorení aj úprave.
- Server odmietne (400) viac ako jeden príznak a rebuild part group bez príznaku.
- Pri editácii sa príznak načíta do formulára.

## Akceptačné kritériá

- [x] Príznak sa uloží pri vytvorení aj úprave part group a úprava ho nevymaže.
- [x] Zaškrtnúť ide najviac jeden kód (UI aj server).
- [x] Rebuild part group bez príznaku sa neuloží, hláška je zrozumiteľná.
- [x] Nerebuild part group sa uloží aj bez príznaku.
- [x] Testy admin akcií s mockovaným Prisma klientom, `npm run check` a `npm run test` prechádzajú.

## Comments
