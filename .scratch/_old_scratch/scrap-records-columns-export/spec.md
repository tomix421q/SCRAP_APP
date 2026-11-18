# Scrap records: stĺpce Other component / Other variant / Replacement part, čitateľnosť tabuľky a export do Excelu

Status: done (01–04, 06, 07 hotové; 05 zrušené)

## Problém

Na stránke `scrapRecords` nevidí engineer ani moderátor v tabuľke, či bol záznam označený ako iný komponent (`isOtherComponent`), či operátor zvolil iný variant, ani aký náhradný diel (`replacementPartMaterial`) vybral. Tieto údaje sa pri skenovaní (`scandmclabel`) ukladajú, ale v prehľade záznamov ich nevidno. Pre iný variant sa nedá filtrovať a dáta sa nedajú vytiahnuť do Excelu na ďalšie spracovanie. Pôvodný endpoint na export scrapu je celý zakomentovaný a patrí k starej schéme.

S pridanými údajmi má záznam 13 dátových polí. Už teraz je široká (vodorovný scroll, veľká hlavička, všetko ako obyčajný text). Pri scrollovaní sa používateľ stráca: nevidí hlavičku ani DMC, ku ktorému hodnota patrí, a výnimky (rebuild, iný komponent, iný variant) zaniknú medzi bežnými záznamami. Stránka má navyše vlastný vizuálny štýl s priamymi farbami (`white/*`), ktorý sa líši od ostatných stránok a porušuje pravidlá projektu.

## Riešenie

- **Nové stĺpce:** **Other component**, **Other variant** a **Replacement part** (part number náhradného dielu). Schéma Prisma sa nemení. „Other variant“ sa odvodzuje z toho, či je vyplnené `replacementPartMaterial`.
- **Nové filtre:** **Other variant** (All/Yes/No) a textové vyhľadávanie **Replacement part**.
- **Čitateľnosť tabuľky:**
  - príbuzné údaje sú v dvojriadkových bunkách (Part group/Project, Scrap code/Description), príznaky Other component a Other variant sú štítky v jednom stĺpci, takže tabuľka má 10 stĺpcov namiesto 13,
  - stĺpce sú usporiadané do logických skupín s jemnými oddeľovačmi,
  - tabuľka využije šírku okna (najviac 1920 px) a výšku okna,
  - tlačidlá kategórií ukazujú počet záznamov (a kusy, ak sa líšia),
  - Created by ukazuje v tooltipe meno operátora,
  - hlavička a stĺpce ID a DMC ostávajú pri scrollovaní viditeľné,
  - riadky sú kompaktnejšie,
  - pozitívne príznaky sa zobrazujú ako štítky, takže oko zachytí len výnimky,
  - nad tabuľkou vidí štítky aktívnych filtrov,
  - počas načítavania sa tabuľka stlmí.
- **Vizuálny štýl:** stránka sa zjednotí so zvyškom aplikácie (`formNormalize`, `listNormalize`, hlavička tabuľky ako v admin tabuľkách, iba sémantické tokeny).
- **Export:** tlačidlo **Export (N)** stiahne `.xlsx` so **všetkými** záznamami podľa aktuálnych filtrov a kategórie, so všetkými stĺpcami. Export používa nový univerzálny xlsx helper, ktorý sa neskôr použije aj inde (napr. v adminovi).

## User stories

### Nové stĺpce a filtre

1. Ako engineer chcem v tabuľke vidieť, či je záznam Other component, aby som spoznal záznamy, kde chybný bol iný komponent ako samotný diel.
2. Ako engineer chcem vidieť, či je záznam Other variant, aby som vedel, kde operátor zvolil iný variant dielu.
3. Ako engineer chcem vidieť stĺpec Replacement part s part number, aby som vedel, ktorý materiál sa reálne scrapoval.
4. Ako engineer chcem pri zázname bez náhradného dielu vidieť „—“, aby bolo jasné, že hodnota chýba, a nie že sa nenačítala.
5. Ako engineer chcem, aby sa Other variant zobrazoval správne aj pri starších záznamoch.
6. Ako moderátor chcem filtrovať podľa Other variant (All/Yes/No), aby som rýchlo našiel všetky prípady iného variantu.
7. Ako moderátor chcem vyhľadávať podľa časti part number náhradného dielu, aby som našiel všetky scrapy konkrétneho materiálu.
8. Ako moderátor chcem kombinovať nové filtre s existujúcimi (projekt, part group, scrap code, dátum, Other component, QAD export).
9. Ako moderátor chcem, aby sa nové filtre ukladali do URL, aby som mohol vyfiltrovaný pohľad poslať kolegovi alebo obnoviť stránku bez straty filtrov.
10. Ako moderátor chcem, aby tlačidlo Clear vymazalo aj nové filtre.
11. Ako moderátor chcem, aby nové filtre ovplyvnili aj súčty kategórií a Total records/quantity, aby čísla zodpovedali tabuľke.
12. Ako používateľ chcem pri neplatnej hodnote filtra Other variant v URL dostať jasnú chybu 400.

