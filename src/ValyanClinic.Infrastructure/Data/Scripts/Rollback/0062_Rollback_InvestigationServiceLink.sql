-- ============================================================================
-- ROLLBACK 0062 — rulat MANUAL (nu este preluat de DbUp).
-- Liniile generate din investigații rămân ca linii obișnuite (se pierde doar legătura).
-- După rollback, redeploy SP-urile Investigation_*, ConsultationService_*,
-- ConsultationBilling_GetSummary, Consultation_Finalize și MedicalService_Create/Update
-- din commit-ul anterior lui 0062.
-- ============================================================================
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DROP PROCEDURE IF EXISTS dbo.ConsultationService_SyncFromInvestigations;
DROP PROCEDURE IF EXISTS dbo.ConsultationService_GetUnbilledInvestigations;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_MedicalServices_Clinic_InvestigationType')
    DROP INDEX UX_MedicalServices_Clinic_InvestigationType ON dbo.MedicalServices;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_ConsultationServices_Investigation')
    DROP INDEX UX_ConsultationServices_Investigation ON dbo.ConsultationServices;
GO

IF OBJECT_ID('dbo.FK_ConsultationServices_Investigations', 'F') IS NOT NULL
    ALTER TABLE dbo.ConsultationServices DROP CONSTRAINT FK_ConsultationServices_Investigations;
IF COL_LENGTH('dbo.ConsultationServices', 'ConsultationInvestigationId') IS NOT NULL
    ALTER TABLE dbo.ConsultationServices DROP COLUMN ConsultationInvestigationId;
GO

UPDATE dbo.InvestigationTypeDefinitions
SET IsBillable = 0
WHERE TypeCode IN (N'Epworth', N'STOP_BANG', N'CAT', N'mMRC', N'LabResults');
GO
