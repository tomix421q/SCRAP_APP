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

**Payload**:
Jedno uloženie formulára na skenovacej stránke (scrap, rebuild alebo quantity scrap), ktoré vytvorí jeden alebo viac scrap recordov. Všetky scrap recordy jedného payloadu majú rovnaké payload ID (`payloadRecId`, UUID generované serverom). Opätovné uloženie toho istého labelu je nový payload s novým ID. Scrap recordy spred zavedenia payload ID ho nemajú.
_Avoid_: dávka, batch, submit (ako podstatné meno)

## Diely a dôvody

**Project**:
Vozidlový projekt (napr. X540), do ktorého patria part groups, labely a scrap codes.
_Avoid_: vProject, program

**Part group**:
Skupina dielov v rámci projektu, ku ktorej sa scrap record viaže; určuje, ktoré part numbers a scrap codes sú pre ňu povolené.
_Avoid_: skupina, group (bez upresnenia)

**Hidden in scrap**:
Nastavenie part group, ktorým ju inžinier skryje v scrap móde: operator ju pri scrape nevidí a nemôže byť ani príčinou other component. Rebuild a quantity scrap neovplyvňuje. Predvolene je každá part group v scrap móde viditeľná.
_Avoid_: show in scrap, scrap group, vypnutá group

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

**Other component scrap code**:
Scrap code, ktorý inžinier určil v part group ako dôvod pre ostatné part groups, keď je táto part group ich príčinou (pri rebuilde aj pri scrape); part group má najviac jeden. Scrap records pridružených part groups (s príznakom other component) nesú scrap code príčiny, nie svoj vlastný. Každá rebuild part group ho musí mať, okrem tých, ktoré nemôžu byť main reason.
_Avoid_: other component flag, kód iného komponentu

**Main reason**:
Pri rebuilde scrap code zvolený na jedinej rebuild part group, ktorá je príčinou; ostatné zaškrtnuté part groups v tom istom payloade sú other component. Inžinier môže rebuild part group označiť, že main reason mať nemôže; takú part group operator pri rebuilde nevyberá ako príčinu, ale stále sa zapisuje ako other component.
_Avoid_: hlavný dôvod, primary reason

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

**Allowed label**:
Label (DMC maska), ktorý má operator povolený skenovať. Operator s obmedzením smie zaznamenať scrap records iba na svoje allowed labels; ak nemá žiadny, nesmie nič. Operator bez obmedzenia smie všetky labely. Platí aj pre quantity scrap labels. Useri s účtom obmedzení nie sú.
_Avoid_: permission, oprávnenie, právo

**Card ID**:
Číslo zamestnaneckej karty, ktorým sa operator alebo user identifikuje pri zázname; v scrap recorde je uvedené ako Created by.
_Avoid_: operator ID, číslo operátora

## Export

**QAD export**:
Príznak, že scrap record bol prenesený do podnikového systému QAD.
_Avoid_: export (bez upresnenia), synchronizácia