### Čitateľnosť a orientácia v tabuľke

13. Ako engineer chcem mať stĺpce zoradené v logických skupinách (identifikácia, typ, diel, dôvod, variant/komponent, množstvo, audit), aby som vedel, kde čo hľadať.
14. Ako engineer chcem, aby boli skupiny stĺpcov jemne vizuálne oddelené, aby sa mi stĺpce nezlievali.
14a. Ako engineer chcem príbuzné údaje (Part group a Project, Scrap code a Description) v jednej dvojriadkovej bunke, aby bola tabuľka užšia a menej sa scrollovalo do strany.
14b. Ako engineer chcem pri Created by vidieť v tooltipe meno operátora, nielen číslo karty.
14c. Ako moderátor chcem pri tlačidlách kategórií vidieť počet záznamov a súčet kusov, aby som nepotreboval samostatný riadok so súčtami.
15. Ako engineer chcem vidieť Type hneď za DMC, lebo je to prvé, čo pri zázname potrebujem vedieť.
16. Ako engineer chcem, aby hlavička ostala viditeľná pri scrollovaní nadol, aby som vždy vedel, čo stĺpec znamená.
17. Ako engineer chcem, aby ID a DMC ostali viditeľné pri vodorovnom scrollovaní, aby som vedel, ku ktorému labelu hodnota patrí.
18. Ako engineer chcem, aby mala tabuľka vlastný scroll s výškou okna, aby boli hlavička aj stránkovanie vždy na dosah a tabuľka po doscrollovaní vyplnila obrazovku.
19. Ako engineer chcem kompaktnejšie riadky a menšiu hlavičku, aby som naraz videl viac záznamov.
20. Ako engineer chcem čísla (ID, Quantity) zarovnané doprava s rovnakou šírkou číslic, aby sa dali ľahko porovnávať.
21. Ako engineer chcem vidieť Created at ako dátum a pod ním menším písmom čas, aby bol stĺpec užší a prehľadný.
22. Ako engineer chcem, aby sa Type zobrazoval ako farebný štítok (Scrap jemne červený, Rebuild oranžový, Quantity scrap odlišný), aby som typy rozlíšil na prvý pohľad.
23. Ako engineer chcem, aby sa Other variant zobrazoval ako štítok a „No“ sa nevypisovalo, aby som videl iba výnimky.
24. Ako engineer chcem, aby bol štítok Other component nenápadný, aby nepôsobil ako chyba a nerušil.
25.–28. *(Zrušené: skrývanie stĺpcov, viď Mimo rozsahu.)*
29. Ako moderátor chcem nad tabuľkou vidieť štítky aktívnych filtrov a kategórie, aby som vždy vedel, čo práve vidím.
30. Ako moderátor chcem zrušiť jednotlivý filter jedným klikom na jeho štítok, bez otvárania formulára.
31. Ako používateľ chcem, aby sa tabuľka počas načítavania nových dát stlmila, aby bolo jasné, že sa obsah mení.
32. Ako používateľ chcem, aby stránka scrap records vyzerala rovnako ako ostatné stránky aplikácie.
33. Ako používateľ na úzkom displeji chcem tabuľku scrollovať vodorovne, pričom ID a DMC ostanú viditeľné.

### Export do Excelu

