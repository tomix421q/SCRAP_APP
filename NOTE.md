// schema.prisma
generator client {
provider = "prisma-client-js"
}

datasource db {
provider = "postgresql"
url = env("DATABASE_URL")
}

model Hall {
id Int @id @default(autoincrement())
name String
description String? // voliteľný popis
projects Project[]
}

model Project {
id Int @id @default(autoincrement())
hallId Int
name String
description String?
hall Hall @relation(fields: [hallId], references: [id])
processes Process[]
}

model Process {
id Int @id @default(autoincrement())
projectId Int
name String
description String?
project Project @relation(fields: [projectId], references: [id])
parts Part[]
}

model Part {
id Int @id @default(autoincrement())
processId Int
partNumber String
side String // L/R alebo ENUM ak chceš
color String
process Process @relation(fields: [processId], references: [id])
scrapRecords ScrapRecord[]
scrapSummary ScrapSummary[]
}

model ScrapCode {
id Int @id @default(autoincrement())
code String @unique // napr. M01
name String
description String?
active Boolean @default(true)
scrapRecords ScrapRecord[]
scrapSummary ScrapSummary[]
}

model ScrapRecord {
id Int @id @default(autoincrement())
partId Int
scrapCodeId Int
quantity Int
createdAt DateTime @default(now())
createdBy String
part Part @relation(fields: [partId], references: [id])
scrapCode ScrapCode @relation(fields: [scrapCodeId], references: [id])

@@index([createdAt])
@@index([scrapCodeId])
@@index([partId])
}

<!-- model na scrap summary na den  -->

model ScrapSummary {
id Int @id @default(autoincrement())
partId Int
scrapCodeId Int
date DateTime // len dátum (bez času)
totalQty Int
part Part @relation(fields: [partId], references: [id])
scrapCode ScrapCode @relation(fields: [scrapCodeId], references: [id])

@@unique([partId, scrapCodeId, date]) // aby bol len jeden záznam za deň
@@index([date])
}

<!-- EXAMPLE
const today = new Date();
today.setHours(0, 0, 0, 0); // len dátum bez času

await prisma.scrapSummary.upsert({
  where: {
    partId_scrapCodeId_date: {
      partId: 12,
      scrapCodeId: 2,
      date: today,
    },
  },
  update: {
    totalQty: {
      increment: 3, // pripočítame nové kusy
    },
  },
  create: {
    partId: 12,
    scrapCodeId: 2,
    date: today,
    totalQty: 3, // prvý zápis pre dnešok
  },
}); -->

<!-- const summaryToday = await prisma.scrapSummary.findMany({
  where: {
    date: today,
  },
  include: {
    part: true,       // načíta info o diele
    scrapCode: true,  // načíta info o kóde chyby
  },
}); -->


<!-- const report = await prisma.scrapSummary.findMany({
  where: {
    date: today,
  },
  include: {
    part: {
      include: {
        process: {
          include: {
            project: {
              include: {
                hall: true,
              },
            },
          },
        },
      },
    },
    scrapCode: true,
  },
}); -->