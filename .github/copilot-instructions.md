## Kontext aplikácie a pravidlá pre Code Review

- **Typ projektu:** Ide o výhradne internú intranetovú/priemyselnú aplikáciu (beží v lokálnej firemnej sieti, žiadny verejný internet).
- **Pri hodnotení kódu (`code-review`) VŽDY vynechaj:**
  - Akékoľvek SEO odporúčania (meta tagy, sitemapy, SSR indexovanie, OpenGraph, sémantiku pre vyhľadávače).
  - Prehnané verejné bezpečnostné poučky (prísny verejný CSRF, striktné HTTPS/HSTS hlavičky, rate-limiting na IP), pokiaľ priamo neohrozujú integritu internej databázy.
- **Na čo sa pri hodnotení VÝHRADNE sústrediť:**
  - Korektné používanie Svelte 5 rún (`$state`, `$derived`, `$effect`, `$props`).
  - TypeScript typová bezpečnosť.
  - Správne ošetrenie asynchrónnych stavov a logické chyby pri zápise do databázy (Prisma).
- **Dalsie drobnosti**
  - Komunikuj v slovencine, ak je to možné.
  - Kod pis po anglicky aj komentare.
  - Pri novych konceptoch alebo pri `ako by sa dali robit veci/kod lepsie` vysvetluj a pytaj sa na nazor, ale nenavrhuj zmeny, ktore by mohli ohrozit funkcnost aplikacie.
  - Vzdy pri zmene vysvetli preco je to zmena a co to riesi, alebo co to zlepsuje.
  - V pripade otazok/zmenach sa vzdy pytaj na nazor a ako by to malo byt spravne.
