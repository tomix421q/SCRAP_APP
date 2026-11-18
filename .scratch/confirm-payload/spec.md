# Potvrdenie payloadu pred uložením (scandmclabel)

Status: ready

## Problém

Na obrazovke `scandmclabel` tlačidlo „Vytvoriť scrap / re-build / Uložiť quantity scrap“ v `ActionPanel` (`type="submit" form="scrap"`) uloží payload okamžite. Operátor nemá šancu skontrolovať, čo všetko sa chystá zapísať, a omyl (zlá part group, zlý scrap code, nechcený other component) sa opravuje až dodatočne v záznamoch.

## Riešenie

Tlačidlo v `ActionPanel` payload neuloží, ale otvorí modálne okno s prehľadným náhľadom payloadu. Scrap records sa vytvoria až po kliknutí na „Potvrdiť“ v modale.

Platí pre všetky tri módy: `scrap`, `rebuild`, `qntScrap`.

## Obsah modalu

### Hlavička

- **Mód** – výrazne, farebne podľa módu (rovnaké farby ako titulky módov vo formulári part group).
- **Label** – DMC; pri quantity scrape názov quantity scrap labelu.
- **Project**.
- **Card ID** operátora (`$operatorCardId`).

### Hlavné scrap records

Zdroj: `scrapManager.relevantPayload`. Riadky bez výberu sa nezobrazujú (ani sa neukladajú).

Každý hlavný scrap record je mini karta vizuálne ladená ako karta part group v `Scrap.svelte` / `Rebuild.svelte` (text vľavo, fotka vpravo), obsahuje:

- part group (`interfaceName`),
- scrap code + popis,
- replacement part, ak ide o other variant,
- množstvo (len quantity scrap).

Pri `rebuild` je **main reason** zobrazený ako prvý so štítkom „Main reason“.

### Other component scrap records

- Sú druhoradé – nesmú zaberať veľa miesta (býva ich viac).
- Zbalené pod tlačidlom „+N other component“ s `ChevronDown` – rovnaký vzor ako v `OperatorHistory.svelte` (related skupiny).
- Po rozbalení kompaktný riadok: malá miniatúra fotky, part group, malý štítok „Other component · príčina: <part group>“ a sivý scrap code, ktorý sa reálne uloží (other component scrap code príčiny).

### Súhrn

- „Vytvorí sa N scrap records“ (vrátane other component).
- Pri quantity scrape navyše „spolu X ks“.

## Vzhľad

- Tlmený, nerušivý: mini karty `bg-card` + `border-border`; farba módu iba ako tenký ľavý prúžok a v štítku. Žiadna plná červená výplň ako pri vybranej karte na stránke.
- Iba sémantické tokeny témy, `cardNormalize` pre obsah modalu.
- Fotky cez existujúci `GroupPhoto.svelte` (vrátane zväčšenia kliknutím):
  - hlavné scrap records: menšia ako na karte, cca `w-28`, na mobile `w-20`, pomer 4:3,
  - other component riadky: miniatúra cca `size-10`.
- Zoznam v modale je scrollovateľný (`max-h-[90dvh]`), funkčný aj na mobile.

## Tlačidlá a správanie

- **„Späť“** (aj Esc a klik mimo modalu) – iba zatvorí modal, formulár ostane bez zmeny.
- **„Potvrdiť scrap / re-build / quantity scrap“** – farebne podľa módu; odošle formulár.
- Texty tlačidla v `ActionPanel` ostávajú („Vytvoriť scrap / re-build / Uložiť quantity scrap“); jeho `disabled` logika (`canSubmit`, `isSubmitting`) sa nemení.
- **Skener:** čítačka DMC posiela `Enter`. Potvrdenie len kliknutím/ťuknutím – predvolený fokus na „Späť“, `Enter` nesmie uložiť.
- **Počas ukladania:** modal ostáva otvorený, zobrazí „Ukladá sa…“, obe tlačidlá a zatvorenie modalu sú neaktívne.
- **Úspech:** modal sa zatvorí a stránka sa resetuje ako dnes (`resetAll`).
- **Chyba:** modal sa zatvorí, chyba sa zobrazí tak ako dnes, výber operátora ostane zachovaný.

## Technické rozhodnutia

- Nový lokálny komponent `Scrapify/src/routes/(Client)/scandmclabel/_components/ConfirmPayloadDialog.svelte` nad existujúcim `$lib/components/ui/alert-dialog` (nie nový atom).
- Tlačidlo v `ActionPanel` sa zmení na `type="button"` a otvorí modal.
- „Potvrdiť“ odošle existujúci formulár `#scrap` cez `requestSubmit()` – `use:enhance` v `+page.svelte`, `canSubmit` aj server actions (`saveScrap`, `saveQuantityScrap`) ostávajú bez zmeny.
- Stav otvorenia modalu a `isSubmitting` musia byť prepojené tak, aby sa modal pri úspechu/chybe zatvoril (napr. `isSubmitting` z `+page.svelte` ako prop).
- Žiadna zmena schémy DB.

## Mimo rozsahu

- Zmeny validácie a server actions.
- Potvrdenie pri iných akciách (reset, sken).
- Nový pojem v `GLOSSARY.md` – modal je náhľad **payloadu**.