34. Ako engineer chcem tlačidlom Export stiahnuť všetky vyfiltrované záznamy (všetky strany, nie len 100).
35. Ako engineer chcem, aby export rešpektoval vybranú kategóriu (All/Rebuild/Scrap/Quantity scrap).
36. Ako engineer chcem na tlačidle vidieť, koľko záznamov sa exportuje (`Export (N)`).
37. Ako engineer chcem, aby bolo tlačidlo pri 0 záznamoch neaktívne.
38. Ako engineer chcem počas exportu vidieť spinner a nemôcť export spustiť dvakrát.
39. Ako engineer chcem pri chybe exportu (prekročený strop, výpadok DB) dostať toast so zrozumiteľnou hláškou namiesto poškodeného súboru alebo chybovej stránky.
40. Ako engineer chcem, aby mal export rovnaké stĺpce v rovnakom poradí ako tabuľka, pričom Other component, Other variant a Replacement part sú samostatné stĺpce s hodnotami Yes/No a part number.
41. Ako engineer chcem, aby bol Created at v exporte v rovnakom lokálnom čase ako v tabuľke.
42. Ako engineer chcem, aby bolo Quantity v exporte číslo, aby som ho mohol v Exceli sčítať.
43. Ako engineer chcem, aby mal súbor názov s dátumom exportu.
44. Ako engineer chcem pri filtri bez výsledkov dostať platný súbor len s hlavičkou (ak sa export spustí napr. cez URL).
45. Ako admin chcem, aby sa každý export zapísal do ActivityLogs (`EXPORT`, `ScrapRecord`).
46. Ako vývojár chcem univerzálny xlsx helper nezávislý od scrap records, aby som ho mohol použiť na export aj v iných častiach aplikácie (napr. admin).
47. Ako vývojár chcem, aby bol typ definície stĺpca navrhnutý tak, aby ho v budúcnosti vedel použiť aj import.
48. Ako operátor nechcem, aby úpravy prehľadu akokoľvek zmenili zápis scrapu na `scandmclabel`.

## Rozhodnutia implementácie

### Dáta a filtre

- **Bez zmeny schémy.** `isOtherVariant` sa v `ScrapRecord` neukladá. Zobrazuje sa ako odvodená hodnota `replacementPartMaterial != null` (prázdny reťazec sa berie ako null). Platí to aj pre quantity scrap s vybraným náhradným dielom. Zápis na `scandmclabel` ostáva bez zmeny.
- **Spoločná logika filtrov.** Parsovanie query parametrov (dmc, scrapCode, partGroup, project, createdBy, dateFrom, dateTo, otherComponent, exported, category a nové otherVariant, replacementPart) a skladanie `Prisma.ScrapRecordWhereInput` (vrátane rozdelenia podľa kategórie cez `quantityScrapLabelPrefix`) sa vytiahne zo server load do jedného zdieľaného modulu, ktorý použije load aj export. Existujúce správanie ostáva rovnaké (chyby 400, exkluzívna horná hranica dátumu +60 s).
- **Nové query parametre:**
  - `otherVariant`: `true` → `replacementPartMaterial` nie je null, `false` → je null; iná hodnota → 400.
  - `replacementPart`: orezaný text → `replacementPartMaterial contains`.

### Definícia stĺpcov (jeden zdroj pravdy)

Definícia v `scrapRecords/columns.ts` má dve úrovne:

- **Dátové stĺpce** (13): každý má kľúč, popis a hodnotu pre export (typ definície stĺpca z univerzálneho helpera). Určujú poradie a hlavičky exportu a sú zdrojom popisov pre hlavičky tabuľky.
  - Poradie: `ID · DMC` | `Type` | `Part group · Project` | `Scrap code · Description` | `Other component · Other variant · Replacement part` | `Quantity` | `Created by · Created at`.
- **Stĺpce tabuľky** (10): každý má kľúč, zoznam dátových polí, ktoré zobrazuje (prvé je hlavný riadok, ďalšie menším písmom pod ním), skupinu a šírku.
  - Poradie: `ID` · `DMC` | `Type` | `Part group / Project` | `Scrap code / Description` | `Other component / Other variant` (štítky) · `Replacement part` | `Quantity` | `Created by` · `Created at` | `Actions` (len pri oprávnení na mazanie).
  - Hlavička je jednoúrovňová, pri dvojriadkových stĺpcoch má pod hlavným popisom menším písmom popis druhého poľa (napr. `PART GROUP` / `Project`).
  - Z nich sa berú oddeľovače skupín.
