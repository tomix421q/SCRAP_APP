/*
  Warnings:

  - You are about to drop the column `hallName` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `processName` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `projectName` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `hallId` on the `Project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `Part` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hallId` to the `Process` table without a default value. This is not possible if the table is not empty.
  - Made the column `processId` on table `ScrapCode` required. This step will fail if there are existing NULL values in that column.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Project] DROP CONSTRAINT [Project_hallId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Part] DROP COLUMN [hallName],
[processName],
[projectName];
ALTER TABLE [dbo].[Part] ADD [projectId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Process] ADD [hallId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Project] DROP COLUMN [hallId];

-- AlterTable
ALTER TABLE [dbo].[ScrapCode] ALTER COLUMN [processId] INT NOT NULL;

-- CreateIndex
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_name_key] UNIQUE NONCLUSTERED ([name]);

-- AddForeignKey
ALTER TABLE [dbo].[Process] ADD CONSTRAINT [Process_hallId_fkey] FOREIGN KEY ([hallId]) REFERENCES [dbo].[Hall]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Part] ADD CONSTRAINT [Part_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
