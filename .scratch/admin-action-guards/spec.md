# Kontrola roly vo form actions admin rout

Status: open

## Problém

Prístup do `/admin` kontroluje iba `load` v `(Admin)/admin/+layout.server.ts`. Pri form actions sa layout `load` nespúšťa. Akcie admin rout (`label-part`, `newpart`, `newscrapcode`, `partgroups`, `users`) preto zapíšu do DB aj pri priamom POST bez prihlásenia alebo s rolou USER.

## Riešenie

- Vo všetkých akciách admin rout použiť zdieľanú funkciu `requireRole(event, roles)` z `$lib/utils`, ktorú zavádza `.scratch/operator-allowed-labels/spec.md`.
- Povolené roly: ADMIN a MODERATOR (bez zmeny oproti dnešnému layoutu).
- Bez prihlásenia vráti 401, s nepovolenou rolou 403.
- Po prevedení `partgroups` na `requireRole` zmazať `hasRoleServer` zo `serverHelp.ts` (robí to isté ako `requireRole`). Zoznam rol brať z `ADMIN_PANEL_ROLES` v `$lib/utils/adminAccess`.

## Akceptačné kritériá

- [ ] Každá akcia v `(Admin)/admin/**/+page.server.ts` volá `requireRole` ako prvý krok.
- [ ] Priamy POST bez prihlásenia vráti 401, s rolou USER alebo ENGINEER vráti 403 (okrem `operatorregister`).
- [ ] Testy s mockovaným klientom aspoň pre jednu akciu každej routy.
- [ ] `npm run check` prejde.

## Závislosti

- Najprv musí byť hotové `operator-allowed-labels` (zavádza `requireRole`).