- Tabuľka si bunky vykresľuje sama (štítky, dvojriadkové bunky, „—“). Ak chýba scrap kód aj popis, bunka ukáže jednu „—“.
- Export nezávisí od stĺpcov tabuľky: vždy obsahuje všetkých 13 dátových stĺpcov ako samostatné stĺpce (bez Actions). Hodnoty: Type ako text (Scrap/Rebuild/Quantity scrap), Other component a Other variant ako Yes/No, Replacement part ako part number alebo prázdna bunka, Quantity ako číslo, Created at v lokálnom čase (rovnaký formát ako `dateTimeLocalTimeDb`).

### Tabuľka: čitateľnosť

- **Oddeľovače skupín:** prvý stĺpec každej skupiny má `border-l-2 border-border`. Hlavička je jednoúrovňová (bez riadku s názvami skupín).
- **Prilepená hlavička a stĺpce:** kontajner tabuľky je vysoký ako okno (`max-h-[calc(100dvh-5rem)]`) s vlastným vertikálnym aj horizontálnym scrollom (odsúhlasené: dva scrollbary sú cena za prilepenú hlavičku). Hlavička je `sticky top-0`, ID a DMC sú `sticky left-*` s nepriehľadným pozadím z tokenov, aby cez ne nepresvitali bunky. Stránkovanie je pod kontajnerom.
- **Šírka:** sekcia s tabuľkou sa vymaní z `max-w` layoutu, je široká ako okno, najviac 1920 px, a vycentrovaná. Tabuľka má `table-fixed`; Part group a Scrap code nemajú pevnú šírku a delia sa o voľné miesto, ostatné stĺpce majú presnú šírku (posun prilepeného DMC na nej závisí).
- **Kategórie:** kompaktná lišta (`w-fit`, malé tlačidlá) ukazuje pri každej kategórii počet záznamov a súčet kusov len vtedy, keď sa od počtu líši (prakticky iba Quantity scrap, napr. `16 · 64 pcs`). Zdroj: `categorySummaries`, All = súčet troch kategórií. Riadok Total records/quantity v pätičke formulára odpadol.
- **Operátor:** `createdBy` obsahuje číslo karty. Skenovanie prijme kartu z `Operator` aj z `User`, preto load pre záznamy na aktuálnej strane dohľadá mená v oboch (`Operator.cardId` → `fullName`, `User.cardId` → `name`; pri zhode karty vyhráva `Operator`). Bunka Created by ich ukáže v tooltipe.
- **Hustota:**
  - hlavička `text-xs`/`text-sm`, uppercase, `tracking-wide` (namiesto `text-lg`),
  - menší vertikálny padding buniek,
  - ID a Quantity zarovnané doprava s `tabular-nums`,
  - Created at ako dátum a pod ním čas v `text-xs text-muted-foreground`.
- **Štítky** (existujúci `ui/badge`, nový atóm nevzniká; `ui/badge` dostal varianty `chart-warning`, `chart-2` a `chart-destructive`):
  - Type: Scrap = `chart-destructive` (jemná červená), Rebuild = `chart-warning`, Quantity scrap = `chart-2`. Mapovanie je jedno (`scrapRecordTypeBadgeVariant` v `columns.ts`) a používa ho aj história operátora na `scandmclabel`.
  - Other component = nenápadný štítok „Other comp.“ (`outline` + `text-muted-foreground`), nie `destructive`.
  - Other variant = `primary`.
  - Oba príznaky sú v jednom stĺpci; „No“ sa nezobrazuje (bez štítku). Replacement part je obyčajný text alebo „—“.
  - Stĺpec QAD export v tabuľke nie je (ostáva len ako filter).
- **Kompaktný panel (tiket 07):** kategórie, filtre, štítky aktívnych filtrov a akcie sú v jednej karte. Filtre sú v štyroch pomenovaných stĺpcoch: Part (Project, Part group, Scrap code), Record (Label, Created by, Replacement part), Flags (Other component, Other variant, QAD export), Created date (Od, Do). Spodná lišta: štítky vľavo, Clear, Apply a Export vpravo dole.
- **Aktívne filtre:** nad tabuľkou je riadok štítkov odvodených z aktuálnej URL (napr. `Project: X ×`, `Other variant: Yes ×`, `Category: Rebuild`). Klik na × odstráni daný parameter z URL a resetuje `page`. Riadok sa nezobrazí, ak nie je aktívny žiadny filter.
- **Načítavanie:** počas `navigating` má kontajner tabuľky `opacity-60` a `pointer-events-none`, aby bolo vidno, že sa mení obsah.
- **Mobil:** iba vodorovný scroll s prilepenými ID a DMC. Bez kariet a bez osobitného rozloženia.

