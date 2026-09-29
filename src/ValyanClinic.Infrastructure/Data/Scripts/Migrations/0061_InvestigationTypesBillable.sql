-- =============================================================================
-- Migrare 0061: InvestigationTypeDefinitions.IsBillable
--   Marchează tipurile de investigații care se pot factura ca servicii medicale.
--   Chestionarele (Epworth, STOP-BANG, CAT, mMRC) și buletinele de laborator
--   externe (LabResults) nu se oferă la importul investigațiilor în tarife.
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.InvestigationTypeDefinitions', 'IsBillable') IS NULL
BEGIN
    ALTER TABLE dbo.InvestigationTypeDefinitions
        ADD IsBillable BIT NOT NULL CONSTRAINT DF_InvestigationTypeDefinitions_IsBillable DEFAULT 1;

    PRINT 'Coloana InvestigationTypeDefinitions.IsBillable a fost adăugată.';
END;
GO

UPDATE dbo.InvestigationTypeDefinitions
SET IsBillable = 0
WHERE TypeCode IN (N'Epworth', N'STOP_BANG', N'CAT', N'mMRC', N'LabResults');
GO
