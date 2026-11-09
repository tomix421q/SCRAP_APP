# Fotka skupiny dielov (PartGroup)

Status: done

## Problém

Operátor na obrazovke skenovania štítkov (`scandmclabel`) vidí skupinu dielov len ako text (názov, materiály). Rozpoznať správny diel podľa názvu je pomalé a náchylné na chyby. Moderátor nemá ako ku skupine priložiť fotku dielu.

## Riešenie

Moderátor môže pri vytváraní alebo úprave `PartGroup` voliteľne nahrať fotku a neskôr ju zmeniť alebo vymazať. Operátor ju vidí na obrazovke `scandmclabel` pri skupine, takže diel rozpozná aj vizuálne. Skupiny bez fotky fungujú presne ako doteraz.

## Používateľské príbehy

1. Ako moderátor chcem nahrať fotku pri vytváraní skupiny, aby operátori diel rozpoznali vizuálne.
2. Ako moderátor chcem, aby bola fotka voliteľná, aby som mohol vytvoriť skupinu aj bez nej.
3. Ako moderátor chcem vidieť aktuálnu fotku v edit formulári, aby som vedel, čo uvidí operátor.
4. Ako moderátor chcem pri úprave skupiny fotku nahradiť, aby som opravil zlý alebo zastaraný obrázok.
5. Ako moderátor chcem v edit formulári tlačidlo „odstrániť fotku“, aby som vedel zmazať nesprávny obrázok.
6. Ako moderátor chcem, aby úprava ostatných polí skupiny fotku nikdy nezmenila ani nezmazala, aby som o ňu neprišiel omylom.
7. Ako moderátor chcem jasnú chybovú hlášku pri nepodporovanom type, príliš veľkom alebo poškodenom súbore, aby som vedel nahrávku opraviť.
8. Ako moderátor chcem náhľad vybraného súboru pred uložením, aby som si overil, že som vybral správny obrázok.
9. Ako operátor chcem vidieť fotku skupiny na `scandmclabel`, aby som diel rozpoznal bez čítania názvov.
10. Ako operátor chcem, aby obrazovka fungovala normálne aj pri skupine bez fotky, aby ma to neblokovalo.
11. Ako operátor chcem, aby sa fotka v továrenskej sieti načítala rýchlo, aby skenovanie nespomaľovala.
12. Ako admin chcem, aby sa pri zmazaní skupiny zmazal aj súbor fotky, aby na serveri nezostávali siroty.
13. Ako admin chcem, aby existujúce skupiny po nasadení zostali nezmenené, aby boli produkčné dáta v bezpečí.
14. Ako admin chcem, aby fotku mohol nahrávať, meniť a mazať len ten, kto smie spravovať skupiny, aby ju nemohol meniť nikto neoprávnený.
15. Ako admin chcem trvalý a cez env konfigurovateľný priečinok na fotky, aby ich nasadenie nezmazalo a aby som ho mohol presunúť podľa prostredia.

## Implementačné rozhodnutia

