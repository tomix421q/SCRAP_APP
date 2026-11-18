# 01 – Filtre, load a číselné dlaždice

Status: done
Rodič: [spec.md](../spec.md)
Blokované: —

## Čo postaviť

- **Upratanie:**
  - z root `+layout.server.ts` odstrániť výpočet `stats`,
  - zmazať `LandingStatistic.svelte`,
  - z úvodnej strany odstrániť `OperatorLogin`,
  - zmazať rutu `/report` a jej odkaz v `navConst.ts`.
- **Filtre (čisté funkcie, zdieľané so všetkými dlaždicami):**
  - `range`: `1d` | `7d` | `30d` | `custom`, východzie `7d`,
  - pri `custom` parametre `from` a `to`, najviac 1 rok, `from` ≤ `to`,
  - `project`: voliteľný názov projektu,
  - neplatná hodnota → chyba 400,
  - výpočet aktuálneho a predošlého rovnako dlhého obdobia.
- **Load v `(Client)/+page.server.ts`:** agregácie cez Prisma, výsledky 60 s v serverovej cache podľa kľúča z filtrov.
- **Horný riadok:** slogan v jednom riadku, prepínač projektu (tlačidlá, nad 8 projektov existujúci `Combobox`), prepínač obdobia. Zmena filtra mení URL.
- **Dlaždice:**
  - Total parts: kusy, scrap / rebuild, počet scrap recordov, zmena v % oproti predošlému obdobiu,
  - Master data: počty Projects / Part groups / Part numbers / Labels,
  - All-time: kusy, počet scrap recordov, dátum prvého záznamu.
- Bento mriežka s miestom pre zvyšné dlaždice, na úzkej obrazovke jeden stĺpec.

## Akceptačné kritériá

- [x] Root layout už neráta žiadne štatistiky; iné stránky sa načítajú bez agregácií nad `ScrapRecord`.
- [x] `/report` neexistuje a v navigácii naň nie je odkaz.
- [x] Filtre sú v URL, obnovenie stránky ich zachová, neplatná hodnota vráti 400.
- [x] Total parts reaguje na project aj obdobie; Master data a All-time nie.
- [x] Zmena oproti predošlému obdobiu sa nezobrazí, ak predošlé obdobie nemá dáta.
- [x] Scrap = `isRebuild = false` (vrátane quantity scrapu), rebuild = `isRebuild = true`.
- [x] Unit testy pre parsovanie filtrov a výpočet období; load testovaný s mockovaným Prisma klientom.
- [x] Iba sémantické tokeny a `cardNormalize`, žiadne priame farby.
- [x] `bun run check` a `bun run test` prechádzajú.

## Comments

**2026-11-16 – uzavreté.** Rozhodnutia počas implementácie:

- **Master data:**
  - Labels = počet unikátnych naskenovaných DMC kódov v `ScrapRecord.dmc` bez quantity scrap labelov (`QNT-SCRAP-…`), nie počet `LabelGroup`.
  - Projects = projekty, ktoré majú aspoň jednu part group (nie všetky projekty z `vParts`).
  - Part numbers = počet `PartGroupMaterial`.
- **Slogan:** úplne odstránený (ani na dashboarde, ani v hlavičke).
- **Filtre:**
  - Kompaktný box nad dlaždicami, na strede.
  - Segmentové prepínače PROJECT / PERIOD oddelené zvislou čiarou.
  - Prepínače používajú `role="group"`, nie `<nav>`, aby sa nemýlili s navigáciou v hlavičke.
- **Custom:** URL sa zmení až po Apply. Zvýraznené ostáva obdobie, ktoré dlaždice práve ukazujú.
- **Časové hranice:** obdobia sa posúvajú cez `getLocalDateTimeForDb`, lebo DB ukladá lokálny čas (`GETDATE()`), ktorý Prisma číta ako UTC.
- **Zoznam projektov pre prepínač:** jeden relačný dotaz (`scrapRecords: { some }`), nie `id IN (...)`, kvôli limitu SQL Servera 2100 parametrov.
- **Rozloženie:** bento mriežka je zatiaľ jednoduchá (1 / 2 / 4 stĺpce). Rozloženie pre Trend (2 stĺpce) a Projects (2 riadky) sa doladí v tiketoch 02 a 03.
