-- ============================================================================
-- Migrare 0062: Legătura investigație paraclinică → linie de serviciu facturabilă
--   1. Toate investigațiile din tab-urile Imagistică / Funcțional / Proceduri sunt
--      facturabile (inclusiv chestionarele din Funcțional); rămâne exclus doar tab-ul Lab.
--   2. ConsultationServices.ConsultationInvestigationId — linia generată automat
--      dintr-o investigație (o singură linie activă per investigație).
--   3. Un singur serviciu activ per tip de investigație în clinică.
-- Rollback: Scripts/Rollback/0062_Rollback_InvestigationServiceLink.sql
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

UPDATE dbo.InvestigationTypeDefinitions
SET IsBillable = CASE WHEN ParentTab IN (N'Imaging', N'Functional', N'Procedures') THEN 1 ELSE 0 END;
GO

IF COL_LENGTH('dbo.ConsultationServices', 'ConsultationInvestigationId') IS NULL
BEGIN
    ALTER TABLE dbo.ConsultationServices
        ADD ConsultationInvestigationId UNIQUEIDENTIFIER NULL
            CONSTRAINT FK_ConsultationServices_Investigations
            REFERENCES dbo.ConsultationInvestigations(Id);

    PRINT 'Coloana ConsultationServices.ConsultationInvestigationId a fost adăugată.';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_ConsultationServices_Investigation')
    CREATE UNIQUE NONCLUSTERED INDEX UX_ConsultationServices_Investigation
        ON dbo.ConsultationServices (ConsultationInvestigationId)
        WHERE IsDeleted = 0 AND ConsultationInvestigationId IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_MedicalServices_Clinic_InvestigationType')
BEGIN
    IF EXISTS (
        SELECT 1 FROM dbo.MedicalServices
        WHERE IsDeleted = 0 AND InvestigationTypeCode IS NOT NULL
        GROUP BY ClinicId, InvestigationTypeCode
        HAVING COUNT(*) > 1)
    BEGIN
        PRINT 'ATENȚIE: există servicii duplicate pe același tip de investigație — indexul UX_MedicalServices_Clinic_InvestigationType nu a fost creat.';
    END
    ELSE
    BEGIN
        CREATE UNIQUE NONCLUSTERED INDEX UX_MedicalServices_Clinic_InvestigationType
            ON dbo.MedicalServices (ClinicId, InvestigationTypeCode)
            WHERE IsDeleted = 0 AND InvestigationTypeCode IS NOT NULL;
    END;
END;
GO

PRINT 'Migrarea 0062_InvestigationServiceLink finalizata cu succes.';
GO
