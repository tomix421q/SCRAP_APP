# Panel akcií na obrazovke skenovania (ActionPanel)

Status: done

## Problém

Na obrazovke `scandmclabel` je pri dlhom zozname kariet tlačidlo na odoslanie dole a tlačidlo „Opakovať“ hore. Operátor na dotykovom monitore musí scrollovať. Počet stĺpcov kariet bol v každom režime natvrdo a nedal sa prispôsobiť.

## Riešenie

Kompaktný fixný panel v ľavom dolnom rohu (`ActionPanel.svelte`), ktorý sa zobrazí len keď sú karty (`scrapManager.mode && status === 'success'`). Obsahuje:

- tlačidlo „Opakovať“ (ikona, volá `resetAll`, neaktívne počas odosielania),
- prepínač počtu stĺpcov (ikony, skrytý pod `md`),
- tlačidlo na odoslanie, napojené na formulár cez `form="scrap"`.

## Rozhodnutia

- Počet stĺpcov sa pamätá **pre každý režim zvlášť** v `localStorage` (kľúč `gridByMode`), v `viewStore.svelte.ts`.
- Povolené hodnoty a predvolené hodnoty:
  - `rebuild`: 1 / 2 / 3, predvolene 2
  - `scrap`: 1 / 2 / 3, predvolene 2
  - `qntScrap`: 1 / 2, predvolene 1
- Pod `md` je vždy 1 stĺpec (rezerva pre tablety).
- `<main>` má `pb-20`, keď je panel viditeľný, aby panel neprekrýval poslednú kartu.
- Tlačidlo „Opakovať“ v `Scan.svelte` ostáva – je potrebné, keď panel nie je zobrazený (chyba skenu, žiadne karty).
- Karty v `QuantityScrap` sa pri užšom gride zalamujú (`flex-wrap`).

## Mimo rozsahu

- Údaje o operátorovi v paneli.
- Migrácia starého kľúča `numGrid` v `localStorage` (voľba sa jednorazovo vráti na predvolenú hodnotu).
