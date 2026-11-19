# Skrytie part group v rebuilde podľa strany dielu

Status: open

## Problém

Niektoré part groups nedávajú pri rebuilde zmysel pre konkrétnu stranu dielu (FR, FL, RR, RL). Operator ich dnes v rebuild móde vidí pri každom labeli, aj keď sa pre danú stranu nemôžu týkať.

## Riešenie

Inžinier v part group pod **Re-build mode options** zaškrtne strany, pre ktoré je part group v rebuilde skrytá (**Hidden in rebuild for side**). Ak naskenovaný DMC obsahuje takú stranu, part group sa v rebuild móde nezobrazí.

Ide o analógiu k `hiddenInScrap` (pôvodná špecifikácia: `.scratch/_old_scratch/hidden-in-scrap/`).

## Pravidlá

- Strana sa zisťuje z DMC: ľubovoľný výskyt `FR`, `FL`, `RR` alebo `RL` (bez ohľadu na veľkosť písmen), rovnako ako pri `{SIDE}` v maske.
- DMC bez kódu strany: nič sa neskrýva.
- DMC s viacerými **rôznymi** kódmi strán: strana je nejednoznačná, nič sa neskrýva.
- Platí pre **všetky** part groups (nielen `isRebuild`), lebo v rebuild móde sa zobrazujú všetky.
- Skrytá part group sa v rebuild móde správa ako `hiddenInScrap` v scrap móde:
  - v UI sa nezobrazí,
  - nemôže byť main reason ani other component (ani príčina other component),
  - server ju pri uložení rebuild payloadu odmietne.
- Scrap mód a quantity scrap sa nemenia.

### Part group bez QAD identity

- Part group s prázdnou `qadIdentity` (`NULL` alebo prázdny string po `trim`) sa **nezobrazí v scrap ani v rebuild móde**, iba v quantity scrape.
- Platí rovnaký rozsah ako pri ostatných pravidlách: nemôže byť main reason, other component ani príčina, server ju odmietne.
- Dopad v produkcii (overené čítaním DB 2026-11-19): 4 z 30 part groups, všetky X540 – SCREWS / SKRUTKY, CLIPS / KLIPY, ACUSTIC FLEECE, LIGHT GUIDE IRH. Dnes sú viditeľné v scrape, po nasadení ostanú iba v quantity scrape (potvrdené ako želané).
- Bez zmeny schémy.
- Ak po skrytí v rebuilde nezostane žiadna part group, UI zobrazí hlášku „Pre stranu {X} nie sú v rebuilde žiadne part groups.“ a uloženie nie je možné.

## Zmena schémy

Iba návrh. Úpravu spravím v `schema.prisma`, `db push` spúšťa výhradne používateľ po zálohe.

Nové polia sú **nepovinné** (nullable), aby sa nerozbili existujúce dáta. `NULL` sa v kóde chápe ako `false`.

```prisma
model PartGroup {
  // ...existing fields
  hiddenInRebuildFR Boolean? @default(false)
  hiddenInRebuildFL Boolean? @default(false)
  hiddenInRebuildRR Boolean? @default(false)
  hiddenInRebuildRL Boolean? @default(false)
}
```

## Pravidlá viditeľnosti pokope (rozšíriteľnosť)

Časom môžu pribúdať ďalšie pravidlá skrývania part group. Preto všetky pravidlá viditeľnosti vyhodnocuje **jeden modul**, nie roztrúsené podmienky v UI a na serveri.

- Stĺpce ostávajú na `PartGroup` (žiadna nová tabuľka pravidiel).
- Modul `$lib/utils/partGroupVisibility.ts` (mimo `$lib/server`, použiteľný na klientovi aj na serveri), čistý a typovo bezpečný:

```ts
export const PART_SIDES = ['FR', 'FL', 'RR', 'RL'] as const;
export type PartSide = (typeof PART_SIDES)[number];

export type ScanMode = 'scrap' | 'rebuild' | 'quantity';

/** Context of one scan the rules are evaluated against. */
export interface VisibilityContext {
	mode: ScanMode;
	dmc: string;
}

/** Part group fields the rules read (subset of PartGroup). */
export type VisibilityFlags = Pick<
	PartGroup,
	'hiddenInScrap' | 'qadIdentity' | 'hiddenInRebuildFR' | 'hiddenInRebuildFL' | 'hiddenInRebuildRR' | 'hiddenInRebuildRL'
>;

export type HiddenReason =
	| { rule: 'hiddenInScrap' }
	| { rule: 'missingQadIdentity' }
	| { rule: 'hiddenInRebuildForSide'; side: PartSide };

/** One rule: returns a reason when it hides the part group, otherwise null. */
type VisibilityRule = (group: VisibilityFlags, ctx: VisibilityContext) => HiddenReason | null;

const VISIBILITY_RULES: readonly VisibilityRule[] = [
	hiddenInScrapRule,
	missingQadIdentityRule,
	hiddenInRebuildForSideRule
];

/** The single side code found in the DMC; null when none or ambiguous. */
export function extractSideFromDmc(dmc: string): PartSide | null;

/** First rule that hides the part group in this context, or null when it is visible. */
export function getHiddenReason(group: VisibilityFlags, ctx: VisibilityContext): HiddenReason | null;

/** Operator-facing message for a hidden reason (used in fail() and UI). */
export function describeHiddenReason(reason: HiddenReason, interfaceName: string): string;
```

