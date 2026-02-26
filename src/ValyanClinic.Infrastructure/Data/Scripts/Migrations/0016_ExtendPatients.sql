-- =============================================================================
-- Migrare 0016: Extindere tabel Patients — câmpuri noi conform design UI
-- PatientCode (auto-generat), SecondaryPhone, City, County, PostalCode,
-- ChronicDiseases, FamilyDoctorName, IsInsured
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==================== SEQUENCE pentru PatientCode ====================

IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'PatientCodeSeq')
BEGIN
    CREATE SEQUENCE dbo.PatientCodeSeq
        AS INT
        START WITH 1
        INCREMENT BY 1
        NO CACHE;

    PRINT 'Secvența PatientCodeSeq a fost creată.';
END;
GO

-- ==================== COLOANE NOI PE PATIENTS ====================

-- PatientCode — cod unic automat (format: PACIENT00000001)
IF COL_LENGTH('Patients', 'PatientCode') IS NULL
BEGIN
    ALTER TABLE Patients ADD PatientCode NVARCHAR(20) NULL;
    PRINT 'Coloana PatientCode adăugată.';
END;
GO

-- SecondaryPhone — telefon secundar
IF COL_LENGTH('Patients', 'SecondaryPhone') IS NULL
BEGIN
    ALTER TABLE Patients ADD SecondaryPhone NVARCHAR(20) NULL;
    PRINT 'Coloana SecondaryPhone adăugată.';
END;
GO

-- City — localitate
IF COL_LENGTH('Patients', 'City') IS NULL
BEGIN
    ALTER TABLE Patients ADD City NVARCHAR(100) NULL;
    PRINT 'Coloana City adăugată.';
END;
GO

-- County — județ
IF COL_LENGTH('Patients', 'County') IS NULL
BEGIN
    ALTER TABLE Patients ADD County NVARCHAR(100) NULL;
    PRINT 'Coloana County adăugată.';
END;
GO

-- PostalCode — cod poștal
IF COL_LENGTH('Patients', 'PostalCode') IS NULL
BEGIN
    ALTER TABLE Patients ADD PostalCode NVARCHAR(10) NULL;
    PRINT 'Coloana PostalCode adăugată.';
END;
GO

-- ChronicDiseases — boli cronice (text liber)
IF COL_LENGTH('Patients', 'ChronicDiseases') IS NULL
BEGIN
    ALTER TABLE Patients ADD ChronicDiseases NVARCHAR(MAX) NULL;
    PRINT 'Coloana ChronicDiseases adăugată.';
END;
GO

-- FamilyDoctorName — medic familie (text liber)
IF COL_LENGTH('Patients', 'FamilyDoctorName') IS NULL
BEGIN
    ALTER TABLE Patients ADD FamilyDoctorName NVARCHAR(200) NULL;
    PRINT 'Coloana FamilyDoctorName adăugată.';
END;
GO

-- IsInsured — asigurat (Da/Nu)
IF COL_LENGTH('Patients', 'IsInsured') IS NULL
BEGIN
    ALTER TABLE Patients ADD IsInsured BIT NOT NULL DEFAULT 0;
    PRINT 'Coloana IsInsured adăugată.';
END;
GO

-- ==================== POPULARE PatientCode pacienți existenți ====================

IF EXISTS (SELECT 1 FROM Patients WHERE PatientCode IS NULL AND IsDeleted = 0)
BEGIN
    DECLARE @MaxCode INT = 0;

    ;WITH Numbered AS (
        SELECT Id, ROW_NUMBER() OVER (ORDER BY CreatedAt, Id) AS RowNum
        FROM Patients
        WHERE PatientCode IS NULL AND IsDeleted = 0
    )
    UPDATE p
    SET p.PatientCode = N'PACIENT' + RIGHT('00000000' + CAST(n.RowNum AS NVARCHAR), 8)
    FROM Patients p
    INNER JOIN Numbered n ON n.Id = p.Id;

    SELECT @MaxCode = COUNT(*) FROM Patients WHERE IsDeleted = 0 AND PatientCode IS NOT NULL;

    -- Resetează secvența pentru a continua de la ultimul cod folosit + 1
    IF @MaxCode > 0
    BEGIN
        DECLARE @NextVal INT = @MaxCode + 1;
        DECLARE @sql NVARCHAR(200) = N'ALTER SEQUENCE dbo.PatientCodeSeq RESTART WITH ' + CAST(@NextVal AS NVARCHAR);
        EXEC sp_executesql @sql;
    END;

    PRINT 'PatientCode populat pentru pacienții existenți. Secvența resetată.';
END;
GO

-- Fallback: pacienți soft-deleted fără PatientCode
UPDATE Patients SET PatientCode = N'PACIENT00000000' WHERE PatientCode IS NULL;
GO

-- ==================== INDEX UNIC pe PatientCode ====================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_PatientCode' AND object_id = OBJECT_ID('Patients'))
    CREATE UNIQUE NONCLUSTERED INDEX IX_Patients_PatientCode
        ON Patients(PatientCode)
        WHERE PatientCode IS NOT NULL AND IsDeleted = 0;
GO

PRINT 'Migrarea 0016_ExtendPatients.sql finalizată cu succes.';
GO
