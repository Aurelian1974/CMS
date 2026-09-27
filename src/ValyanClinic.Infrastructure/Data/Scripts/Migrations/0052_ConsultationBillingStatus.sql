-- ============================================================================
-- Migrare 0052: Status „Facturată” pentru consultații + RowVersion
-- FACTURATA = s-a emis un document fiscal (bon / factură) — liniile de servicii
-- devin imuabile. BLOCATA rămâne o stare distinctă (blocare administrativă).
-- Rollback: Scripts/Rollback/0052_Rollback_ConsultationBillingStatus.sql
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.ConsultationStatuses WHERE Code = 'FACTURATA')
BEGIN
    INSERT INTO dbo.ConsultationStatuses (Id, Name, Code, SortOrder)
    VALUES ('C2000000-0000-0000-0000-000000000004', N'Facturată', 'FACTURATA', 3);

    UPDATE dbo.ConsultationStatuses SET SortOrder = 4 WHERE Code = 'BLOCATA';
    PRINT 'Status FACTURATA adăugat.';
END
GO

IF COL_LENGTH('dbo.Consultations', 'RowVersion') IS NULL
BEGIN
    ALTER TABLE dbo.Consultations ADD RowVersion ROWVERSION NOT NULL;
    PRINT 'Coloana Consultations.RowVersion adăugată.';
END
GO

PRINT 'Migrarea 0052_ConsultationBillingStatus finalizata cu succes.';
GO
