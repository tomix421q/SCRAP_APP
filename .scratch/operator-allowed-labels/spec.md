# Úprava operátorov a allowed labels (operatorregister)

Status: open

## Problém

Na routě `/admin/operatorregister` sa operátor dá iba vytvoriť a zmazať. Preklep v mene alebo novú kartu treba riešiť zmazaním a novým vytvorením.

Každý operátor zároveň môže skenovať akýkoľvek label (DMC masku `LabelGroup`) z akéhokoľvek projektu. Operátor, ktorý robí napr. na projekte X540 iba na jednej maske (napr. X4), by nemal môcť zaznamenať scrap na iné masky.

Správu operátorov dnes robí iba ADMIN a MODERATOR. Majú ju robiť aj inžinieri (ENGINEER).

## Riešenie

1. Operátorovi sa dá na admin stránke upraviť meno a `cardId`.
2. Operátorovi sa dajú priradiť **allowed labels**, teda konkrétne masky (`LabelGroup`), ktoré smie skenovať.
3. Skenovacia stránka `scandmclabel` na serveri odmietne scan aj uloženie payloadu pre masku, ktorú operátor nemá povolenú.
4. Na `/admin/operatorregister` má prístup aj ENGINEER (iba na túto routu).

## Pravidlá allowed labels

- Obmedzenie platí **iba pre `Operator`**. User s účtom (USER, ENGINEER, MODERATOR, ADMIN), ktorý skenuje svojou kartou, nie je obmedzený.
- `Operator.hasLabelRestriction`:
  - `false` (predvolené): operátor smie všetky masky. Takto ostanú všetci existujúci operátori po nasadení.
  - `true`: operátor smie iba priradené allowed labels. Ak nemá priradený žiadny, nesmie nič.
- Príznak rieši situáciu, keď sa zmaže maska, ktorá bola jediným allowed labelom operátora. Operátor ostane obmedzený (nesmie nič) a nestane sa neobmedzeným.
- Väzba je priamo na konkrétny `LabelGroup` (nie na projekt). Projekt slúži v UI iba na zoskupenie a hromadný výber.
- Obmedzenie platí pre bežné labely (scrap, rebuild) aj pre quantity scrap labely.
- Ak má card ID operátor aj user, platí operátor (rovnaké pravidlo ako v `findCardHolder`). Obmedzenie sa teda uplatní.

## Zmena schémy

Iba návrh. Úpravu spravím v `schema.prisma`, `db push` spúšťa výhradne používateľ po zálohe.

```prisma
model Operator {
  id                  Int            @id @default(autoincrement())
  createdBy           String
  fullName            String
  cardId              Int            @unique
  createdAt           DateTime       @default(dbgenerated("GETDATE()"))
  updatedAt           DateTime?      @updatedAt
  hasLabelRestriction Boolean        @default(false)
  allowedLabels       LabelGroup[]   @relation("OperatorAllowedLabels")
  operatorLogs        ActivityLogs[]
}

model LabelGroup {
  // ...existing fields
  allowedOperators Operator[] @relation("OperatorAllowedLabels")
}
```

- Implicitná many-to-many tabuľka (`_OperatorAllowedLabels`). Pri zmazaní operátora alebo masky sa väzba zmaže kaskádovo.
- `updatedAt` je nullable, lebo existujúce riadky hodnotu nemajú.

## Prístup a oprávnenia

| Rola | `/admin/operatorregister` | ostatné `/admin/*` |
|---|---|---|
| ADMIN, MODERATOR | všetko | všetko (bez zmeny) |
| ENGINEER | všetko: vytvoriť, upraviť, allowed labels, zmazať | bez prístupu |
| USER | bez prístupu | bez prístupu |

- `(Admin)/admin/+layout.server.ts`: ENGINEER prejde iba na `/admin/operatorregister`. Na `/admin` ho presmeruje na `/admin/operatorregister`, inde na `/`.
- Nová zdieľaná funkcia v `$lib/utils` (napr. `requireRole(event, roles)`) vráti 401 pre neprihláseného a 403 pre nepovolenú rolu. Musí byť typovo bezpečná a generická.
- `requireRole` sa volá na začiatku **každej** akcie routy (`createOperator`, `updateOperator`, `deleteOperator`). Guard v layout `load` form actions nechráni.
- Ostatné admin routy rieši samostatná špecifikácia `.scratch/admin-action-guards/spec.md`.

## Admin UI (`/admin/operatorregister`)

### Karta operátora v zozname

- Pribudne tlačidlo **Edit** (vedľa `DeleteBtn`).
- Allowed labels v skratke:
  - `hasLabelRestriction = false`: štítok „Všetky masky“.
  - inak štítky projektov s počtom, napr. „X540 · 3 masky“. Ak nemá žiadnu masku, štítok „Žiadna maska“.

### Dialóg úpravy

