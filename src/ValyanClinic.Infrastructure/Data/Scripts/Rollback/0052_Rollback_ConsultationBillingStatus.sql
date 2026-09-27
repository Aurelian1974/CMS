-- ============================================================================
-- ROLLBACK 0052 — rulat MANUAL (nu este preluat de DbUp).
-- Consultațiile aflate în FACTURATA revin la FINALIZATA înainte de ștergerea statusului.
-- ============================================================================
SET NOCOUNT ON;
GO

UPDATE dbo.Consultations
SET StatusId = 'C2000000-0000-0000-0000-000000000002'
WHERE StatusId = 'C2000000-0000-0000-0000-000000000004';

DELETE FROM dbo.ConsultationStatuses WHERE Code = 'FACTURATA';
UPDATE dbo.ConsultationStatuses SET SortOrder = 3 WHERE Code = 'BLOCATA';
GO

IF COL_LENGTH('dbo.Consultations', 'RowVersion') IS NOT NULL
    ALTER TABLE dbo.Consultations DROP COLUMN RowVersion;
GO

DELETE FROM dbo.SchemaVersions WHERE ScriptName LIKE N'%0052_ConsultationBillingStatus.sql';
GO
