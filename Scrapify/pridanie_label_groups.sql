BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Part] DROP CONSTRAINT [Part_processId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Part] DROP CONSTRAINT [Part_projectId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Part] DROP COLUMN [processId],
[projectId];
ALTER TABLE [dbo].[Part] ADD [description] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[PartGroup] ADD [isRebuild] BIT NOT NULL CONSTRAINT [PartGroup_isRebuild_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[Project] DROP COLUMN [qadExport];

-- AlterTable
ALTER TABLE [dbo].[ScrapRecord] DROP CONSTRAINT [DF_ScrapRecord_QADExported];
ALTER TABLE [dbo].[ScrapRecord] ALTER COLUMN [QADExported] BIT NULL;
ALTER TABLE [dbo].[ScrapRecord] ADD CONSTRAINT [ScrapRecord_QADExported_df] DEFAULT 0 FOR [QADExported], CONSTRAINT [ScrapRecord_quantity_df] DEFAULT 1 FOR [quantity];
ALTER TABLE [dbo].[ScrapRecord] ADD [dmc] NVARCHAR(128) NOT NULL,
[isRebuild] BIT NOT NULL CONSTRAINT [ScrapRecord_isRebuild_df] DEFAULT 0,
[partGroupId] INT NOT NULL,
[replacementPartId] INT;

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScrapRecord_dmc_idx] ON [dbo].[ScrapRecord]([dmc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScrapRecord_partGroupId_idx] ON [dbo].[ScrapRecord]([partGroupId]);

-- AddForeignKey
ALTER TABLE [dbo].[ScrapRecord] ADD CONSTRAINT [ScrapRecord_replacementPartId_fkey] FOREIGN KEY ([replacementPartId]) REFERENCES [dbo].[Part]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ScrapRecord] ADD CONSTRAINT [ScrapRecord_partGroupId_fkey] FOREIGN KEY ([partGroupId]) REFERENCES [dbo].[PartGroup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

