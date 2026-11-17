# Other component scrap code – kód pre iný komponent

Status: done

## Problém

Pri rebuilde operator zvolí dôvod (main reason) na jednej rebuild part group a ostatné rebuild part groups sa automaticky označia ako other component. Takéto scrap recordy sa dnes ukladajú s prázdnym `scrapCode` (`isOtherComponent = true`, `scrapCode = null`). Vedenie ich preto nevie priradiť ku kódom: v reportoch aj v QAD chýba dôvod, prečo sa pridružené diely (Middfield, Beltline, MA pocket…) scrapovali.

Checkbox „Iný komponent“ sa dnes navyše zobrazuje pri každej part group, aj keď pre ňu nemá zmysel.

## Riešenie

- Inžinier v admin paneli part groups označí pri part group najviac jeden scrap code ako **Other component scrap code** (príznak `isOtherComponent` na `PartGroupScrapCodes`).
- Význam príznaku: kód **nedostane part group, ktorá ho má**, ale **ostatné part groups, keď je ona ich príčinou**. Príklad: Main carrier má označený SA850. Ak je Main carrier príčinou, záznamy Middfield, Beltline a MA pocket dostanú SA850 a jeho popis.
- Každá rebuild part group musí mať Other component scrap code. Pri ostatných part groups je voliteľný.
- **Rebuild:** checkbox „Iný komponent“ sa zobrazí až po zvolení main reason, a to pri všetkých ostatných part groups. Rebuild part groups sa zaškrtnú automaticky, ostatné môže operator zaškrtnúť ručne. Ktorýkoľvek môže operator odškrtnúť (diel zachránil). Príčinou je part group s main reason.
- **Scrap:** kandidát na príčinu je part group s vybraným scrap code, ktorá má Other component scrap code. Pri 0 kandidátoch sa checkbox nezobrazí, pri 1 sa príčina určí automaticky, pri 2 a viac musí operator vybrať príčinu v comboboxe „Príčina“.
- Ak príčina prestane byť platná (dôvod zrušený alebo zmenený na iný variant), závislé riadky s other component sa odškrtnú.
- Scrap record s other component dostane `scrapCode` a `scrapCodeDescription` z Other component scrap code príčiny a zároveň `isOtherComponent = true`.
- Quantity scrap sa nemení.

## User stories

1. Ako engineer chcem pri scrap code v part group zaškrtnúť „Is other component?“, aby som určil, aký kód dostanú ostatné diely, keď je táto part group príčinou.
2. Ako engineer chcem, aby šiel zaškrtnúť najviac jeden kód na part group, aby bolo jednoznačné, ktorý kód sa zapíše.
3. Ako engineer chcem, aby rebuild part group nešla uložiť bez Other component scrap code, aby rebuild nikdy nevytvoril záznam bez kódu.
4. Ako engineer chcem, aby sa príznak pri úprave part group (napr. zmena názvu) nestratil.
5. Ako engineer chcem, aby Other component scrap code ostal viditeľný aj v bežnom výbere dôvodov, aby sa dal použiť aj priamo.
6. Ako operator pri rebuilde chcem, aby sa po zvolení main reason ostatné rebuild part groups automaticky zaškrtli ako iný komponent, aby som nemusel klikať.
7. Ako operator pri rebuilde chcem automaticky zaškrtnutú part group odškrtnúť, ak som diel zachránil.
8. Ako operator pri rebuilde chcem ručne zaškrtnúť aj nerebuild part group ako iný komponent, ak ju poškodila tá istá príčina.
9. Ako operator nechcem vidieť checkbox „Iný komponent“, kým nie je zvolená príčina, aby som neoznačil niečo bez dôvodu.
10. Ako operator pri rebuilde chcem jasnú hlášku „Part group X nemá nastavený kód pre iný komponent, kontaktuj inžiniera“, ak part group s main reason nemá Other component scrap code.
11. Ako operator pri scrape chcem, aby sa pri jedinom kandidátovi príčina doplnila sama.
12. Ako operator pri scrape chcem pri viacerých kandidátoch vybrať príčinu, aby mal záznam správny kód.
13. Ako operator chcem, aby sa závislé riadky odškrtli, keď zruším alebo zmením dôvod príčiny, aby sa neuložil kód nesprávnej príčiny.
14. Ako vedúci chcem, aby každý scrap record s other component mal vyplnený scrap code a popis, aby som ho vedel priradiť a vyhodnotiť.
15. Ako vedúci chcem, aby `isOtherComponent` na scrap recorde ostal, aby fungovali existujúce filtre a história.
16. Ako vývojár chcem, aby kód other component určoval server z DB, nie klient, aby sa nedal podvrhnúť.

## Implementačné rozhodnutia