- Postavený na existujúcom `$lib/components/ui/dialog` (nie nový atom). Obsah dodržiava `cardNormalize` a vstupy `inputNormalize`.
- Polia:
  - **Name**: rovnaká validácia ako pri vytvorení (5 až 255 znakov).
  - **Card ID**: iba číslice, kladné celé číslo, unikátne. Pri kolízii (`P2002`) sa zobrazí zrozumiteľná chyba.
  - **Všetky masky**: prepínač, ktorý zodpovedá `!hasLabelRestriction`. Keď je zapnutý, zoznam masiek je neaktívny.
  - **Zoznam masiek**: checkboxy (`$lib/components/ui/checkbox`) zoskupené podľa `vProject`. Pri každom projekte je „vybrať všetky / zrušiť“ a nad zoznamom textový filter podľa `code`. Quantity scrap labely sú v zozname tiež (rozlíšené štítkom).
- Pod poľom Card ID je upozornenie: staré scrap recordy si ponechajú staré card ID v `createdBy` a so zmenou sa neprepíšu.
- Ukladá sa cez form action `updateOperator` s `use:enhance`. Výsledok sa zobrazí cez `ResultInfo`.
- Iba sémantické tokeny témy, žiadne priame farby.

### Server

- `load` doplní k operátorom `allowedLabels: { id, code, vProject }` a zoznam všetkých `LabelGroup` (`id`, `code`, `vProject`) pre dialóg.
- `updateOperator`:
  - validácia cez zod schému v `$lib/utils/zod` (`id`, `fullName`, `cardId`, `hasLabelRestriction`, `allowedLabelIds: number[]`),
  - overí, že všetky `allowedLabelIds` existujú,
  - zapíše meno, `cardId`, príznak a `allowedLabels: { set: [...] }` v jednom `update`,
  - pri `hasLabelRestriction = false` sa allowed labels uložia tiež (zachovajú sa pre neskoršie zapnutie obmedzenia),
  - zapíše `writeToLogger` s akciou `EDIT`, `entityType: 'Operator'`.
- Odstrániť `any` v `catch` blokoch tejto routy.

## Skenovacia stránka (`scandmclabel`)

Spoločná serverová funkcia, napr. `src/lib/server/operatorLabelAccess.ts`:

```ts
/** Labels the card holder may scan; `null` means no restriction. */
getAllowedLabelIds(cardId: number): Promise<Set<number> | null>
```

- User s účtom alebo operátor s `hasLabelRestriction = false` vráti `null`.
- Inak vráti množinu ID allowed labels (aj prázdnu).

### Kontrola

| Miesto | Zmena |
|---|---|
| `scanDmc` | Formulár v `Scan.svelte` pošle aj `operator` (dnes ho neposiela). Po nájdení masky sa overí právo. |
| `saveScrap` | Pred zápisom sa overí právo na masku, ktorá zodpovedá `dmc`. |
| `saveQuantityScrap` | Pred zápisom sa overí právo na `labelGroupId`. |
| zoznam quantity scrap labelov | Nová akcia (napr. `allowedQuantityScrapLabels`) vráti po prihlásení operátora iba povolené labely. `Scan.svelte` zobrazí tento zoznam namiesto `data.quantityScrapLabels`. |

- Chyba pri nepovolenej maske: `fail(403, …)` s textom
  „Operátor {meno} nemá povolenú masku {code} ({vProject}). Kontaktujte správcu.“
- Kontrola pri uložení je nutná aj vtedy, keď UI scan už odmietlo, aby sa obmedzenie nedalo obísť priamym POST.

## Slovník

`GLOSSARY.md`: nový pojem **Allowed label** (v sekcii Ľudia).

## Akceptačné kritériá

- [ ] ADMIN, MODERATOR aj ENGINEER upravia meno a card ID operátora. Duplicitné card ID vráti chybu a nič sa nezapíše.
- [ ] ENGINEER sa nedostane na iné admin routy (presmerovanie) a z `/admin` sa dostane na operatorregister.
- [ ] Priamy POST na akcie operatorregister bez prihlásenia vráti 401, s rolou USER vráti 403.
- [ ] Existujúci operátori po nasadení skenujú bez zmeny (`hasLabelRestriction = false`).
- [ ] Obmedzený operátor naskenuje povolenú masku, nepovolená skončí chybou 403 s názvom masky a projektu.
- [ ] Obmedzený operátor bez masiek nesmie nič, ani po zmazaní jeho poslednej masky.
- [ ] Obmedzený operátor vidí iba povolené quantity scrap labely a uloženie nepovoleného skončí chybou 403.
- [ ] User s účtom skenuje bez obmedzenia.
- [ ] Zmena sa zapíše do `ActivityLogs` (`EDIT`, `Operator`).
- [ ] Testy s mockovaným Prisma klientom: `getAllowedLabelIds` (user, neobmedzený, obmedzený prázdny, obmedzený s maskami) a 403 v `scanDmc`, `saveScrap` a `saveQuantityScrap`.
- [ ] `npm run check` prejde.

## Mimo rozsahu

- Deaktivácia operátora (`isActive`). Mazanie ostáva trvalé.
- Obmedzenia pre userov s účtom.
- Prepisovanie `createdBy` v starých scrap records pri zmene card ID.
- Kontrola roly v akciách ostatných admin rout (samostatná špecifikácia `admin-action-guards`).
