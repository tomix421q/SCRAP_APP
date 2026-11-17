# 04 – Príznak part group: nemôže byť main reason

Spec: [../spec.md](../spec.md)
Závisí od: [01](01-schema-admin-flag.md), [02](02-rebuild-cause-code.md)

Status: done

## Problém

Nie každá rebuild part group má Other component scrap code (a niektoré ho nikdy mať nebudú). Ak na nej operator zvolí main reason, ostatným part groups sa nemá aký kód zapísať. Takéto part groups preto nesmú byť príčinou rebuildu. Stále sa však zapisujú: keď je príčinou iná part group, označia sa ako iný komponent (operator ich môže odškrtnúť).

Príznak je zámerne explicitný, nie odvodený z chýbajúceho kódu. Zabudnutý kód tak ostane viditeľný (červená hláška „kontaktuj inžiniera“) a nezmení sa potichu na part group, na ktorej sa nedá zvoliť dôvod.

## Čo

- `PartGroup.cannotBeMainReason Boolean @default(false)` v `schema.prisma` + generovanie klienta. `db push` robí používateľ po zálohe.
- Admin `partgroups`: nepovinný checkbox „Cannot be main reason“. Dá sa zvoliť iba pri zaškrtnutom „Rebuild group“ (inak je nedostupný). Uloží sa pri vytvorení aj úprave a úprava ho nevymaže.
- Admin server: pri nerebuild part group sa príznak vždy uloží ako `false`. Rebuild part group s príznakom **nemusí mať** Other component scrap code (výnimka z tiketu 01); kód na nej ostáva voliteľný, lebo v scrap režime môže byť príčinou.
- Rebuild (`ScrapManager`, `Rebuild.svelte`): part group s príznakom nemá combobox s dôvodom ani „Iný variant“, namiesto nich krátka poznámka, že nemôže byť príčinou. Ostáva rebuild part group: keď je príčinou iná part group, označí sa ako iný komponent (tiket 02) a operator to môže odškrtnúť.
- Scrap režim sa nemení.
- `saveScrap`: v rebuilde server odmietne (400) riadok s príznakom, ktorý má `selectedScrapCode` alebo `isOtherVariant`, a príčinu s príznakom.

## Rozhodnutia

- Príznak je explicitný, nie odvodený z chýbajúceho kódu (pozri Problém).
- „Iný variant“ sa pri part group s príznakom skrýva spolu s dôvodom.
- Label, kde majú príznak všetky rebuild part groups, sa nekontroluje: je to konfiguračná chyba inžiniera, ktorá sa prejaví pri prvom teste.
- ADR sa nepíše (zmena je ľahko vratná).

## Akceptačné kritériá

- [x] Príznak sa uloží pri vytvorení aj úprave part group.
- [x] Rebuild part group s príznakom sa uloží aj bez Other component scrap code.
- [x] Príznak sa nedá zvoliť pri nerebuild part group a server ho pri nej uloží ako `false`.
- [x] V rebuilde sa pri part group s príznakom nezobrazí combobox s dôvodom ani „Iný variant“.
- [x] Part group s príznakom sa po zvolení main reason inde označí ako iný komponent.
- [x] Server odmietne dôvod, iný variant alebo príčinu na part group s príznakom v rebuilde.
- [x] Testy (admin akcie, `saveScrap`, `ScrapManager`), `npm run check` a `npm run test` prechádzajú.

## Comments