### Vizuálny štýl

- Formulár filtrov používa `formNormalize`, kontajner tabuľky `listNormalize`, hlavička tabuľky ako ostatné tabuľky v projekte (`bg-chart-4/40`, `text-chart-1`).
- Všetky priame farby (`white/*` a pod.) sa nahradia sémantickými tokenmi (`border-border`, `bg-card/*`, `bg-muted/*`, `text-muted-foreground`). Rozloženie filtrov (fieldsety, Combobox) ostáva rovnaké.
- Nové filtre Other variant a Replacement part sú v existujúcom fieldsete Record filters vedľa Other component, v rovnakom štýle. Yes/No filter zopakuje existujúci vzor `<select>` kvôli konzistencii; prechod na `Combobox` sa navrhne osobitne.

### Univerzálny xlsx helper

- Generický, typovo bezpečný helper v `$lib/utils`, iba na serveri, bez väzby na Prisma alebo scrap records. Používa knižnicu `xlsx` (už je v závislostiach).
- Rozhranie (odsúhlasené v diskusii):

  ```ts
  type XlsxColumn<T> = {
  	header: string;
  	value: (row: T) => string | number | boolean | Date | null;
  };
  buildXlsx<T>(rows: T[], columns: XlsxColumn<T>[], sheetName: string): Buffer;
  xlsxResponse(buffer: Buffer, fileName: string): Response; // content-type + Content-Disposition: attachment
  ```

- `null` → prázdna bunka, `number` → číselná bunka, `Date` → dátumová bunka.
- Typ stĺpca je navrhnutý tak, aby sa doň neskôr dalo doplniť mapovanie pre import (header ↔ kľúč). Samotný import nie je súčasťou tohto tiketu.

### Export endpoint a tlačidlo

- **Endpoint:** nová GET rúta vedľa stránky `scrapRecords`.
  - Prijíma rovnaké query parametre ako stránka (bez `page`) a použije zdieľanú logiku filtrov.
  - Načíta všetky vyhovujúce záznamy, zoradené `createdAt desc, id desc`.
  - Súbor vytvorí cez `buildXlsx` s definíciou stĺpcov scrap records a vráti ho cez `xlsxResponse` s názvom `scrap_records_<YYYY-MM-DD>.xlsx`.
- **Strop:** 50 000 riadkov. Pri prekročení vráti 400 s hláškou na zúženie filtra.
- **Logovanie:** po úspechu `writeToLogger` (`EXPORT`, `ScrapRecord`). Zlyhanie logovania export nezablokuje.
- **Chyba DB:** 500 s hláškou.
- **Prístup:** export môže spustiť každý, kto vidí stránku. Mazanie ostáva obmedzené na ADMIN/MODERATOR/ENGINEER.
- **Tlačidlo** `Export (N)` je v pätičke formulára filtrov (N = `totalRecords`).
  - Exportuje podľa **aktuálnej URL** (aplikované filtre), nie podľa neaplikovaných hodnôt vo formulári.
  - Sťahuje cez `fetch` → blob → download, so spinnerom a zablokované počas exportu, pri 0 záznamoch neaktívne.
  - Pri chybovej odpovedi zobrazí toast (sonner, ako `DeleteBtn`) s hláškou zo servera.
- Zakomentovaný `/api/export/scrap` a jeho volanie zo `SearchScrapTable` sa v tomto tikete nemenia.

## Testovacie rozhodnutia

- Dobrý test overuje iba vonkajšie správanie: čo dostane Prisma ako `where`/`orderBy` a čo vráti rúta alebo helper (dáta loadu, HTTP status, hlavičky, obsah `.xlsx`). Interná štruktúra modulov sa netestuje.
- **Hranica 1, server load `scrapRecords`** s mockovaným Prisma klientom:
  - `otherVariant=true/false` vytvorí správnu podmienku; neplatná hodnota → 400,
  - `replacementPart` → `contains`,
  - nové filtre sa premietnu do súčtov kategórií,
  - existujúce filtre sa správajú rovnako ako pred refaktoringom (regresia).
