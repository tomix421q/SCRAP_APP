# Úvodná strana: dashboard so štatistikami scrap recordov

Status: návrh (čaká na schválenie)

Vizuálny náhľad: https://claude.ai/artifact/9Rdj3H3rteKKSrEjCK5oR1 (ukážkové dáta, orientačné rozloženie)

## Problém

Úvodná strana ukazuje iba tri karty so súčtom kusov za 1, 7 a 30 dní. Inžinier ani manažér z nej nezistí, ktoré projekty, part groups a scrap codes tvoria najviac scrapu, ako sa scrap vyvíja v čase, ani koľko dát appka celkovo eviduje. Strana tak nepôsobí, že appka zbiera veľa užitočných údajov.

Štatistiky sa navyše rátajú v root layoute, teda pri každej navigácii v celej appke, nielen na úvodnej strane. Ruta `/report` je prázdna.

## Riešenie

Úvodná strana sa zmení na kompaktný dashboard v bento rozložení so siedmimi dlaždicami, dvoma filtrami (project, obdobie) a detailným dialógom pri štyroch dlaždiciach. Vidia ho všetci, aj neprihlásení.

### Čo zmizne

- `OperatorLogin` z úvodnej strany (ostáva na scan stránke).
- Komponent `LandingStatistic` a výpočet `stats` v root `+layout.server.ts`.
- Ruta `/report` vrátane odkazu v navigácii (`navConst.ts`).
- Sťahovanie reportu sa nerobí. Export ostáva výhradne na `/scrapRecords`.

### Horný riadok

- Slogan zmenšený na jeden riadok (pri implementácii ho možno vypustiť, ak zavadzia).
- **Prepínač projektu:** tlačidlá „All projects" + všetky projekty, ktoré majú vo zvolenom období aspoň jeden scrap record. Ak je ich viac než 8, namiesto tlačidiel sa použije existujúci `Combobox`.
- **Prepínač obdobia:** 1 day / 7 days / 30 days / Custom. Custom má dátumy od–do, najviac 1 rok. Východzie je 7 days.
- Oba filtre sa zapisujú do URL (`?range=…&project=…`, pri Custom aj `from` a `to`). Neplatná hodnota vráti chybu 400.

### Dlaždice

| Dlaždica | Obsah | Detail | Reaguje na project | Reaguje na obdobie |
|---|---|---|---|---|
| Total parts | kusy za obdobie, rozpad scrap / rebuild, počet scrap recordov, zmena v % oproti predošlému rovnako dlhému obdobiu | nie | áno | áno |
| Trend | kusy v čase, scrap + rebuild ako stacked stĺpce | áno | áno | áno |
| Projects | projekty so scrapom zostupne podľa kusov, pruh scrap / rebuild, klik na riadok nastaví filter projektu (druhý klik ho zruší) | áno | nie (iba zvýrazní vybraný) | áno |
| Top part groups | top 5 podľa kusov | áno | áno | áno |
| Top scrap codes | top 5 podľa kusov, kód + popis | áno | áno | áno |
| Master data | počty Projects / Part groups / Part numbers / Labels v systéme | nie | nie | nie |
| All-time | celkové kusy a počet scrap recordov od prvého záznamu, s dátumom prvého záznamu | nie | nie | nie |

- Na desktope sa mriežka zmestí na jednu obrazovku. Na úzkej obrazovke sa poskladá do jedného stĺpca v poradí Total → Trend → Projects → ostatné, nič sa neskrýva.
- Dlaždica Projects má pevnú výšku a pri viac než 6 projektoch scrolluje vnútri.

### Detail dlaždice

- Otvára ho odkaz „Details ›" v hlavičke dlaždice, nie klik na celú plochu.
- Používa existujúci `ui/dialog`.
- Trend: väčší graf. Projects, Top part groups, Top scrap codes: rebríček top 10 s kusmi, podielom v % a rozpadom scrap / rebuild, plus informácia, koľko položiek je celkovo.
- Tlačidlo „Open in scrap records" otvorí `/scrapRecords` s predvyplneným obdobím a projektom (parametre podľa `parseScrapRecordFilters`).

