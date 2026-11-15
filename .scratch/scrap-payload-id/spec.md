# Scrap records: payloadRecId – spoločné ID jedného odoslania

Status: done

## Problém

Operator pri jednom uložení na stránke `scandmclabel` často vytvorí viac scrap recordov naraz, napr. 5 part groups pre jeden label. Platí to pre scrap, rebuild aj quantity scrap. V databáze sa dnes nedá spoľahlivo zistiť, ktoré scrap recordy vznikli jedným odoslaním. Odhaduje sa to iba heuristicky podľa rovnakého DMC a času `createdAt`, čo zlyhá napr. vtedy, keď operator rovnaký label uloží dvakrát krátko po sebe. Vedenie chce mať jeden hlavný identifikátor odoslania, podľa ktorého sa dajú záznamy zoskupiť a dohľadať.

## Riešenie

- Každé odoslanie formulára na stránke `scandmclabel` (scrap, rebuild, quantity scrap) dostane jedno **payload ID** (`payloadRecId`). Zdieľajú ho všetky scrap recordy, ktoré týmto odoslaním vznikli.
- Ak sa operator vráti k tomu istému labelu a uloží ho znova (napr. zabudol zadať chybu), ide o nové odoslanie s novým `payloadRecId`.
- `payloadRecId` vytvára výhradne server, operator nič nezadáva a vo formulári sa nič nemení.
- Excel export na stránke `scrapRecords` má nový posledný stĺpec **Payload ID**. Tabuľka `scrapRecords` sa vizuálne nemení.
- Staré scrap recordy (uložené pred nasadením) majú `payloadRecId` prázdne.

## User stories

1. Ako operator chcem, aby všetky scrap recordy, ktoré uložím jedným potvrdením, mali rovnaké payload ID, aby sa dali neskôr dohľadať ako jeden celok.
2. Ako operator chcem, aby uloženie fungovalo presne ako doteraz, bez nového poľa vo formulári, aby som nemusel nič meniť v postupe práce.
3. Ako operator chcem, aby pri opätovnom naskenovaní a uložení toho istého labelu vzniklo nové payload ID, aby bolo zrejmé, že išlo o dodatočné doplnenie.
4. Ako operator pri rebuilde chcem, aby všetky záznamy rebuildu (vrátane záznamov iba s príznakom other component) mali to isté payload ID.
5. Ako operator pri quantity scrape chcem, aby všetky part groups s množstvom z jedného uloženia mali to isté payload ID.
6. Ako operator chcem, aby sa pri neúspešnom uložení (validácia, neplatná part group, neoverená karta) nevytvorilo nič, ani payload ID, aby v DB neostali neúplné odoslania.
7. Ako operator chcem, aby dve súčasné uloženia z rôznych tabletov nikdy nedostali rovnaké payload ID.
8. Ako engineer chcem v Excel exporte stĺpec Payload ID, aby som vedel v Exceli zoskupiť záznamy podľa odoslania.
9. Ako engineer chcem, aby nový stĺpec bol v exporte až na konci, aby sa neposunuli existujúce stĺpce, na ktoré môžu nadväzovať moje makrá a kontingenčné tabuľky.
10. Ako engineer chcem, aby staré záznamy mali v exporte prázdnu bunku Payload ID, aby bolo jasné, že vznikli pred zavedením.
11. Ako engineer chcem, aby tabuľka `scrapRecords` ostala bez zmeny, aby sa nerozbilo jej rozloženie na šírku obrazovky.
12. Ako správca DB chcem, aby zavedenie nevyžadovalo ručné zásahy v DB (sequence, triggery, nové tabuľky), aby stačilo iba `prisma db push` po zálohe.
13. Ako správca DB chcem, aby sa podľa payload ID dalo efektívne vyhľadávať (index), aby dopyty na zoskupenie neboli pomalé.
14. Ako vývojár chcem, aby payload ID nebolo možné podvrhnúť z klienta, aby sa záznamy z rôznych odoslaní nedali umelo spojiť.
15. Ako vedúci chcem, aby payload ID bolo k dispozícii pre budúce reporty a QAD spracovanie bez ďalších zmien schémy.

## Implementačné rozhodnutia

