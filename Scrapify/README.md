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

1 - move operator login to main page [done]
2 - add to db for scrap record description option [done]
3 - filter project,process,partNumber,scrapCode,data from-to [done]

4 - add -> possibility write decimal numbers to quantity [done]
5 - facilitate choice part number in write scrap [done]
6 - add -> remove items in admin pannel [done]
