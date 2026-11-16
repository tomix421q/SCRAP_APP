# 10 – Presúvateľné dlaždice v sekcii Analytics

Status: todo
Rodič: [spec.md](../spec.md)
Blokované: [06](06-pareto-scrap-codes.md), [07](07-heatmap.md), [08](08-trend-of-selection.md), [09](09-scanning-activity.md)

## Čo postaviť

- Presúvanie dlaždíc v sekcii Analytics; poradie sa ukladá do `localStorage` (zoznam id dlaždíc).
- Server vykreslí východzie poradie, po načítaní sa použije uložené. Neznáme alebo chýbajúce id sa ignorujú, nové dlaždice sa pridajú na koniec.
- Presúvanie myšou, dotykom aj klávesnicou; tlačidlo „Reset layout".
- Čistá funkcia na zlúčenie uloženého poradia s aktuálnym zoznamom dlaždíc.
- Knižnica: `svelte-dnd-action` (schválené 2026-11-16; má zabudovanú klávesnicu a dotyk). Pred pridaním overiť podporu Svelte 5; ak nesedí, alternatíva je `@dnd-kit-svelte` (najprv sa opýtať).

## Akceptačné kritériá

- [ ] Poradie prežije obnovenie stránky a zmenu filtrov.
- [ ] Poškodené alebo prázdne `localStorage` nespôsobí chybu, použije sa východzie poradie.
- [ ] Reset layout vráti východzie poradie.
- [ ] Presúvanie funguje z klávesnice a na dotykovom displeji.
- [ ] Unit testy pre zlúčenie uloženého poradia (nové, odstránené, duplicitné id).
- [ ] `npm run check` a `npm run test` prechádzajú.
