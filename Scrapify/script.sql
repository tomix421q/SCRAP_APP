BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[_PartGroupToScrapCode] (
    [A] INT NOT NULL,
    [B] INT NOT NULL,
    CONSTRAINT [_PartGroupToScrapCode_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_PartGroupToScrapCode_B_index] ON [dbo].[_PartGroupToScrapCode]([B]);

-- AddForeignKey
ALTER TABLE [dbo].[_PartGroupToScrapCode] ADD CONSTRAINT [_PartGroupToScrapCode_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[PartGroup]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_PartGroupToScrapCode] ADD CONSTRAINT [_PartGroupToScrapCode_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[ScrapCode]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

