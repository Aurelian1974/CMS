-- ============================================================================
-- Migrare: 0018_SeedGeographicData.sql
-- Descriere: Import date geografice din ValyanMed (TipLocalitate, Judet, Localitate)
--            în tabelele LocationTypes, Counties, Localities din ValyanClinic.
--            Ambele baze sunt pe aceeași instanță SQL Server.
-- Sursa: ValyanMed.dbo.TipLocalitate (7 rânduri),
--        ValyanMed.dbo.Judet (42 rânduri),
--        ValyanMed.dbo.Localitate (13.251 rânduri)
-- Data: 2026-02-28
-- ============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    -- ==================== 1. SEED LOCATION TYPES ====================
    -- TipLocalitate nu are GUID în sursă — inserăm cu GUID-uri fixe deterministe
    IF NOT EXISTS (SELECT 1 FROM LocationTypes)
    BEGIN
        INSERT INTO LocationTypes (Id, Code, Name, IsActive)
        VALUES
            ('D1000001-0000-0000-0000-000000000001', N'Loc', N'Localitate',                    1),
            ('D1000001-0000-0000-0000-000000000002', N'Mun', N'Municipiu',                     1),
            ('D1000001-0000-0000-0000-000000000003', N'Ors', N'Oras',                          1),
            ('D1000001-0000-0000-0000-000000000004', N'Sat', N'Sat',                           1),
            ('D1000001-0000-0000-0000-000000000005', N'Sec', N'Sector',                        1),
            ('D1000001-0000-0000-0000-000000000006', N'Com', N'Comuna',                        1),
            ('D1000001-0000-0000-0000-000000000007', N'MRJ', N'Municipiu Resedinta de Judet',  1);
    END;

    -- ==================== 2. SEED COUNTIES ====================
    -- Judet are JudetGuid — îl folosim ca PK în Counties
    IF NOT EXISTS (SELECT 1 FROM Counties)
    BEGIN
        INSERT INTO Counties (Id, Name, Abbreviation, AutoCode, SortOrder, IsActive)
        SELECT
            j.JudetGuid,
            j.Nume,
            j.CodJudet,
            j.CodAuto,
            j.Ordine,
            1 -- IsActive
        FROM ValyanMed.dbo.Judet j;
    END;

    -- ==================== 3. SEED LOCALITIES ====================
    -- Localitate are LocalitateGuid — îl folosim ca PK în Localities
    -- Mapare IdTipLocalitate (INT) → LocationTypes.Id (GUID) prin tabelă de corespondență
    IF NOT EXISTS (SELECT 1 FROM Localities)
    BEGIN
        -- Tabelă temporară de mapare IdTipLocalitate → LocationTypes.Id
        DECLARE @TipMap TABLE (
            OldId INT,
            NewId UNIQUEIDENTIFIER
        );

        INSERT INTO @TipMap (OldId, NewId)
        VALUES
            (1, 'D1000001-0000-0000-0000-000000000001'),  -- Loc  → Localitate
            (2, 'D1000001-0000-0000-0000-000000000002'),  -- Mun  → Municipiu
            (3, 'D1000001-0000-0000-0000-000000000003'),  -- Ors  → Oras
            (4, 'D1000001-0000-0000-0000-000000000004'),  -- Sat  → Sat
            (5, 'D1000001-0000-0000-0000-000000000005'),  -- Sec  → Sector
            (6, 'D1000001-0000-0000-0000-000000000006'),  -- Com  → Comuna
            (7, 'D1000001-0000-0000-0000-000000000007');   -- MRJ  → Municipiu Resedinta de Judet

        INSERT INTO Localities (Id, CountyId, Name, SirutaCode, LocationTypeId, LocalityCode, IsActive)
        SELECT
            l.LocalitateGuid,                            -- GUID din sursa → PK
            j.JudetGuid,                                 -- GUID judet din sursa → FK Counties
            l.Nume,
            l.Siruta,
            tm.NewId,                                     -- Mapare INT → GUID
            l.CodLocalitate,
            1 -- IsActive
        FROM ValyanMed.dbo.Localitate l
        INNER JOIN ValyanMed.dbo.Judet j ON j.IdJudet = l.IdJudet
        LEFT JOIN @TipMap tm ON tm.OldId = l.IdTipLocalitate;
    END;

    COMMIT TRANSACTION;

    -- Verificare conturi
    DECLARE @ltCount INT, @cCount INT, @lCount INT;
    SELECT @ltCount = COUNT(*) FROM LocationTypes;
    SELECT @cCount  = COUNT(*) FROM Counties;
    SELECT @lCount  = COUNT(*) FROM Localities;

    PRINT 'Seed geographic data complet:';
    PRINT '  LocationTypes: ' + CAST(@ltCount AS VARCHAR(10)) + ' rânduri';
    PRINT '  Counties:      ' + CAST(@cCount  AS VARCHAR(10)) + ' rânduri';
    PRINT '  Localities:    ' + CAST(@lCount  AS VARCHAR(10)) + ' rânduri';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    ;THROW;
END CATCH;
GO