### Pravidlá pre čísla

- Metrikou sú všade kusy, teda súčet `quantity`. Počet scrap recordov je vedľajší údaj.
- **Scrap** = `isRebuild = false`, **Rebuild** = `isRebuild = true`. Quantity scrap sa ráta do scrapu a samostatne sa nevyčleňuje. (Na `/scrapRecords` je quantity scrap samostatná kategória; na dashboarde zámerne nie.)
- Other variant a Other component v prvej verzii nie sú.
- Granularita trendu: po hodinách do 2 dní, po dňoch do 90 dní, po týždňoch nad 90 dní.
- Zmena oproti predošlému obdobiu má neutrálnu šípku, bez zeleno-červeného hodnotenia. Ak predošlé obdobie nemá dáta, zmena sa nezobrazí.
- Farby: scrap `chart-1`, rebuild `chart-warning`. Žiadne nové tokeny v téme.

### Dáta a výkon

- Dáta sa načítajú v `(Client)/+page.server.ts`, nie v root layoute.
- Výsledky sa na serveri držia 60 s v cache podľa kombinácie filtrov. Živé obnovovanie nie je.
- Agregácie idú cez `groupBy` / `aggregate` (prípadne čítací `$queryRaw` pre časové koše trendu). Proti DB idú výhradne čítania.
- Schéma Prisma sa nemení.

### Nová závislosť

- shadcn-svelte `chart` (postavený na LayerChart) pre dlaždicu Trend a jej detail. Rebríčky sú obyčajné pruhy bez knižnice.

## User stories

1. Ako manažér chcem na úvodnej strane vidieť celkový počet kusov za obdobie s rozpadom na scrap a rebuild.
2. Ako manažér chcem vidieť zmenu oproti predošlému obdobiu, aby som mal kontext bez klikania.
3. Ako inžinier chcem vidieť trend kusov v čase, aby som si všimol výkyvy.
4. Ako inžinier chcem prepnúť obdobie (1 deň, 7 dní, 30 dní, vlastný rozsah), aby som videl čísla za čas, ktorý ma zaujíma.
5. Ako inžinier jedného projektu chcem jedným klikom prefiltrovať dashboard na svoj projekt.
6. Ako manažér chcem vidieť všetky projekty so scrapom vedľa seba, aby som ich vedel porovnať.
7. Ako inžinier chcem vidieť top part groups a top scrap codes, aby som vedel, kde a prečo vzniká najviac scrapu.
8. Ako inžinier chcem z dlaždice otvoriť detail s plným rebríčkom a odtiaľ prejsť na zodpovedajúce scrap records.
9. Ako používateľ chcem poslať kolegovi link na dashboard s rovnakými filtrami.
10. Ako návštevník chcem vidieť, koľko dát appka eviduje (master data, all-time čísla).
11. Ako používateľ na úzkom displeji chcem vidieť všetky dlaždice pod sebou.
12. Ako používateľ chcem pri neplatnom filtri v URL dostať jasnú chybu 400.

## Mimo rozsahu

- Sťahovanie reportu (XLSX, PDF).
- Other variant / Other component na dashboarde.
- Živé obnovovanie dát.
- Samostatné vyčlenenie quantity scrapu.
- Nové univerzálne komponenty v `atoms/` (ak sa ukáže potreba spoločnej dlaždice, najprv návrh v chate).

## Testovanie

- Parsovanie filtrov, výpočet rozsahu a predošlého obdobia, voľba granularity a skladanie výsledkov sú čisté funkcie s unit testami.
- Načítanie dát sa testuje s mockovaným Prisma klientom. Žiadny test nezapisuje do DB.
- Vizuál overuje používateľ ručne na desktope a úzkom displeji.

## Tikety

- [01 – Filtre, load a číselné dlaždice](issues/01-filters-load-number-tiles.md)
- [02 – Dlaždica Trend a graf knižnica](issues/02-trend-tile-chart.md)
- [03 – Rebríčkové dlaždice Projects, Top part groups, Top scrap codes](issues/03-ranking-tiles.md)
- [04 – Detailné dialógy a prechod na scrap records](issues/04-detail-dialogs.md)