- **Schéma:** jeden nový nepovinný stĺpec na `PartGroup` s odkazom na uložený súbor (názov súboru, nie absolútna cesta). Žiadna zmena existujúcich stĺpcov, žiadny backfill. Nasadenie cez `db push` po zálohe DB; výstup sa vždy skontroluje a strata dát sa nikdy nepotvrdzuje.
- **Úložisko:** súbory na disku servera v priečinku z env premennej `PARTGROUP_PHOTO_DIR` (čítanej cez `$env/dynamic/private`). Ak nie je nastavená, použije sa lokálny default `./uploads/partgroups`. Priečinok musí byť mimo `build/` a mimo `static/` a je vylúčený z verzionovania (`.gitignore`). Súbor sa pomenuje podľa id skupiny, takže nahradenie ho prepíše a zmazanie odstráni práve jeden súbor.
- **Spracovanie obrázka:** zmenšenie robí prehliadač pred odoslaním (canvas, max. 800 px, výstup webp), čím sa odstránia aj EXIF metadáta. Žiadna nová závislosť (rozhodnuté: bez `sharp`, kvôli natívnym binárkam na Windows serveri). Server prijme len webp, max. 2 MB, a kontroluje skutočný obsah súboru (magic bytes), nie len príponu alebo MIME hlavičku; ostatné súbory zamietne. Server obrázok neprekódováva, ukladá ho tak, ako prišiel.
- **Form actions:** formuláre vytvorenia a úpravy sa odosielajú ako multipart. Úprava má tri stavy fotky: ponechať (predvolené, fotka sa nedotkne), nahradiť, odstrániť. Existujúca logika update, ktorá maže a znovu vytvára materiály a scrap kódy, sa poľa fotky nesmie dotknúť.
- **Konzistencia:** najprv zápis súboru, potom odkaz v DB; pri chybe sa nový súbor vráti späť, aby DB nikdy neukazovala na neexistujúci súbor. Pri nahradení alebo odstránení sa starý súbor zmaže až po úspešnom update v DB. Zmazanie skupiny odstráni jej súbor; chýbajúci súbor zmazanie nezhodí.
- **Endpoint na čítanie:** serverová cesta vráti obrázok podľa id skupiny s cache hlavičkami a 404, ak fotka neexistuje. URL je verzovaná (napr. podľa `updatedAt`), aby sa po výmene nezobrazila stará fotka. Zoznamy skupín v `load` nesú len odkaz alebo príznak „má fotku“, nikdy dáta obrázka.
- **Limit tela požiadavky:** `adapter-node` má predvolený limit 512 kB, preto sa v produkčnom `.env` nastaví `BODY_SIZE_LIMIT=3M`. Je to nasadzovací krok, bez neho upload zlyhá.
- **Vzťah k skupine:** fotka patrí konkrétnej skupine podľa id, nie podľa názvu; skupiny s rovnakým názvom v rôznych `vProject` majú každá vlastnú fotku.
- **Oprávnenia:** rovnaké ako pre vytvorenie a úpravu skupiny, vynútené na serveri v actions.
- **UI:** admin formulár používa existujúce zdieľané komponenty a tokeny témy (`cardNormalize`, `inputNormalize`); nový univerzálny komponent sa bez predchádzajúceho návrhu nevytvára. Fotka sa zobrazí len na `scandmclabel` pri každej skupine, ak existuje. Konkrétna veľkosť a vzhľad sa doladí počas implementácie na reálnej obrazovke.

## Rozhodnutia o testovaní

- Dobrý test kontroluje len vonkajšie správanie: pre daný odoslaný formulár, čo skončí v DB, na disku a v odpovedi; nie interné volania pomocných funkcií.
- Seam: form actions v `partgroups` plus endpoint na čítanie fotky. Jeden seam, žiadne ďalšie.
- Prípady: vytvorenie s fotkou a bez; zamietnutie zlého typu (aj súboru s podvrhnutou príponou), príliš veľkého a poškodeného súboru; úprava ponechať/nahradiť/odstrániť; úprava iných polí fotku nezmení; zmazanie skupiny zmaže súbor; neoprávnený používateľ je zamietnutý; chýbajúci súbor pri zmazaní nezhodí akciu; endpoint vráti obrázok alebo 404.
- Vzor: pozrieť existujúce testy server actions v repozitári a znovu použiť ich nastavenie.

## Mimo rozsah

- Zobrazenie fotky na iných obrazovkách ako `scandmclabel` (napr. `scrapRecords`); možné pokračovanie.
- Viac fotiek na skupinu, orezávanie v prehliadači, galérie.
- Fotky pre materiály alebo scrap záznamy.
- Presun úložiska do DB alebo cloudu.
- Hromadný import fotiek.
- Záloha priečinka s fotkami na serveri (rieši sa mimo kódu).

## Ďalšie poznámky

- **Vývoj beží proti produkčnej DB** (iná k dispozícii nie je). Pravidlá: agent nikdy nespúšťa `db push` ani zápisy do DB; zmenu schémy najprv schváli používateľ a `db push` robí používateľ sám po zálohe. Poradie: (1) úprava `schema.prisma` a schválenie, (2) záloha a `db push` používateľom (aditívny nullable stĺpec, starý kód ho ignoruje), (3) generovanie klienta, (4) implementácia. Testy actions bežia s mockovaným Prisma klientom a dočasným priečinkom, nie proti produkcii. Ručné skúšanie uploadu robiť na jednej zjavne testovacej skupine (napr. názov `TEST_FOTO`) a po overení ju zmazať.

- Produkčná aplikácia: zmeny DB sú len aditívne a nullable; pred každým `db push` záloha.
- Node proces musí mať právo zápisu do priečinka na fotky.
