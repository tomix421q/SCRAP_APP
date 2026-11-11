# Scrapify

Interná výrobná aplikácia na evidenciu chybných dielov: operátor naskenuje diel a zaznamená, či ide do scrapu alebo na rebuild a z akého dôvodu.

## Záznamy

**Scrap record**:
Jeden zaznamenaný chybný diel (alebo množstvo dielov) jednej part group, ktorý vytvoril operátor alebo používateľ svojou kartou.
_Avoid_: záznam, entry, scrap (ako podstatné meno pre záznam)

**Scrap**:
Typ scrap recordu, pri ktorom sa diel natrvalo vyraďuje.
_Avoid_: odpad, reject

**Rebuild**:
Typ scrap recordu, pri ktorom sa diel nevyraďuje, ale ide na opravu alebo prestavbu.
_Avoid_: repair, oprava

**Quantity scrap**:
Typ scrap recordu zadaný množstvom bez skenovania konkrétneho dielu, viazaný na quantity scrap label.
_Avoid_: hromadný scrap, QNT

**Label**:
DMC kód konkrétneho dielu, ktorý operátor naskenuje; jednoznačne identifikuje diel v scrap recorde.
_Avoid_: barcode, štítok, kód (bez upresnenia)

**Quantity scrap label**:
Label, ktorý nepatrí fyzickému dielu, ale zastupuje skupinu dielov, pre ktoré sa scrap zadáva množstvom.

## Diely a dôvody

**Project**:
Vozidlový projekt (napr. X540), do ktorého patria part groups, labely a scrap codes.
_Avoid_: vProject, program

**Part group**:
Skupina dielov v rámci projektu, ku ktorej sa scrap record viaže; určuje, ktoré part numbers a scrap codes sú pre ňu povolené.
_Avoid_: skupina, group (bez upresnenia)

**Part number**:
Číslo materiálu konkrétnej varianty dielu.
_Avoid_: PN, materiál (bez upresnenia)

**Scrap code**:
Kód dôvodu, prečo je diel chybný, s popisom; platí v rámci projektu.
_Avoid_: reason code, chybový kód, scrap reason

## Výnimky v scrap recorde

**Other component**:
Príznak scrap recordu: chybný bol iný komponent, nie samotný diel z part group.
_Avoid_: iný diel

**Other variant**:
Príznak scrap recordu: reálne sa scrapovala iná varianta dielu, než určuje label. Platí vždy, keď má záznam replacement part, aj pri quantity scrape.
_Avoid_: iná varianta, náhradná varianta

**Replacement part**:
Part number varianty, ktorá sa reálne scrapovala namiesto varianty určenej labelom.
_Avoid_: náhradný diel, replacement material, náhradný materiál

## Ľudia

**Operator**:
Pracovník výroby bez používateľského účtu, ktorý sa identifikuje kartou a zaznamenáva scrap records.
_Avoid_: user, pracovník

**User**:
Používateľ s účtom a rolou (USER, ENGINEER, MODERATOR, ADMIN); svojou kartou môže zaznamenávať scrap records rovnako ako operator.
_Avoid_: operator, account

**Card ID**:
Číslo zamestnaneckej karty, ktorým sa operator alebo user identifikuje pri zázname; v scrap recorde je uvedené ako Created by.
_Avoid_: operator ID, číslo operátora

## Export

**QAD export**:
Príznak, že scrap record bol prenesený do podnikového systému QAD.
_Avoid_: export (bez upresnenia), synchronizácia
