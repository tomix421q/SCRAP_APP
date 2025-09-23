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
    [hallId] INT NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    CONSTRAINT [Project_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Process] (
    [id] INT NOT NULL IDENTITY(1,1),
    [projectId] INT NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    CONSTRAINT [Process_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Process_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Part] (
    [id] INT NOT NULL IDENTITY(1,1),
    [processId] INT NOT NULL,
    [processName] NVARCHAR(1000) NOT NULL,
    [projectName] NVARCHAR(1000) NOT NULL,
    [hallName] NVARCHAR(1000) NOT NULL,
    [partNumber] NVARCHAR(1000) NOT NULL,
    [side] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Part_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Part_partNumber_key] UNIQUE NONCLUSTERED ([partNumber])
);

-- CreateTable
CREATE TABLE [dbo].[ScrapCode] (
    [id] INT NOT NULL IDENTITY(1,1),
    [processId] INT,
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [active] BIT NOT NULL CONSTRAINT [ScrapCode_active_df] DEFAULT 1,
    CONSTRAINT [ScrapCode_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ScrapRecord] (
    [id] INT NOT NULL IDENTITY(1,1),
    [partId] INT NOT NULL,
    [scrapCodeId] INT NOT NULL,
    [description] NVARCHAR(1000),
    [quantity] FLOAT(53) NOT NULL,
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ScrapRecord_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
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

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScrapRecord_createdAt_idx] ON [dbo].[ScrapRecord]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScrapRecord_scrapCodeId_idx] ON [dbo].[ScrapRecord]([scrapCodeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScrapRecord_partId_idx] ON [dbo].[ScrapRecord]([partId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScrapSummary_date_idx] ON [dbo].[ScrapSummary]([date]);

-- AddForeignKey
ALTER TABLE [dbo].[session] ADD CONSTRAINT [session_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[account] ADD CONSTRAINT [account_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_hallId_fkey] FOREIGN KEY ([hallId]) REFERENCES [dbo].[Hall]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Process] ADD CONSTRAINT [Process_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Part] ADD CONSTRAINT [Part_processId_fkey] FOREIGN KEY ([processId]) REFERENCES [dbo].[Process]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ScrapRecord] ADD CONSTRAINT [ScrapRecord_partId_fkey] FOREIGN KEY ([partId]) REFERENCES [dbo].[Part]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ScrapRecord] ADD CONSTRAINT [ScrapRecord_scrapCodeId_fkey] FOREIGN KEY ([scrapCodeId]) REFERENCES [dbo].[ScrapCode]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ScrapSummary] ADD CONSTRAINT [ScrapSummary_partId_fkey] FOREIGN KEY ([partId]) REFERENCES [dbo].[Part]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ScrapSummary] ADD CONSTRAINT [ScrapSummary_scrapCodeId_fkey] FOREIGN KEY ([scrapCodeId]) REFERENCES [dbo].[ScrapCode]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

