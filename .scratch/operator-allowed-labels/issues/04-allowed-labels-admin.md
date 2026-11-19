# 04 – Výber allowed labels v dialógu a štítky na karte

Status: done
Rodič: [spec.md](../spec.md)
Blokované: [01](01-schema.md), [03](03-edit-operator-dialog.md)

## Čo postaviť

- **`load`:** operátori s `hasLabelRestriction` a `allowedLabels: { id, code, vProject }` a zoznam všetkých `LabelGroup` (`id`, `code`, `vProject`).
- **Zod:** rozšíriť `updateOperatorSchema` o `hasLabelRestriction` (boolean preprocess ako pri iných checkboxoch) a `allowedLabelIds: number[]`.
- **`updateOperator`:**
  - overí, že všetky `allowedLabelIds` existujú (inak 400),
  - v jednom `update` zapíše meno, `cardId`, príznak a `allowedLabels: { set: [...] }`,
  - pri `hasLabelRestriction = false` sa výber masiek aj tak uloží (zachová sa).
- **Dialóg:**
  - prepínač **Všetky masky** (`!hasLabelRestriction`); keď je zapnutý, zoznam je neaktívny,
  - checkboxy `$lib/components/ui/checkbox` zoskupené podľa `vProject`, pri každom projekte „vybrať všetky / zrušiť“,
  - textový filter podľa `code` (skontrolovať `fuzzyPattern` v `$lib/utils`),
  - quantity scrap labely rozlíšené štítkom.
- **Karta operátora:** štítky „Všetky masky“, „Žiadna maska“ alebo projekty s počtom, napr. „X540 · 3 masky“.

## Akceptačné kritériá

- [x] Priradenie a odobratie masiek sa uloží a po otvorení dialógu sa načíta.
- [x] „Vybrať všetky“ označí všetky masky projektu (aj tie odfiltrované) a „zrušiť“ ich odznačí.
- [x] Neexistujúce `allowedLabelIds` vrátia 400 bez zápisu.
- [x] Karta zobrazuje správny štítok vo všetkých troch stavoch.
- [x] Iba sémantické tokeny, žiadne priame farby, funkčné na mobile.
- [x] Testy akcie s mockovaným Prisma klientom.
- [x] `npm run check` a `npm run test` prejdú.

## Comments

- Implementované. „Všetky masky“ je `Checkbox` (projekt nemá switch komponent). Namiesto filtra podľa `code` je filter podľa projektu cez `Combobox` (rozhodnutie používateľa). Mobil nebol overený v prehliadači.