- **Hranica 2, GET export endpoint** s mockovaným Prisma klientom:
  - content-type, `Content-Disposition`, názov súboru,
  - `.xlsx` načítaný cez `xlsx`: hlavička v poradí definície stĺpcov, hodnoty (Yes/No, prázdna bunka, Type, Quantity ako číslo),
  - rovnaké `where` ako load, bez `skip/take`,
  - prázdny výsledok → len hlavička,
  - strop → 400, chyba DB → 500,
  - `activityLogs.create` s `EXPORT`.
- **Hranica 3, univerzálny xlsx helper** (nové verejné rozhranie pre ďalšie moduly): riadky a stĺpce → `buildXlsx` → spätne načítané cez `xlsx`. Overí sa hlavička, typy buniek (číslo, dátum, boolean, null → prázdna) a hlavičky odpovede z `xlsxResponse`.
- UI (štítky, sticky, skrývanie stĺpcov, štítky aktívnych filtrov) sa unit testami netestuje. Overí sa ručne v aplikácii a cez `bun run check`.
- Prior art: `Scrapify/tests/partgroup-photo.test.ts` (vitest, `vi.hoisted` Prisma mock, mock `@/auth/auth`). Testy nesmú zapisovať do DB, `.env` mieri na produkciu.
- Spúšťanie: `cd Scrapify && bun run test` a `cd Scrapify && bun run check`.

## Mimo rozsahu

- Skrývanie stĺpcov (pôvodný tiket 05). Zrušené po dizajnovej revízii: tabuľka má 10 stĺpcov s dvojriadkovými bunkami, všetky údaje sú potrebné a zmestia sa na šírku.
- Zmena schémy Prisma (nový stĺpec `isOtherVariant`) a backfill.
- Zmeny zápisu scrapu na `scandmclabel` a quantity scrap.
- Import z Excelu (helper je naň iba pripravený typom stĺpca) a export v admin sekcii.
- Oprava alebo odstránenie starého `/api/export/scrap` a exportu v `SearchScrapTable`.
- Prechod existujúcich `<select>` filtrov na `Combobox`.
- Kartové zobrazenie na mobile, dvojúrovňová hlavička, stĺpec QAD export v tabuľke.
- Ukladanie nastavenia stĺpcov na server (zdieľané medzi zariadeniami).
- CSV export, plánované exporty, formátovanie Excelu nad rámec hlavičky.
- Editácia záznamov zo stránky scrap records.

## Ďalšie poznámky

- Pri quantity scrap sa zobrazí Other variant = Yes vždy, keď je vybraný náhradný diel. Toto správanie je odsúhlasené.
- Hodnota `'empty'` sa používa iba v stave klienta (`ScrapManager`) a do DB sa nedostane. Prázdny reťazec sa pre istotu berie ako null.
- Postup implementácie je rozdelený na tikety v `issues/`:
  1. [01 – Zdieľané filtre, definícia stĺpcov, nové stĺpce a filtre](issues/01-shared-filters-new-columns.md) – **hotové**
  2. [02 – Univerzálny xlsx helper](issues/02-xlsx-helper.md) (dá sa robiť paralelne s 01) – **hotové**
  3. [03 – Export do Excelu](issues/03-export-endpoint-button.md) (po 01 a 02) – **hotové**
  4. [04 – Vizuálne zjednotenie a čitateľnosť](issues/04-visual-alignment-readability.md) (po 01) – **hotové**; navyše dizajnová revízia (dvojriadkové bunky, počty pri kategóriách, meno operátora v tooltipe, šírka/výška tabuľky)
  5. ~~[05 – Skrývanie stĺpcov](issues/05-column-visibility.md)~~ – **zrušené**
  6. [06 – Štítky aktívnych filtrov a načítavanie](issues/06-active-filter-chips-loading.md) (po 01 a 04) – **hotové** (spolu so 07)
  7. [07 – Kompaktný panel filtrov](issues/07-compact-filter-panel.md) (po 04, spolu s 06) – **hotové**
- Pojmy Other component, Other variant a Replacement part (a súvisiace pojmy domény) sú v koreňovom `GLOSSARY.md`.