- **Typ identifikátora:** UUID (GUID). Generuje ho server pomocou kryptografického generátora raz pre jedno odoslanie, tesne pred hromadným zápisom (`createMany`) a až po všetkých validáciách.
  - Zamietnuté alternatívy: `MAX + 1` (race condition pri súčasných uloženiach), SQL Server `SEQUENCE` (ručný zásah do DB mimo Prismy), nová tabuľka payloadov (zbytočná réžia), ID prvého vloženého záznamu (krkolomná logika s dodatočným update).
  - Nevýhoda (nečitateľnosť pre človeka) nevadí, ID slúži na strojové zoskupenie.
- **Schéma `ScrapRecord`:** pole `payloadRecId` sa mení z voliteľného `Int` na voliteľný reťazec s natívnym typom SQL Servera `UniqueIdentifier`. Pribudne index na `payloadRecId`. Názov poľa ostáva `payloadRecId`. Stĺpec je v DB zatiaľ prázdny, takže zmena typu je bezpečná. Claude iba upraví schému a spustí generovanie klienta. `db push` robí výhradne používateľ po zálohe.
- **Server akcie `saveScrap` a `saveQuantityScrap`:** obe pridajú to isté `payloadRecId` do každého zapisovaného scrap recordu. Ostatné správanie (validácie, odpovede, chybové stavy) sa nemení.
- **Kontrakt s klientom:** zod schémy vstupu sa nemenia. `payloadRecId` sa z formulára nečíta (prípadná poslaná hodnota sa ignoruje) a v odpovedi sa klientovi nevracia.
- **Excel export `scrapRecords`:** do definície exportných stĺpcov sa pridá na koniec stĺpec **Payload ID**. Pri prázdnej hodnote ostane bunka prázdna. Definícia stĺpcov tabuľky sa nemení.
- **Bez backfillu:** staré scrap recordy ostávajú s prázdnym `payloadRecId`.

## Testovacie rozhodnutia

- Dobrý test overuje iba vonkajšie správanie: čo server akcia zapíše do (mockovanej) DB a čo vráti, nie ako to interne počíta. Netestuje sa formát UUID ani konkrétna knižnica, iba to, že hodnota je vyplnená, zdieľaná v rámci odoslania a rozdielna medzi odoslaniami.
- **Seam 1 – server akcie `scandmclabel` s mockovaným Prisma klientom** (existujúci seam):
  - `saveScrap` (scrap aj rebuild) a `saveQuantityScrap`: všetky riadky jedného `createMany` majú rovnaké, neprázdne `payloadRecId`,
  - dve po sebe idúce uloženia toho istého labelu majú rôzne `payloadRecId`,
  - hodnota `payloadRecId` poslaná vo formulári sa ignoruje,
  - pri validačnej chybe sa `createMany` nezavolá.
  - Vzor: existujúci test histórie operatora, ktorý volá akcie tej istej stránky nad mockovaným Prisma klientom.
- **Seam 2 – Excel export `scrapRecords`** (existujúci seam): rozšíriť existujúci test exportu o posledný stĺpec Payload ID a prázdnu bunku pre starý záznam.
- Žiadne testy nezapisujú do skutočnej DB (`.env` mieri na produkciu).
- Na konci musia prejsť `bun run check` a `bun run test`.

## Mimo rozsahu

- Zoskupovanie histórie operatora podľa `payloadRecId` (dnes heuristika podľa DMC a času). Pôjde ako samostatný tiket.
- Stĺpec alebo filter Payload ID v tabuľke `scrapRecords`.
- Zakomentovaný starý endpoint exportu scrapu.
- Backfill starých scrap recordov.
- Zobrazenie payload ID operatorovi.

## Ďalšie poznámky

- Do `GLOSSARY.md` sa oplatí doplniť pojem **Payload** (jedno odoslanie formulára na `scandmclabel`, ktoré vytvorí jeden alebo viac scrap recordov) a zapísať rozhodnutie UUID verzus Int ako ADR (`domain-modeling`).
- Poradie nasadenia: najprv používateľ spraví zálohu a `db push` novej schémy, potom sa nasadí kód. Inak zápis zlyhá na nesúlade typu stĺpca.

## Tikety

1. [01 – Schéma a zápis payloadRecId](issues/01-schema-and-save.md)
2. [02 – Payload ID v exporte](issues/02-export-column.md)

## Comments

- Po implementácii pridané nad rámec pôvodného rozsahu (na žiadosť používateľa): filter **Payload ID** na `scrapRecords` (iba celé UUID, inak 400), tooltip s payload ID na stĺpci ID a klik na ID zobrazí celé uloženie (ostatné filtre sa zrušia).
- Opravená existujúca chyba: prázdny `scrapPayload` v `saveScrap` vracal 500 namiesto 400.
