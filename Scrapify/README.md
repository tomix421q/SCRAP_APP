# Prisma commands

- Run the initial migration to set up your database schema.
- Use the following commands for ongoing database management:
  - `npx prisma migrate dev` for development migrations.
  - `npx prisma migrate reset` to reset the database.
  - `npx prisma migrate deploy` to apply migrations in production.
  - `npx prisma migrate status` to check migration status.
  - `npx prisma db pull` to sync your Prisma schema with the database.
  - `npx prisma db push` to push schema changes to the database.

# Adjustments


## Check Status

- [x] Move operator login to main page
- [x] Add to DB for scrap record description option
- [x] Filter project, process, part number, scrap code, date from-to
- [x] Add possibility to write decimal numbers to quantity
- [x] Facilitate choice of part number when writing scrap
- [x] Add ability to remove items in admin panel
