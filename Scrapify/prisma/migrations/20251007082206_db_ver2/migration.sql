BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Operator] (
    [id] INT NOT NULL IDENTITY(1,1),
    [createdBy] NVARCHAR(1000) NOT NULL,
    [fullName] NVARCHAR(1000) NOT NULL,
    [cardId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Operator_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Operator_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Operator_cardId_key] UNIQUE NONCLUSTERED ([cardId])
);

-- CreateTable
CREATE TABLE [dbo].[ActivityLogs] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000),
    [operatorId] INT,
    [action] NVARCHAR(1000) NOT NULL,
    [entityType] NVARCHAR(1000) NOT NULL,
    [entityId] INT,
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [ActivityLogs_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ActivityLogs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[ActivityLogs] ADD CONSTRAINT [ActivityLogs_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityLogs] ADD CONSTRAINT [ActivityLogs_operatorId_fkey] FOREIGN KEY ([operatorId]) REFERENCES [dbo].[Operator]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
