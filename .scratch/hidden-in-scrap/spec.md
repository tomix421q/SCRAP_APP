# Hidden in scrap – skrytie part group v scrap móde

Status: done

## Problém

V scrap móde skenovacej stránky operator vidí všetky part groups labelu. Niektoré part groups (napr. komponenty, ktoré sa riešia len rebuildom) sa pri scrape zadávať nemajú, ale inžinier dnes nemá ako ich zo scrap módu odstrániť. Operator ich preto vidí a môže pri nich zvoliť dôvod.

Admin formulár part group má navyše voľby pre rebuild („Rebuild group“, „Cannot be main reason“) voľne medzi ostatnými poľami a nie je jasné, ku ktorému módu patria.

## Riešenie

- Inžinier v admin paneli part groups zaškrtne pri part group **Hide in scrap mode** (pojem **Hidden in scrap** v [GLOSSARY.md](../../GLOSSARY.md)).
- Predvolene je checkbox nezaškrtnutý, takže každá part group, aj existujúca, ostáva v scrap móde viditeľná.
- Skrytá part group sa v scrap móde:
  - nezobrazí vo formulári,
  - neponúka ani ako príčina other component.
- Rebuild a quantity scrap sa nemenia.
- Ak label nemá ani jednu viditeľnú part group, scrap mód zobrazí prázdny formulár s krátkou hláškou, že žiadna part group nie je v scrap móde zapnutá.
- Server odmietne scrap payload, ktorý obsahuje skrytú part group (ako riadok aj ako príčinu).
- V admin formulári sa voľby rozdelia do dvoch ohraničených boxov:
  - **Re-build mode options:** „Rebuild group“, „Cannot be main reason“,
  - **Scrap mode options:** „Hide in scrap mode“.
- Medzi boxmi nie je žiadna závislosť: part group môže byť rebuild aj skrytá v scrap móde, alebo ani jedno.

## User stories

1. Ako engineer chcem pri part group zaškrtnúť „Hide in scrap mode“, aby ju operator pri scrape nevidel.
2. Ako engineer chcem, aby nové aj existujúce part groups boli predvolene v scrap móde viditeľné, aby po nasadení nič nezmizlo z výroby.
3. Ako engineer chcem voľby pre rebuild a pre scrap v samostatných ohraničených boxoch, aby som videl, ku ktorému módu patria.
4. Ako engineer chcem, aby sa nastavenie pri úprave part group načítalo a neprepísalo.
5. Ako engineer chcem v tabuľke part groups vidieť stĺpec „Hidden in scrap“, aby som stav videl bez otvárania editu.
6. Ako operator nechcem v scrap móde vidieť part groups, ktoré sa scrapovať nemajú.
7. Ako operator chcem pri labeli bez viditeľných part groups vidieť jasnú hlášku namiesto prázdneho formulára bez vysvetlenia.
8. Ako vedúci chcem, aby server neuložil scrap record skrytej part group ani zo starého tabu, aby dáta zodpovedali nastaveniu.

## Implementačné rozhodnutia

- **Schéma `PartGroup`:** nové pole `hiddenInScrap Boolean @default(false)`. Claude iba upraví schému a spustí `prisma generate`. `db push` robí výhradne používateľ po zálohe.
- **Admin `partgroups`:**
  - nový `$state` `hiddenInScrap`, reset po uložení, načítanie pri edite, odoslanie vo `FormData`,
  - zod schéma vstupu part group sa rozšíri o `hiddenInScrap` (rovnaký `preprocess` ako `isRebuild`),
  - create aj update akcia zapíše `hiddenInScrap`,
  - dva `<fieldset>` s `<legend>`: `rounded-md border border-border`, legenda `text-muted-foreground`, na desktope vedľa seba, na mobile pod sebou, iba sémantické tokeny,
  - [NewGroupTable.svelte](../../Scrapify/src/lib/components/organism/Tables/NewGroupTable.svelte) dostane stĺpec „Hidden in scrap“.
- **Klient `scandmclabel`:**
  - `ScrapManager` v scrap móde pracuje iba s part groups bez `hiddenInScrap` (riadky formulára, kandidáti na príčinu, `canSubmit`). Filter je `$derived`, nie manuálna synchronizácia v `$effect`.
  - Rebuild ostáva so všetkými part groups.
  - Pri 0 viditeľných part groups zobrazí `Scrap.svelte` hlášku a uloženie nie je možné.
- **Server `saveScrap`:** pri `isRebuild = false` načíta `hiddenInScrap` part groups z payloadu (riadky aj `otherComponentCauseGroupId`) a pri skrytej part group vráti 400 s hláškou.
- **Bez zmeny existujúcich scrap recordov:** skrytie part group sa netýka už uložených záznamov.

## Testovacie rozhodnutia

- Testy overujú vonkajšie správanie s mockovaným Prisma klientom (vzor `tests/scrap-payload-id.test.ts`).
- **Seam 1 – akcia `saveScrap`:** 400 pre skrytú part group ako riadok aj ako príčinu, rebuild so skrytou part group prejde.
- **Seam 2 – admin akcie `partgroups`:** uloženie `hiddenInScrap` pri create aj update, default `false`.
- **Seam 3 – `ScrapManager`:** v scrap móde chýbajú skryté riadky aj kandidáti na príčinu, v rebuild móde sú všetky part groups.
- Žiadne testy nezapisujú do skutočnej DB (`.env` mieri na produkciu).
- Na konci musia prejsť `npm run check` a `npm run test`.

## Mimo rozsahu

- Skrytie part group v quantity scrap móde (keby sa v budúcnosti robilo, bude mať vlastný box s voľbami).
- Skrytie part group v rebuild móde.
- Zmeny v tabuľke `scrapRecords` alebo v histórii operatora.
