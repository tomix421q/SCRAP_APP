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
