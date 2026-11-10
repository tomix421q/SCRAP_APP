## UI komponenty a dizajn systém

- **Zákaz duplicity UI:** Nikdy nevytváraj nové inline tabuľky, karty, modaly ani selektory, ak už v projekte existuje riešenie.
- **Dostupné zdieľané komponenty:**
  - Výbery a selektory: VŽDY použi existujúci `$lib/components/atoms/Combobox.svelte`. Nevytváraj vlastné `<select>` ani nové comboboxy.
  - Karty a layout: Používaj výhradne štandardný kontajner zhodný s `$lib/components/...`.
- **Dizajnové pravidlá a Tailwind:**
  - NIKDY nepoužívaj náhodné priame farby (napr. `bg-blue-500`, `text-gray-400`, `border-zinc-700`).
  - VŽDY používaj sémantické tokeny z témy: `bg-card`, `bg-background`, `text-primary`, `text-muted-foreground`, `border-border`.
  - Pre formuláre a karty dôsledne zachovávaj triedy projektu: `cardNormalize`, `inputNormalize`.
- **Vytváranie nových univerzálnych komponentov:**
  - Ak chýba univerzálny komponent (napr. `Card.svelte`, `Table.svelte`), NEVYTVÁRAJ ho autonómne. Najprv navrhni riešenie v chate.
  - Univerzálne komponenty patria výhradne do `$lib/components/atoms/`. Pri návrhu zváž, či stačia čisté `$props()`, alebo je vhodnejšia kompozícia cez Svelte 5 snippets (`Snippet`, `{@render children()}`).
- **Zdieľané pomocné funkcie (`$lib/utils`):**
  - Pred písaním novej pomocnej logiky VŽDY najprv skontroluj `$lib/utils` (napr. `fuzzyPattern`, `convertTime`, `ErrorHandler`).
  - Ak máš návrh na zlepšenie existujúcej funkcie, najprv sa opýtaj a vysvetli dôvod.
  - Nové pomocné funkcie píš čisto, typovo bezpečne a genericky tak, aby boli prenositeľné do iných projektov.

## Kontext aplikácie a pravidlá pre Code Review

- **Typ projektu:** Ide o výhradne internú intranetovú/priemyselnú aplikáciu (beží v lokálnej firemnej sieti, žiadny verejný internet).
- **Pri hodnotení kódu (`code-review`) VŽDY vynechaj:**
  - Akékoľvek SEO odporúčania (meta tagy, sitemapy, SSR indexovanie, OpenGraph, robot sémantiku).
  - Prehnané verejné bezpečnostné poučky (striktný verejný CSRF, striktné HTTPS/HSTS hlavičky, rate-limiting na verejné IP), pokiaľ priamo neohrozujú integritu internej databázy.
- **Na čo sa pri hodnotení VÝHRADNE sústrediť:**
  - Korektné používanie Svelte 5 rún (`$state`, `$derived`, `$derived.by`, `$effect`, `$props`). Uprednostňuj `$derived` pred manuálnou synchronizáciou v `$effect`.
  - Striktná TypeScript typová bezpečnosť (odstraňovanie zbytočných `any`).
  - Správne ošetrenie asynchrónnych stavov a logické chyby pri zápise do databázy (Prisma).
- **Pravidlá komunikácie a workflow:**
  - Komunikuj výhradne v slovenčine (stručne, vecne, k veci).
  - Samotný kód, názvy premenných, typov a komentáre píš výhradne po anglicky.
  - Pri každej zmene stručne vysvetli, prečo sa robí a čo zlepšuje.
  - Pri nových konceptoch alebo refaktoringu sa najprv opýtaj na názor a navrhni smer, ale neaplikuj plošné zmeny, ktoré by mohli rozbiť funkčnosť aplikácie.

## Umiestnenie kódu a príkazy

- Samotná aplikácia, `package.json` a Prisma ležia v podpriečinku `Scrapify/`.
- VŠETKY terminálové príkazy (bun, testy, typecheck, prisma) VŽDY spúšťaj vnútri tohto podpriečinka:
  - napr. `cd Scrapify && bun run check`
  - napr. `cd Scrapify && bun run test`
- Všetky súbory kódu a komponentov hľadaj a upravuj v ceste `Scrapify/src/...`.

- **Špecifikácie (`/to-spec`) a tikety v `.scratch/`:** píš VŽDY po slovensky (názvy sekcií aj obsah). Kódové identifikátory (názvy modelov, polí, rút, príkazov) ostávajú v pôvodnom tvare.

- **Produkčná DB:** `Scrapify/.env` mieri na PRODUKČNÚ databázu (jediná dostupná). Claude NIKDY nespúšťa `prisma db push`, `migrate`, `db execute`, testy zapisujúce do DB ani skripty s zápisom proti nej. Schému iba upraví v `schema.prisma` a navrhne ju na schválenie; `db push` robí výhradne používateľ po zálohe. Povolené je čítanie, `bun run check` a testy s mockovaným Prisma klientom.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context domain docs use the root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.
