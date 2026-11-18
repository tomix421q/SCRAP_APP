# 02 – Rebuild: kód príčiny pre pridružené part groups

Spec: [../spec.md](../spec.md)
Závisí od: [01](01-schema-admin-flag.md)

## Čo

- `ScrapRowState.otherComponentCauseGroupId: number | null`.
- Checkbox „Iný komponent“ sa zobrazí až po zvolení main reason, pri všetkých ostatných part groups. Rebuild part groups sa zaškrtnú automaticky (príčina = part group s main reason), ostatné ručne, všetky sa dajú odškrtnúť.
- Ak part group s main reason nemá Other component scrap code: `canSubmit = false` + hláška „Part group X nemá nastavený kód pre iný komponent, kontaktuj inžiniera“.
- Zrušenie alebo zmena main reason na iný variant odškrtne závislé riadky.
- `saveScrap`: overenie príčiny (iná part group v payloade, má vybraný dôvod, má Other component scrap code v DB), inak 400. Zápis `scrapCode` a `scrapCodeDescription` z DB, hodnoty z klienta sa ignorujú. `isOtherComponent = true` ostáva.

## Akceptačné kritériá

- [x] Rebuild s main reason na Main carrier uloží pridruženým part groups kód a popis z Other component scrap code Main carriera.
- [x] Odškrtnutá part group sa neuloží.
- [x] Bez príznaku na part group s main reason sa uložiť nedá (klient aj server).
- [x] Podvrhnutý kód z klienta sa ignoruje.
- [x] Testy (Seam 1 a 3 zo specu), `npm run check` a `npm run test` prechádzajú.

## Comments
