-- ============================================================================
-- Migrare: 0006_AddMedicalTitleIdToDoctors.sql
-- Descriere: Adaugă coloana MedicalTitleId pe tabelul Doctors (FK → MedicalTitles)
-- Data: 2026-02-25
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==================== COLOANA MedicalTitleId ====================

IF COL_LENGTH('Doctors', 'MedicalTitleId') IS NULL
BEGIN
    ALTER TABLE Doctors
        ADD MedicalTitleId UNIQUEIDENTIFIER NULL;

    PRINT N'Coloana MedicalTitleId adăugată pe Doctors.';
END;
GO

-- ==================== FK → MedicalTitles ====================

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_Doctors_MedicalTitles' AND parent_object_id = OBJECT_ID('Doctors')
)
BEGIN
    ALTER TABLE Doctors
        ADD CONSTRAINT FK_Doctors_MedicalTitles
        FOREIGN KEY (MedicalTitleId) REFERENCES MedicalTitles(Id);

    PRINT N'FK Doctors.MedicalTitleId → MedicalTitles.Id adăugat.';
END;
GO

-- ==================== INDEX ====================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Doctors_MedicalTitleId' AND object_id = OBJECT_ID('Doctors'))
    CREATE NONCLUSTERED INDEX IX_Doctors_MedicalTitleId ON Doctors(MedicalTitleId) WHERE IsDeleted = 0;
GO

PRINT N'Migrarea 0006_AddMedicalTitleIdToDoctors.sql finalizată cu succes.';
GO
