# Bug: úprava skupiny dielov zmaže priradené party

Status: fixed (čaká na commit a nasadenie)

## Problém

Pri úprave `PartGroup` v `/admin/partgroups` sa skupine niekedy zmazali všetky priradené party (`materials`). Scrap kódy ostali. Formulár party ďalej zobrazoval, takže moderátor nič nespozoroval. Prišiel na to až pri ďalšom otvorení skupiny.

## Kedy nastane

Všetky podmienky naraz:

1. Stránka je otvorená **bez filtra vProject** alebo s filtrom na iný projekt, než má upravovaná skupina.
2. Moderátor klikne na **Edit**. Formulár prepne filter na projekt skupiny (`goto` s `?vProject=`).
3. Moderátor **nezmení žiadny part slot** a uloží formulár, napr. po zmene názvu, interface name alebo fotky.

Ak bol filter už nastavený na projekt skupiny, alebo moderátor pred uložením zmenil niektorý part, k chybe nedošlo. Preto to vyzeralo náhodne. S nahrávaním fotky to nesúvisí, len sa to pri ňom často stretlo s podmienkami vyššie.

## Príčina

V `Scrapify/src/routes/(Admin)/admin/partgroups/+page.svelte` sa zoznam partov na odoslanie (`selectedPartIds`) automaticky počíta z políčok formulára (`partSlots`, `$derived`). Efekt, ktorý synchronizuje filter vProject s URL, robil `selectedPartIds = []` **mimo** podmienky `if (!idEditGroup)`, teda aj v edit móde. V Svelte 5 takýto zápis prepíše `$derived` hodnotu. Prázdne pole potom ostane, kým sa `partSlots` nezmení.

Výsledok: Combobox zobrazoval party z `partSlots`, ale `use:enhance` odoslal `partNumbers=[]`. Action `editGroup` potom spravila `materials.deleteMany` a znovu vytvorila prázdny zoznam. Scrap kódy sa v edit móde takto nenulovali, preto zostali.

## Oprava

- Odstránené všetky ručné zápisy do `selectedPartIds` a `selectedScrapCodes` vo vProject efekte aj v edit efekte. Obe hodnoty sa teraz vždy odvodzujú zo slotov.
- V edit efekte sa sloty nastavujú priamo (`partSlots = …`, `scrapSlots = …`).
- Server (`+page.server.ts`) sa nemenil.

## Overenie

- Dočasný test napodobňujúci reťazec stavov stránky: s chybou zlyhal (`[]` namiesto `['P-1','P-2']`), po oprave prešiel, a tak to vyšlo zakaždým z troch behov. Po overení bol zmazaný.
  - Pozor pri ďalšom ladení: vitest beží s `environment: 'node'`, takže `.svelte.ts` kompiluje ako serverový kód, kde `$derived` nie je reaktívny. Na test rún treba vlastné prostredie s `viteEnvironment: 'client'`.
- `bun run check`: 0 chýb. `bun run test`: 28/28 prešlo.
- Manuálne (používateľ): reprodukované na produkcii na testovacej skupine. S opravou ostanú party zachované.

## Otvorené body

- **Regresný test:** projekt nemá setup na komponentové testy (render `+page.svelte` s mockmi `$app/state`, `$app/navigation`, `$app/forms`). Test, ktorý by chybu natrvalo podchytil, preto zatiaľ neexistuje. Zavedenie navrhnúť samostatne.
- **Dáta v produkcii:** skupiny upravené za vyššie uvedených podmienok mohli prísť o `materials`. Treba ich nájsť dotazom len na čítanie (`PartGroup` bez naviazaných materiálov) a party doplniť ručne alebo zo zálohy. Robí používateľ.
- **Možná poistka na serveri (návrh, neaplikované):** `editGroup` by mohla odmietnuť update, ktorý by vymazal všetky materiály skupine, ktorá ich mala, alebo by si to aspoň vyžiadala potvrdiť.
