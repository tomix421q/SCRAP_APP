BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Project] DROP COLUMN [qadExport];

-- AlterTable
ALTER TABLE [dbo].[ScrapRecord] DROP COLUMN [QADExported];

-- CreateTable
CREATE TABLE [dbo].[PartGroup] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(64) NOT NULL,
    [processId] INT NOT NULL,
    [projectId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PartGroup_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PartGroup_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PartGroup_name_projectId_processId_key] UNIQUE NONCLUSTERED ([name],[projectId],[processId])
);

-- CreateTable
CREATE TABLE [dbo].[LabelGroup] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(64) NOT NULL,
    [processId] INT NOT NULL,
    [projectId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [LabelGroup_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [LabelGroup_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LabelGroup_code_projectId_processId_key] UNIQUE NONCLUSTERED ([code],[projectId],[processId])
);

-- CreateTable
CREATE TABLE [dbo].[_PartToPartGroup] (
    [A] INT NOT NULL,
    [B] INT NOT NULL,
    CONSTRAINT [_PartToPartGroup_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateTable
CREATE TABLE [dbo].[_LabelGroupToPartGroup] (
    [A] INT NOT NULL,
    [B] INT NOT NULL,
    CONSTRAINT [_LabelGroupToPartGroup_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PartGroup_processId_idx] ON [dbo].[PartGroup]([processId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PartGroup_projectId_idx] ON [dbo].[PartGroup]([projectId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LabelGroup_processId_idx] ON [dbo].[LabelGroup]([processId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LabelGroup_projectId_idx] ON [dbo].[LabelGroup]([projectId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_PartToPartGroup_B_index] ON [dbo].[_PartToPartGroup]([B]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_LabelGroupToPartGroup_B_index] ON [dbo].[_LabelGroupToPartGroup]([B]);

-- AddForeignKey
ALTER TABLE [dbo].[PartGroup] ADD CONSTRAINT [PartGroup_processId_fkey] FOREIGN KEY ([processId]) REFERENCES [dbo].[Process]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PartGroup] ADD CONSTRAINT [PartGroup_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LabelGroup] ADD CONSTRAINT [LabelGroup_processId_fkey] FOREIGN KEY ([processId]) REFERENCES [dbo].[Process]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LabelGroup] ADD CONSTRAINT [LabelGroup_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[_PartToPartGroup] ADD CONSTRAINT [_PartToPartGroup_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[Part]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_PartToPartGroup] ADD CONSTRAINT [_PartToPartGroup_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[PartGroup]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_LabelGroupToPartGroup] ADD CONSTRAINT [_LabelGroupToPartGroup_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[LabelGroup]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_LabelGroupToPartGroup] ADD CONSTRAINT [_LabelGroupToPartGroup_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[PartGroup]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

