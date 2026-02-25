-- =============================================================================
-- Migrare 0010: Creare tabel RefreshTokens pentru JWT refresh token rotation
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'RefreshTokens')
BEGIN
    CREATE TABLE RefreshTokens (
        Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        UserId          UNIQUEIDENTIFIER NOT NULL,
        Token           NVARCHAR(500)    NOT NULL,
        ExpiresAt       DATETIME2        NOT NULL,
        CreatedAt       DATETIME2        NOT NULL DEFAULT GETDATE(),
        RevokedAt       DATETIME2        NULL,
        ReplacedByToken NVARCHAR(500)    NULL,
        CreatedByIp     NVARCHAR(50)     NULL,
        CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId) REFERENCES Users(Id)
    );

    PRINT 'Tabel RefreshTokens creat cu succes.';
END;
GO

-- Index pe Token pentru cautare rapida la refresh
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_Token' AND object_id = OBJECT_ID('RefreshTokens'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RefreshTokens_Token
        ON RefreshTokens (Token)
        INCLUDE (UserId, ExpiresAt, RevokedAt);

    PRINT 'Index IX_RefreshTokens_Token creat.';
END;
GO

-- Index pe UserId pentru RevokeAll
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_UserId' AND object_id = OBJECT_ID('RefreshTokens'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RefreshTokens_UserId
        ON RefreshTokens (UserId)
        WHERE RevokedAt IS NULL;

    PRINT 'Index IX_RefreshTokens_UserId creat.';
END;
GO

PRINT 'Migrarea 0010_CreateRefreshTokens finalizata cu succes.';
GO
