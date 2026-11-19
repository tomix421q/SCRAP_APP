# 03 – Admin: checkboxy strán a stĺpec v tabuľke

Status: done
Rodič: [spec.md](../spec.md)
Blokované: 01

## Čo postaviť

- `/admin/partgroups/+page.svelte`: v Re-build mode options riadok „Hide in rebuild for:“ so 4 checkboxmi FR / FL / RR / RL. Reset pri novom formulári, načítanie pri úprave (`NULL` → `false`).
- Zod schéma v `$lib/utils/zod` a `+page.server.ts`: uloženie 4 príznakov pri vytvorení aj úprave.
- `NewGroupTable.svelte`: stĺpec Hidden in rebuild („FR, RR“ alebo „–“).
- Hint pod Qad identity: „Bez QAD identity sa part group zobrazí iba v quantity scrape.“ a štítok **Iba QNT** v tabuľke.
- Iba sémantické tokeny, existujúce komponenty.

## Akceptačné kritériá

- [x] Príznaky sa uložia a načítajú pri vytvorení aj úprave.
- [x] Tabuľka zobrazuje skryté strany.
- [x] `npm run check` prejde.

## Comments
