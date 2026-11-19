# 02 – Modul pravidiel viditeľnosti part group

Status: done
Rodič: [spec.md](../spec.md)
Blokované: 01

## Čo postaviť

- `$lib/utils/partGroupVisibility.ts` (mimo `$lib/server`) podľa sekcie „Pravidlá viditeľnosti pokope“ v spec: `PART_SIDES`, `extractSideFromDmc`, `VISIBILITY_RULES`, `getHiddenReason`, `describeHiddenReason`.
- Pravidlá: `hiddenInScrap` (presun existujúcej logiky, bez zmeny správania), `missingQadIdentity` (`NULL` / prázdny string po `trim` → skryté v scrap a rebuild) a `hiddenInRebuildForSide`.
- `matchDmcWithMask` v `serverHelp.ts` používa `PART_SIDES` namiesto vlastného regexu, správanie `{SIDE}` sa nemení.
- Unit testy: `extractSideFromDmc` (žiadna strana, jedna, viac rôznych → `null`, rovnaká dvakrát, malé písmená); `getHiddenReason` pre každé pravidlo × mód (scrap, rebuild, quantity), `NULL` flagy.

## Akceptačné kritériá

- [x] Pridanie nového pravidla vyžaduje zmenu iba v tomto module (TS vynúti hlášku pre novú variantu `HiddenReason`).
- [x] Testy prejdú, existujúce testy masky `{SIDE}` prejdú bez zmeny.
- [x] `npm run check` prejde.

## Comments
