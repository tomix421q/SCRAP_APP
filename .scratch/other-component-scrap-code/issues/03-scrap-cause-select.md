# 03 – Scrap: výber príčiny

Spec: [../spec.md](../spec.md)
Závisí od: [02](02-rebuild-cause-code.md)

## Čo

- Kandidát na príčinu = iná part group s vybraným scrap code, ktorá má Other component scrap code (riadok s iným variantom nie je kandidát).
- 0 kandidátov: checkbox sa nezobrazí. 1 kandidát: príčina sa nastaví automaticky. 2 a viac: výber „Príčina“ cez `$lib/components/atoms/Combobox.svelte` (napr. „Main carrier – SA850“). Bez príčiny sa nedá uložiť.
- Ak príčina prestane byť kandidátom, závislý riadok sa odškrtne.
- `isMissingOtherComponentScrap` a zod `superRefine` pre scrap režim nahradí kontrola platnej príčiny (rovnaká serverová kontrola ako v 02).

## Akceptačné kritériá

- [x] Checkbox sa zobrazí len pri existencii aspoň jedného kandidáta.
- [x] Pri jednom kandidátovi sa uloží jeho kód bez výberu.
- [x] Pri viacerých kandidátoch sa bez výberu príčiny nedá uložiť, po výbere sa uloží kód zvolenej príčiny.
- [x] Zrušenie dôvodu príčiny odškrtne závislé riadky.
- [x] Testy, `npm run check` a `npm run test` prechádzajú.

## Comments
