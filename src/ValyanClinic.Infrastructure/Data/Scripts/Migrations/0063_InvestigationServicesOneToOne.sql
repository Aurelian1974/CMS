-- ============================================================================
-- Migrare 0063: Servicii 1:1 cu investigațiile paraclinice
--   Serviciul legat de o investigație poartă denumirea din nomenclator și stă în
--   categoria „Investigații paraclinice”. Serviciile lipsă se creează din Tarife →
--   Importă investigații (nu aici: crearea cere autorul operației).
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

DECLARE @InvestigationCategoryId UNIQUEIDENTIFIER =
    (SELECT Id FROM dbo.ServiceCategories WHERE Code = N'INVESTIGATIE');

UPDATE ms
SET Name       = LEFT(d.DisplayName, 200),
    CategoryId = @InvestigationCategoryId,
    UpdatedAt  = GETDATE()
FROM dbo.MedicalServices ms
INNER JOIN dbo.InvestigationTypeDefinitions d ON d.TypeCode = ms.InvestigationTypeCode
WHERE ms.IsDeleted = 0
  AND (ms.Name <> LEFT(d.DisplayName, 200) OR ms.CategoryId <> @InvestigationCategoryId);

PRINT CONCAT('Servicii aliniate la nomenclatorul de investigații: ', @@ROWCOUNT);

DECLARE @Orphans INT = (
    SELECT COUNT(*) FROM dbo.MedicalServices
    WHERE IsDeleted = 0 AND InvestigationTypeCode IS NULL AND CategoryId = @InvestigationCategoryId);

IF @Orphans > 0
    PRINT CONCAT('ATENȚIE: ', @Orphans, ' servicii din categoria investigații nu sunt legate de o investigație — mutați-le în altă categorie.');
GO

PRINT 'Migrarea 0063_InvestigationServicesOneToOne finalizata cu succes.';
GO
