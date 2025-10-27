# Adjustments

- add when click next page (in pagination) scroll top
- add some filter in admin parts etc.
- add feature in users (admin panel) to delete user
- make some improvment in CardID (landing) sometimes is problem with with login user (working only on reload page)
- toggle filter (in search)

## Check Status

- [x] create favorite process in create scrap
- [x] increase all forms
- [x] fixed bug in download scrap record csv when is selected in filters some process
- [x] allow operator make edit scrap record for 20min(like delete btn)
- [x] repair edit icon visual in search page
- [x] check in create scrap that operator exist
- [x] add user logs
- [x] operator in db
- [x] quantity info in search
- [x] Add edit choice
- [x] Move operator login to main page
- [x] Add to DB for scrap record description option
- [x] Filter project, process, part number, scrap code, date from-to
- [x] Add possibility to write decimal numbers to quantity
- [x] Facilitate choice of part number when writing scrap
- [x] Add ability to remove items in admin panel

# Prisma commands

- Run the initial migration to set up your database schema.
- Use the following commands for ongoing database management:
  - `npx prisma migrate dev` for development migrations.
  - `npx prisma migrate reset` to reset the database.
  - `npx prisma generate` generate client db code.
  - `npx prisma migrate deploy` to apply migrations in production.
  - `npx prisma migrate status` to check migration status.
  - `npx prisma db pull` to sync your Prisma schema with the database.
  - `npx prisma db push` to push schema changes to the database.
  - `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > initial_migration.sql`
