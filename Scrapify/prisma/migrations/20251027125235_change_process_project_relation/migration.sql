/*
  Warnings:

  - You are about to drop the column `projectId` on the `Process` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Process] DROP CONSTRAINT [Process_projectId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Process] DROP COLUMN [projectId];

-- CreateTable
CREATE TABLE [dbo].[ProjectsOnProcess] (
    [projectId] INT NOT NULL,
    [processId] INT NOT NULL,
    [assignedAt] DATETIME2 NOT NULL CONSTRAINT [ProjectsOnProcess_assignedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjectsOnProcess_pkey] PRIMARY KEY CLUSTERED ([projectId],[processId])
);

-- AddForeignKey
ALTER TABLE [dbo].[ProjectsOnProcess] ADD CONSTRAINT [ProjectsOnProcess_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectsOnProcess] ADD CONSTRAINT [ProjectsOnProcess_processId_fkey] FOREIGN KEY ([processId]) REFERENCES [dbo].[Process]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