- **Schéma `PartGroupScrapCodes`:** nové pole `isOtherComponent Boolean @default(false)`. Claude iba upraví schému a spustí generovanie klienta. `db push` robí výhradne používateľ po zálohe.
- **Admin `partgroups`:**
  - Formulár posiela scrap codes spolu s príznakom (dnes iba zoznam kódov). Dôvod: pri úprave sa scrap codes v DB zmažú a vytvoria nanovo (`deleteMany` + `create`), takže bez príznaku vo formulári by ho každé uloženie vymazalo.
  - Checkbox pri každom slote scrap code sa správa ako radio (zaškrtnutie jedného odškrtne ostatné). Server odmietne viac ako jeden zaškrtnutý kód a rebuild part group bez zaškrtnutého kódu (400 s hláškou).
  - Zod schéma vstupu part group sa rozšíri o príznak.
- **Klient `scandmclabel` (`ScrapManager`):**
  - Riadok `ScrapRowState` dostane `otherComponentCauseGroupId: number | null` (ID part group, ktorá je príčinou).
  - Odvodené stavy (`$derived`) určia kandidátov na príčinu a viditeľnosť checkboxu pre každý riadok. Nie manuálna synchronizácia v `$effect`.
  - Rebuild: `syncRebuildBigComponents` nastaví príčinu na part group s main reason a zaškrtne len rebuild part groups. Ak part group s main reason nemá Other component scrap code, `canSubmit` je false a zobrazí sa hláška.
  - Scrap: pri 1 kandidátovi sa príčina nastaví automaticky, pri viacerých sa zobrazí existujúci `$lib/components/atoms/Combobox.svelte`. Bez príčiny sa nedá uložiť.
  - Pri strate platnosti príčiny sa závislé riadky odškrtnú (`isOtherComponent = false`, príčina `null`).
  - Pravidlo `isMissingOtherComponentScrap` nahradí pravidlo „riadok s other component musí mať platnú príčinu“.
- **Server `saveScrap`:**
  - Zod `scrapRowSchema` dostane `otherComponentCauseGroupId` (voliteľné, kladné celé číslo). `superRefine` pre scrap režim sa nahradí kontrolou príčiny.
  - Pre riadok s `isOtherComponent` server overí, že príčina je iná part group z toho istého payloadu, má vybraný scrap code a v DB má Other component scrap code. Inak vráti 400.
  - `scrapCode` a `scrapCodeDescription` takého záznamu sa berú z Other component scrap code príčiny načítaného z DB. Hodnoty z klienta sa pre tieto riadky ignorujú.
- **Bez backfillu:** staré scrap recordy s `isOtherComponent = true` a prázdnym `scrapCode` ostávajú bez zmeny.

## Testovacie rozhodnutia

- Testy overujú vonkajšie správanie: čo server akcia zapíše do mockovanej DB a čo vráti.
- **Seam 1 – akcie `scandmclabel` s mockovaným Prisma klientom** (vzor `tests/scrap-payload-id.test.ts`):
  - rebuild: pridružené riadky dostanú kód a popis z Other component scrap code part group s main reason,
  - scrap: riadok dostane kód zvolenej príčiny,
  - kód a popis poslané klientom sa pre other component ignorujú,
  - 400, ak príčina chýba, nie je v payloade, nemá vybraný dôvod alebo nemá Other component scrap code.
- **Seam 2 – admin akcie `partgroups`**: uloženie príznaku, odmietnutie dvoch príznakov, odmietnutie rebuild part group bez príznaku, zachovanie príznaku pri úprave.
- **Seam 3 – `ScrapManager`** (čistá trieda, bez DOM): kandidáti na príčinu, automatická príčina pri jednom kandidátovi, odškrtnutie závislých riadkov po zmene príčiny, `canSubmit`.
- Žiadne testy nezapisujú do skutočnej DB (`.env` mieri na produkciu).
- Na konci musia prejsť `npm run check` a `npm run test`.

## Mimo rozsahu

- Viac Other component scrap codes na part group (mapovanie podľa dôvodu alebo podľa pridruženej part group).
- Quantity scrap.
- Backfill starých scrap recordov.
- Zobrazenie príčiny v tabuľke `scrapRecords` alebo v histórii operatora (príčinu sa dá dohľadať cez payload ID).

## Ďalšie poznámky

- Pojmy **Other component scrap code** a **Main reason** sú v `GLOSSARY.md`.
- Poradie nasadenia: najprv používateľ spraví zálohu a `db push`, potom sa nasadí kód. Po nasadení musí inžinier doplniť Other component scrap code pre existujúce rebuild part groups, inak scan rebuild s nimi zablokuje.

## Tikety

1. [01 – Schéma a príznak v admin paneli](issues/01-schema-admin-flag.md)
2. [02 – Rebuild: kód príčiny pre pridružené part groups](issues/02-rebuild-cause-code.md)
3. [03 – Scrap: výber príčiny](issues/03-scrap-cause-select.md)

## Comments
