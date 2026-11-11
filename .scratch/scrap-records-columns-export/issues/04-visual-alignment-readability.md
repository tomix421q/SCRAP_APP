# 04 – Vizuálne zjednotenie a čitateľnosť tabuľky

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [01](01-shared-filters-new-columns.md)

## Čo postaviť

- **Zjednotenie so štýlom aplikácie:**
  - formulár filtrov → `formNormalize`, kontajner tabuľky → `listNormalize`,
  - hlavička tabuľky ako v ostatných tabuľkách (`bg-chart-4/40`, `text-chart-1`),
  - všetky priame farby (`white/*` a pod.) nahradiť sémantickými tokenmi (`border-border`, `bg-card/*`, `bg-muted/*`, `text-muted-foreground`),
  - rozloženie filtrov (fieldsety, Combobox) ostáva rovnaké.
- **Skupiny stĺpcov:** prvý stĺpec každej skupiny z definície stĺpcov má `border-l-2 border-border`. Hlavička ostáva jednoúrovňová.
- **Prilepenie:** kontajner `max-h-[70vh]` s vlastným vertikálnym aj horizontálnym scrollom; hlavička `sticky top-0`; ID a DMC `sticky left-*` s nepriehľadným pozadím z tokenov. Stránkovanie pod kontajnerom.
- **Hustota:**
  - hlavička `text-xs`/`text-sm`, uppercase, `tracking-wide`,
  - menší vertikálny padding buniek,
  - ID a Quantity zarovnané doprava s `tabular-nums`,
  - Created at ako dátum a pod ním čas (`text-xs text-muted-foreground`).
- **Štítky** (existujúci `ui/badge`, nový atóm nevzniká):
  - Type: Scrap `outline`, Rebuild `chart-warning`, Quantity scrap `chart-2`,
  - Other component nenápadný (`outline` + `text-muted-foreground`),
  - Other variant `primary`,
  - „No“ sa nezobrazuje; Replacement part ako text alebo „—“.
- **Mobil:** iba vodorovný scroll s prilepenými ID a DMC.

## Akceptačné kritériá

- [x] Na stránke nie sú priame farby (`white/*`, `gray-*` a pod.), iba sémantické tokeny.
- [x] Hlavička ostáva viditeľná pri scrollovaní nadol, ID a DMC pri scrollovaní do strany, cez prilepené bunky nepresvitá obsah.
- [x] Štítky podľa mapovania vyššie; „No“ sa nikde nevypisuje.
- [x] Ručne overené používateľom na desktope aj na úzkom displeji (`run` skill alebo dev server).
- [x] `bun run check` prechádza.
