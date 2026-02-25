-- =============================================================================
-- Migrare 0009: Adăugare coloană Username la tabela Users
-- Username-ul permite login alternativ (pe lângă email).
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('Users', 'Username') IS NULL
BEGIN
    ALTER TABLE Users ADD Username NVARCHAR(100) NULL;
    PRINT 'Coloana Username a fost adăugată la Users.';
END;
GO

SET QUOTED_IDENTIFIER ON;
GO

-- Populare username din email pentru utilizatorii existenți
IF COL_LENGTH('Users', 'Username') IS NOT NULL
BEGIN
    UPDATE Users SET Username = LEFT(Email, CHARINDEX('@', Email) - 1)
    WHERE Username IS NULL AND Email IS NOT NULL AND CHARINDEX('@', Email) > 1;

    -- Fallback: dacă emailul nu conține @, folosim emailul complet
    UPDATE Users SET Username = Email WHERE Username IS NULL;

    -- Setare NOT NULL după populare
    ALTER TABLE Users ALTER COLUMN Username NVARCHAR(100) NOT NULL;
    PRINT 'Coloana Username este acum NOT NULL.';
END;
GO

-- Index unic filtrat pe Username + ClinicId (exclude soft-deleted)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Username_Clinic')
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX IX_Users_Username_Clinic
        ON Users (Username, ClinicId)
        WHERE IsDeleted = 0;
    PRINT 'Index IX_Users_Username_Clinic creat.';
END;
GO

PRINT 'Migrarea 0009_AddUsernameToUsers finalizată cu succes.';
GO
