# 07 – Kompaktný panel filtrov

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [04](04-visual-alignment-readability.md)
Robí sa spolu s: [06](06-active-filter-chips-loading.md)

## Čo postaviť

Lišta kategórií, formulár filtrov, akcie a štítky aktívnych filtrov (06) sa zlúčia do jednej kompaktnej karty nad tabuľkou namiesto dvoch samostatných blokov.

- **Riadok 1:** tlačidlá kategórií (nenápadné počty).
- **Filtre v štyroch pomenovaných stĺpcoch rovnakej šírky** (na menších displejoch 2 alebo 1 stĺpec):
  - **Part:** Project, Part group, Scrap code,
  - **Record:** Label, Created by, Replacement part,
  - **Flags:** Other component, Other variant, QAD export,
  - **Created date:** Od, Do.
- **Spodná lišta:** vľavo štítky aktívnych filtrov (tiket 06), vpravo Clear, Apply a **Export (N) v pravom dolnom rohu**.
- Žiadne tlačidlo More filters: všetky filtre sú viditeľné, prehľadnosť zabezpečuje zoskupenie.
- Odpadne hlavička „Filter records“, pôvodné dva fieldsety a nadpis „… records“ nad tabuľkou.
- Polia sú nižšie (`h-9`), najviac 300 px široké, štýl ostáva tokenový. Správanie filtrov sa nemení: Apply/Enter aplikuje, výber projektu aplikuje hneď a vymaže Scrap code a Part group, Clear vymaže všetko.
- Rozloženie je odsúhlasené (variant „4 stĺpce podľa významu“; predchádzajúci variant „jeden riadok + More“ bol zamietnutý ako natlačený).

## Akceptačné kritériá

- [x] Kategórie, filtre, akcie a štítky sú v jednej karte; pôvodné samostatné bloky sú preč.
- [x] Filtre sú v štyroch skupinách Part / Record / Flags / Created date; Export je vpravo dole.
- [x] Všetky filtre fungujú ako predtým (URL, Apply, Clear, projekt).
- [x] Na úzkom displeji sa riadky zalomia bez vodorovného scrollu stránky.
- [x] `bun run check` a `bun run test` prechádzajú.
