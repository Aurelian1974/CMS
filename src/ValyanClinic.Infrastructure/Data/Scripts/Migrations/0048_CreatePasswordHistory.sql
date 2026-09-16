-- =============================================================================
-- Migrare 0048: Istoricul parolelor si momentul ultimei schimbari
--
-- Doua functionalitati noi, ambele oprite implicit prin setari
-- (PasswordHistoryCount = 0, PasswordExpiryDays = 0):
--   1. interzicerea reutilizarii ultimelor N parole;
--   2. expirarea parolei dupa N zile.
--
-- Se stocheaza hash-uri BCrypt, nu parole. Verificarea reutilizarii inseamna deci
-- cate un BCrypt verify pentru fiecare intrare pastrata — motiv suplimentar ca
-- numarul de intrari sa ramana mic.
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PasswordHistory')
BEGIN
    CREATE TABLE dbo.PasswordHistory (
        Id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        UserId       UNIQUEIDENTIFIER NOT NULL,
        PasswordHash NVARCHAR(500)    NOT NULL,
        CreatedAt    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_PasswordHistory_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
    );

    PRINT 'Tabelul PasswordHistory a fost creat.';
END;
GO

-- Citirea e mereu "ultimele N ale unui utilizator"
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_PasswordHistory_UserId' AND object_id = OBJECT_ID('PasswordHistory'))
    CREATE NONCLUSTERED INDEX IX_PasswordHistory_UserId
        ON dbo.PasswordHistory (UserId, CreatedAt DESC)
        INCLUDE (PasswordHash);
GO

IF COL_LENGTH('Users', 'PasswordChangedAt') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD PasswordChangedAt DATETIME2 NULL;
    PRINT 'Coloana PasswordChangedAt a fost adaugata la Users.';
END;
GO

-- Utilizatorii existenti primesc un punct de pornire, altfel expirarea i-ar
-- considera pe toti restanti in momentul in care cineva o activeaza.
UPDATE dbo.Users
SET PasswordChangedAt = ISNULL(UpdatedAt, CreatedAt)
WHERE PasswordChangedAt IS NULL;
GO

PRINT 'Migrarea 0048_CreatePasswordHistory finalizata cu succes.';
GO
