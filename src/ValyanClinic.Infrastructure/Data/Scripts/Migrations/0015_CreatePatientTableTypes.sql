-- =============================================================================
-- Migrare 0015: Creare Table-Valued Parameter types pentru sync SP-uri pacient
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==================== PatientAllergyTableType ====================

IF NOT EXISTS (SELECT 1 FROM sys.types WHERE name = 'PatientAllergyTableType')
BEGIN
    CREATE TYPE dbo.PatientAllergyTableType AS TABLE (
        AllergyTypeId     UNIQUEIDENTIFIER NOT NULL,
        AllergySeverityId UNIQUEIDENTIFIER NOT NULL,
        AllergenName      NVARCHAR(200)    NOT NULL,
        Reaction          NVARCHAR(500)    NULL,
        OnsetDate         DATE             NULL,
        Notes             NVARCHAR(500)    NULL
    );
    PRINT 'Tipul PatientAllergyTableType a fost creat.';
END;
GO

-- ==================== PatientDoctorTableType ====================

IF NOT EXISTS (SELECT 1 FROM sys.types WHERE name = 'PatientDoctorTableType')
BEGIN
    CREATE TYPE dbo.PatientDoctorTableType AS TABLE (
        DoctorId  UNIQUEIDENTIFIER NOT NULL,
        IsPrimary BIT              NOT NULL DEFAULT 0,
        Notes     NVARCHAR(500)    NULL
    );
    PRINT 'Tipul PatientDoctorTableType a fost creat.';
END;
GO

-- ==================== PatientEmergencyContactTableType ====================

IF NOT EXISTS (SELECT 1 FROM sys.types WHERE name = 'PatientEmergencyContactTableType')
BEGIN
    CREATE TYPE dbo.PatientEmergencyContactTableType AS TABLE (
        FullName     NVARCHAR(200) NOT NULL,
        Relationship NVARCHAR(100) NOT NULL,
        PhoneNumber  NVARCHAR(20)  NOT NULL,
        IsDefault    BIT           NOT NULL DEFAULT 0,
        Notes        NVARCHAR(500) NULL
    );
    PRINT 'Tipul PatientEmergencyContactTableType a fost creat.';
END;
GO

PRINT 'Migrarea 0015_CreatePatientTableTypes.sql finalizată cu succes.';
GO
