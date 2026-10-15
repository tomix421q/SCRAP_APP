BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[user] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [cardId] INT NOT NULL,
    [emailVerified] BIT NOT NULL,
    [image] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [user_role_df] DEFAULT 'USER',
    CONSTRAINT [user_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_email_key] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [user_cardId_key] UNIQUE NONCLUSTERED ([cardId])
);

-- CreateTable
CREATE TABLE [dbo].[session] (
    [id] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    [ipAddress] NVARCHAR(1000),
    [userAgent] NVARCHAR(1000),
    [userId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [session_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [session_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[account] (
    [id] NVARCHAR(1000) NOT NULL,
    [accountId] NVARCHAR(1000) NOT NULL,
    [providerId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [accessToken] NVARCHAR(1000),
    [refreshToken] NVARCHAR(1000),
    [idToken] NVARCHAR(1000),
    [accessTokenExpiresAt] DATETIME2,
    [refreshTokenExpiresAt] DATETIME2,
    [scope] NVARCHAR(1000),
    [password] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [account_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[verification] (
    [id] NVARCHAR(1000) NOT NULL,
    [identifier] NVARCHAR(1000) NOT NULL,
    [value] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2,
    [updatedAt] DATETIME2,
    CONSTRAINT [verification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Hall] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    CONSTRAINT [Hall_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Hall_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Project] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    CONSTRAINT [Project_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Project_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectsOnProcess] (
    [projectId] INT NOT NULL,
    [processId] INT NOT NULL,
    [assignedAt] DATETIME2 NOT NULL CONSTRAINT [ProjectsOnProcess_assignedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjectsOnProcess_pkey] PRIMARY KEY CLUSTERED ([projectId],[processId])
);

-- CreateTable
CREATE TABLE [dbo].[Process] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [hallId] INT NOT NULL,
    CONSTRAINT [Process_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Process_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Part] (
    [id] INT NOT NULL IDENTITY(1,1),
    [partNumber] NVARCHAR(1000) NOT NULL,
    [side] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    CONSTRAINT [Part_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Part_partNumber_key] UNIQUE NONCLUSTERED ([partNumber])
);

-- CreateTable
CREATE TABLE [dbo].[PartGroup] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(64) NOT NULL,
    [processId] INT NOT NULL,
    [projectId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PartGroup_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [isRebuild] BIT NOT NULL CONSTRAINT [PartGroup_isRebuild_df] DEFAULT 0,
    [interfaceName] NVARCHAR(1000) NOT NULL,
    [qadIdentity] NVARCHAR(1000),
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
CREATE TABLE [dbo].[ScrapCode] (
    [id] INT NOT NULL IDENTITY(1,1),
    [processId] INT NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [active] BIT NOT NULL CONSTRAINT [ScrapCode_active_df] DEFAULT 1,
    CONSTRAINT [ScrapCode_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ScrapRecord] (
    [id] INT NOT NULL IDENTITY(1,1),
    [dmc] NVARCHAR(128) NOT NULL,
    [partGroupId] INT NOT NULL,
    [scrapCodeId] INT,
    [isRebuild] BIT NOT NULL CONSTRAINT [ScrapRecord_isRebuild_df] DEFAULT 0,
    [replacementPartId] INT,
    [isOtherComponent] BIT NOT NULL CONSTRAINT [ScrapRecord_isOtherComponent_df] DEFAULT 0,
    [quantity] FLOAT(53) NOT NULL CONSTRAINT [ScrapRecord_quantity_df] DEFAULT 1,
    [description] NVARCHAR(1000),
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ScrapRecord_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [QADExported] BIT CONSTRAINT [ScrapRecord_QADExported_df] DEFAULT 0,
    CONSTRAINT [ScrapRecord_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ScrapSummary] (
    [id] INT NOT NULL IDENTITY(1,1),
    [partId] INT NOT NULL,
    [scrapCodeId] INT NOT NULL,
    [date] DATETIME2 NOT NULL,
    [totalQty] INT NOT NULL,
    CONSTRAINT [ScrapSummary_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ScrapSummary_partId_scrapCodeId_date_key] UNIQUE NONCLUSTERED ([partId],[scrapCodeId],[date])
);

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

-- CreateTable
CREATE TABLE [dbo].[_PartToPartGroup] (
    [A] INT NOT NULL,
    [B] INT NOT NULL,
    CONSTRAINT [_PartToPartGroup_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateTable
CREATE TABLE [dbo].[_PartGroupToScrapCode] (
    [A] INT NOT NULL,
    [B] INT NOT NULL,
    CONSTRAINT [_PartGroupToScrapCode_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
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
CREATE NONCLUSTERED INDEX [ScrapRecord_dmc_idx] ON [dbo].[ScrapRecord]([dmc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScrapRecord_createdAt_idx] ON [dbo].[ScrapRecord]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScrapRecord_partGroupId_idx] ON [dbo].[ScrapRecord]([partGroupId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScrapRecord_scrapCodeId_idx] ON [dbo].[ScrapRecord]([scrapCodeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScrapSummary_date_idx] ON [dbo].[ScrapSummary]([date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_PartToPartGroup_B_index] ON [dbo].[_PartToPartGroup]([B]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_PartGroupToScrapCode_B_index] ON [dbo].[_PartGroupToScrapCode]([B]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_LabelGroupToPartGroup_B_index] ON [dbo].[_LabelGroupToPartGroup]([B]);

-- AddForeignKey
ALTER TABLE [dbo].[session] ADD CONSTRAINT [session_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[account] ADD CONSTRAINT [account_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectsOnProcess] ADD CONSTRAINT [ProjectsOnProcess_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectsOnProcess] ADD CONSTRAINT [ProjectsOnProcess_processId_fkey] FOREIGN KEY ([processId]) REFERENCES [dbo].[Process]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Process] ADD CONSTRAINT [Process_hallId_fkey] FOREIGN KEY ([hallId]) REFERENCES [dbo].[Hall]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PartGroup] ADD CONSTRAINT [PartGroup_processId_fkey] FOREIGN KEY ([processId]) REFERENCES [dbo].[Process]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PartGroup] ADD CONSTRAINT [PartGroup_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LabelGroup] ADD CONSTRAINT [LabelGroup_processId_fkey] FOREIGN KEY ([processId]) REFERENCES [dbo].[Process]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LabelGroup] ADD CONSTRAINT [LabelGroup_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ScrapRecord] ADD CONSTRAINT [ScrapRecord_partGroupId_fkey] FOREIGN KEY ([partGroupId]) REFERENCES [dbo].[PartGroup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ScrapRecord] ADD CONSTRAINT [ScrapRecord_replacementPartId_fkey] FOREIGN KEY ([replacementPartId]) REFERENCES [dbo].[Part]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ScrapRecord] ADD CONSTRAINT [ScrapRecord_scrapCodeId_fkey] FOREIGN KEY ([scrapCodeId]) REFERENCES [dbo].[ScrapCode]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ScrapSummary] ADD CONSTRAINT [ScrapSummary_partId_fkey] FOREIGN KEY ([partId]) REFERENCES [dbo].[Part]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ScrapSummary] ADD CONSTRAINT [ScrapSummary_scrapCodeId_fkey] FOREIGN KEY ([scrapCodeId]) REFERENCES [dbo].[ScrapCode]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityLogs] ADD CONSTRAINT [ActivityLogs_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityLogs] ADD CONSTRAINT [ActivityLogs_operatorId_fkey] FOREIGN KEY ([operatorId]) REFERENCES [dbo].[Operator]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_PartToPartGroup] ADD CONSTRAINT [_PartToPartGroup_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[Part]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_PartToPartGroup] ADD CONSTRAINT [_PartToPartGroup_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[PartGroup]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_PartGroupToScrapCode] ADD CONSTRAINT [_PartGroupToScrapCode_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[PartGroup]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_PartGroupToScrapCode] ADD CONSTRAINT [_PartGroupToScrapCode_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[ScrapCode]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

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