- **Nové pravidlo** = nová funkcia + jej záznam vo `VISIBILITY_RULES` + varianta v `HiddenReason` (TS vynúti doplnenie hlášky v `describeHiddenReason`). Klient ani server sa nemenia.
- Pravidlá v tomto rozsahu: `hiddenInScrap`, `missingQadIdentity` (scrap + rebuild) a `hiddenInRebuildForSide`.
- Existujúce `hiddenInScrap` sa presunie do modulu ako prvé pravidlo (bez zmeny správania). `ScrapManager.visibleRows` aj obe kontroly v `saveScrap` volajú iba `getHiddenReason`.
- `cannotBeMainReason` nie je pravidlo viditeľnosti (part group sa zobrazuje), do modulu nepatrí.
- `matchDmcWithMask` v `serverHelp.ts` použije `PART_SIDES` (žiadny duplicitný regex).
- V admine ostáva rozdelenie **Re-build mode options** / **Scrap mode options**; pravidlá sú pokope v kóde, v UI podľa módu.

## Admin (`/admin/partgroups`)

- V sekcii **Re-build mode options** pribudne riadok „Hide in rebuild for:“ so 4 checkboxmi FR / FL / RR / RL (existujúci `$lib/components/ui/checkbox`, sémantické tokeny).
- Vytvorenie aj úprava part group ukladajú 4 príznaky (zod schéma v `$lib/utils/zod`, form data ako pri `hiddenInScrap`).
- Edit dialóg načíta uložené hodnoty (`NULL` → nezaškrtnuté).
- Tabuľka part groups (`NewGroupTable.svelte`) dostane stĺpec **Hidden in rebuild** so zoznamom strán, napr. „FR, RR“, alebo „–“.
- Pod poľom **Qad identity** hint: „Bez QAD identity sa part group zobrazí iba v quantity scrape.“
- V tabuľke part groups štítok **Iba QNT** pri part group bez QAD identity.

## Skenovacia stránka (`scandmclabel`)

- `ScrapManager.svelte.ts` – `visibleRows`: pre každý mód filtruje cez `getHiddenReason(group, { mode, dmc })` (nahradí dnešnú podmienku `hiddenInScrap`).
- Všetky výpočty (main reason, cause candidates, other component) pracujú iba s viditeľnými riadkami.
- `+page.server.ts` – `saveScrap` (scrap aj rebuild) cez `getHiddenReason`:
  - odmietne riadok skrytej part group (`fail(400)` s textom z `describeHiddenReason`, napr. „Part group {interfaceName} je v rebuilde skrytá pre stranu {X}.“),
  - odmietne other component s príčinou, ktorá je skrytá.
- Hláška pri prázdnom zozname v rebuilde (pozri Pravidlá).

## Slovník

`GLOSSARY.md`: nový pojem **Hidden in rebuild for side** (sekcia Diely a dôvody, za Hidden in scrap).

## Akceptačné kritériá

- [ ] Inžinier zaškrtne strany v Re-build mode options, hodnoty sa uložia a pri úprave sa načítajú.
- [ ] Existujúce part groups po nasadení fungujú bez zmeny (`NULL` = nezaškrtnuté).
- [ ] Rebuild s DMC obsahujúcim `RR` nezobrazí part groups s `hiddenInRebuildRR`.
- [ ] DMC bez strany alebo s viacerými rôznymi stranami zobrazí všetky part groups.
- [ ] Scrap a quantity scrap sa nezmenili.
- [ ] Priamy POST rebuild payloadu so skrytou part group (aj ako príčinou other component) vráti 400 a nič sa nezapíše.
- [ ] Part group bez QAD identity sa nezobrazí v scrape ani rebuilde, v quantity scrape áno; priamy POST s ňou v scrape/rebuilde vráti 400.
- [ ] Admin zobrazí hint pri Qad identity a štítok Iba QNT v tabuľke.
- [ ] Prázdny zoznam v rebuilde zobrazí hlášku a nedovolí uložiť.
- [ ] Tabuľka part groups zobrazuje stĺpec Hidden in rebuild.
- [ ] Všetky pravidlá viditeľnosti (aj `hiddenInScrap`) vyhodnocuje iba `getHiddenReason`; v UI ani na serveri nie je iná podmienka skrývania.
- [ ] Testy (mockovaný Prisma klient): `extractSideFromDmc` (žiadna, jedna, viac rôznych, malé písmená), `getHiddenReason` (každé pravidlo, každý mód, `NULL` flagy) a 400 v `saveScrap`.
- [ ] `npm run check` prejde.

## Mimo rozsahu

- Povinná `qadIdentity` pri ukladaní part group (rieši sa skrytím, nie validáciou).
- Presnejšia detekcia strany podľa pozície v DMC alebo podľa `PartGroupMaterial.side`.
- Skrývanie podľa strany v scrap móde a quantity scrape.
