# História scrapov operátora v karte operátora

Status: done

## Problém

Operátor po uložení scrapu na `scandmclabel` nevie, či sa zapísalo to, čo chcel. Po úspešnom uložení sa formulár vyresetuje a panel akcií zmizne, takže nemá kde skontrolovať svoju prácu. Záznamy vidí len engineer alebo moderátor na stránke `scrapRecords`.

## Riešenie

V karte operátora (`OperatorLogin`, prihlásený stav) pribudne tlačidlo **História**. Po kliknutí sa otvorí modal **„Moje scrapy od polnoci“** so záznamami prihláseného operátora. Údaje sa načítajú z DB až po kliknutí. Modal je čisto informačný, jeho jediný účel je, aby operátor videl, či uložil správne veci.

Karta operátora sa zároveň vizuálne zjednotí tak, aby vyzerala ako preukaz (viď nižšie).

Súvisiaca (hotová) špecifikácia: `.scratch/action-panel/spec.md`. Panel akcií sa touto zmenou nemení.

## Rozhodnutia

- **Koho záznamy:** iba prihláseného operátora (`ScrapRecord.createdBy` = číslo jeho karty z `$operatorCardId`).
- **Obdobie:** od polnoci (začiatok aktuálneho kalendárneho dňa) po teraz. Poznámka: nočná zmena (22:00–06:00) preto o polnoci „stratí“ prvú polovicu záznamov; riziko je vedome akceptované.
- **Rozsah a poradie:** všetky záznamy v tomto období, najnovšie hore, pevný strop 200 záznamov. Pri dosiahnutí stropu je pod zoznamom poznámka „Zobrazených posledných 200“. Bez filtrov a stránkovania. Jeden riadok = jeden záznam v DB, okrem rebuildu (viď Zoskupenie rebuildu). Strop 200 sa počíta v záznamoch, nie v riadkoch.
- **Zoskupenie rebuildu:** pri rebuilde operátor zadá dôvod iba pri hlavnej skupine (tá, ktorá má chybu). Ostatné skupiny sa uložia len s príznakom (`isRebuild = true`, prípadne `isOtherComponent`). Záznamy jedného uloženia rebuildu (rovnaký `dmc` a rovnaký `createdAt`, lebo sa ukladajú jedným `createMany` a `GETDATE()` sa vyhodnotí raz) sa zobrazia ako jeden riadok. Viditeľné sú všetky záznamy s dôvodom (scrap code alebo iný variant). Ak žiadny dôvod nemá, ukáže sa prvý záznam. Záznamy len s príznakom sú skryté a zobrazia sa po kliknutí na „+N ďalšie skupiny“ (rozbalenie priamo v riadku). Scrap a quantity scrap sa nezoskupujú. Rebuild rozdelený stropom 200 sa nerieši, história je iba informačná.
- **Riadok obsahuje:** čas (HH:mm), DMC, názov skupiny (`partGroup.interfaceName`), režim (Scrap / Rebuild / Quantity), dôvod scrapu alebo štítok „Iný komponent“ / „Iný variant“ (s part number náhradného dielu), množstvo len ak je iné než 1 a text **„QAD: áno/nie“** podľa `QADExported`.
- **Režim sa neukladá**, odvodzuje sa: label s prefixom `quantityScrapLabelPrefix` = Quantity, inak `isRebuild` = Rebuild, inak Scrap.
- **Načítanie:** SvelteKit akcia `?/history` v `scandmclabel/+page.server.ts` (vzor `scanDmc`), len čítanie, volaná po kliknutí na tlačidlo. Číslo karty príde z klienta, rovnako ako pri ukladaní (operátori nemajú serverovú session; v internej sieti je to pri čítaní prijateľné). Stav načítavania a chyba sa v modale zobrazia zrozumiteľne.
- **Umiestnenie:** `OperatorLogin` sa používa aj na úvodnej stránke, kde akcia `?/history` neexistuje. Komponent preto dostane voliteľný snippet s akciami, ktorý odovzdá len `Scan.svelte`. Modal (existujúci `Dialog` z `ui/dialog`) a samotný obsah histórie ležia v `scandmclabel/_components/`.
- **Meno operátora:** karta zobrazí `Operator.fullName`. Číslo karty ostáva v `localStorage`, meno sa pri zobrazení karty dotiahne cez existujúci `POST /api/operators`, ktorého odpoveď sa rozšíri o `fullName`. Meno sa neukladá do `localStorage`. Počas načítania alebo pri chybe sa ukáže len číslo karty.
- **Vzhľad karty (preukaz):** hore ikona osoby a nápis „OPERÁTOR“, pod ním meno, potom veľké číslo karty zelenou, dole v rade outline tlačidlo „História“ (ikona `History`) a menšie červené „Odhlásiť“. Odhlásiť je posledné a vizuálne slabšie, aby sa naň nedalo preklepnúť namiesto histórie. Rovnomerné medzery namiesto prázdneho miesta uprostred. Stav prihlásenia (zadanie čísla) zostane v rovnakom štýle, aby oba stavy vyzerali jednotne. Iba sémantické tokeny z témy.

## User stories

1. Ako operátor chcem po uložení scrapu otvoriť históriu jedným klikom, aby som videl, či sa uložilo to, čo som chcel.
2. Ako operátor chcem vidieť len svoje záznamy, aby ma cudzie nemýlili.
3. Ako operátor chcem vidieť najnovší záznam hore, aby som ho videl bez scrollovania.
4. Ako operátor chcem pri každom zázname vidieť DMC, skupinu, režim a dôvod, aby som mohol skontrolovať správnosť.
5. Ako operátor chcem pri zázname vidieť „QAD: áno/nie“, aby som vedel, či už bol exportovaný.
6. Ako operátor chcem pri chybe načítania dostať zrozumiteľnú hlášku, nie prázdne okno.
7. Ako operátor chcem, aby karta operátora vyzerala ako preukaz s menom a číslom karty, aby bolo hneď jasné, kto je prihlásený.
8. Ako operátor nechcem preklepnúť Odhlásiť namiesto Histórie.
9. Ako vývojár chcem, aby sa tlačidlo zobrazilo len tam, kde akcia existuje (na úvodnej stránke nie).
10. Ako operátor chcem pri rebuilde vidieť iba záznamy s dôvodom a ostatné skupiny rozbaliť až na požiadanie, aby ma nerušili.

## Mimo rozsahu

- Filtre, vyhľadávanie, stránkovanie a export histórie.
- Úpravy a mazanie záznamov z histórie (ostáva v `scrapRecords`).
- Zobrazenie záznamov iných operátorov.
- Zmena ActionPanel a `Scan.svelte` okrem odovzdania snippetu.

## Overiť pri implementácii

- Hranica „polnoc“ musí zodpovedať lokálnemu času, v akom sa `createdAt` zapisuje (`GETDATE()`); použiť rovnaký prístup ako existujúci filter dátumu na `scrapRecords`.
- Quantity scrap záznamy: `dmc` je kód labelu s prefixom, množstvo môže byť iné než 1.
- Testy iba s mockovaným Prisma klientom (produkčná DB).
