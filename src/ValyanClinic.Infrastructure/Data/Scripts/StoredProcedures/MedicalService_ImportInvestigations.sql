SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: MedicalService_ImportInvestigations
-- Aduce tarifele la 1:1 cu nomenclatorul de investigații: creează câte un serviciu
-- (categoria INVESTIGATIE, denumirea din nomenclator) pentru FIECARE tip facturabil
-- activ care nu are încă serviciu în clinică. Codul se generează INV-001, INV-002, ...
-- Prețul e opțional: serviciile fără preț nu se pot factura până nu primesc unul.
-- @Items: prețurile inițiale, JSON [{ "InvestigationTypeCode": "...", "Price": 120.00 }]
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.MedicalService_ImportInvestigations
    @ClinicId  UNIQUEIDENTIFIER,
    @Items     NVARCHAR(MAX)    = NULL,
    @VatRateId UNIQUEIDENTIFIER = NULL,
    @ValidFrom DATE             = NULL,
    @CreatedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @CodePrefix NVARCHAR(10) = N'INV-';
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);
    SET @ValidFrom = ISNULL(@ValidFrom, @Today);

    DECLARE @Prices TABLE (TypeCode NVARCHAR(50) NOT NULL, Price DECIMAL(18,2) NULL);

    DECLARE @Rows TABLE (
        RowNo    INT              NOT NULL,
        TypeCode NVARCHAR(50)     NOT NULL,
        Name     NVARCHAR(200)    NOT NULL,
        Price    DECIMAL(18,2)    NULL,
        NewId    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        Code     NVARCHAR(30)     NULL
    );

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO @Prices (TypeCode, Price)
        SELECT LTRIM(RTRIM(JSON_VALUE(j.value, '$.InvestigationTypeCode'))),
               TRY_CAST(JSON_VALUE(j.value, '$.Price') AS DECIMAL(18,2))
        FROM OPENJSON(ISNULL(@Items, N'[]')) j;

        DECLARE @CategoryId UNIQUEIDENTIFIER =
            (SELECT Id FROM dbo.ServiceCategories WHERE Code = N'INVESTIGATIE' AND IsActive = 1);

        IF @CategoryId IS NULL
        BEGIN
            ;THROW 50615, N'Categoria selectată nu este validă.', 1;
        END;

        IF EXISTS (
            SELECT 1 FROM @Prices p
            LEFT JOIN dbo.InvestigationTypeDefinitions d
                   ON d.TypeCode = p.TypeCode AND d.IsActive = 1 AND d.IsBillable = 1
            WHERE d.TypeCode IS NULL)
        BEGIN
            ;THROW 50650, N'Una dintre investigațiile selectate nu există, nu este activă sau nu se facturează.', 1;
        END;

        DECLARE @Msg NVARCHAR(2048);

        SELECT TOP (1) @Msg = CONCAT(N'Investigația „', d.DisplayName, N'” apare de mai multe ori în listă.')
        FROM @Prices p
        INNER JOIN dbo.InvestigationTypeDefinitions d ON d.TypeCode = p.TypeCode
        GROUP BY d.DisplayName
        HAVING COUNT(*) > 1;

        IF @Msg IS NOT NULL
        BEGIN
            ;THROW 50651, @Msg, 1;
        END;

        -- UPDLOCK + HOLDLOCK pe serviciile clinicii: serializează importurile concurente
        -- (aceeași legătură sau același cod INV-NNN nu se pot crea de două ori)
        SELECT TOP (1) @Msg = CONCAT(N'Investigația „', d.DisplayName, N'” are deja serviciul ', ms.Code,
                                     N' în tarife; prețul se schimbă din istoricul de prețuri.')
        FROM dbo.MedicalServices ms WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN @Prices p ON p.TypeCode = ms.InvestigationTypeCode
        INNER JOIN dbo.InvestigationTypeDefinitions d ON d.TypeCode = p.TypeCode
        WHERE ms.ClinicId = @ClinicId AND ms.IsDeleted = 0;

        IF @Msg IS NOT NULL
        BEGIN
            ;THROW 50651, @Msg, 1;
        END;

        INSERT INTO @Rows (RowNo, TypeCode, Name, Price)
        SELECT
            ROW_NUMBER() OVER (ORDER BY d.ParentTab, d.SortOrder, d.DisplayName),
            d.TypeCode, LEFT(d.DisplayName, 200), p.Price
        FROM dbo.InvestigationTypeDefinitions d
        LEFT JOIN @Prices p ON p.TypeCode = d.TypeCode
        WHERE d.IsActive = 1
          AND d.IsBillable = 1
          AND NOT EXISTS (
              SELECT 1 FROM dbo.MedicalServices ms WITH (UPDLOCK, HOLDLOCK)
              WHERE ms.ClinicId = @ClinicId AND ms.IsDeleted = 0 AND ms.InvestigationTypeCode = d.TypeCode);

        IF EXISTS (SELECT 1 FROM @Prices WHERE Price IS NOT NULL)
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM dbo.VatRates WHERE Id = @VatRateId AND IsActive = 1)
            BEGIN
                ;THROW 50616, N'Regimul TVA selectat nu este valid.', 1;
            END;

            IF @ValidFrom < @Today
            BEGIN
                ;THROW 50614, N'Data de la care se aplică prețul nu poate fi în trecut.', 1;
            END;

            IF EXISTS (SELECT 1 FROM @Prices WHERE Price < 0)
            BEGIN
                ;THROW 50614, N'Prețul nu poate fi negativ.', 1;
            END;
        END;

        -- Numerotarea continuă după cel mai mare INV-NNN din clinică, inclusiv serviciile șterse
        DECLARE @LastNo INT = ISNULL((
            SELECT MAX(TRY_CAST(SUBSTRING(Code, LEN(@CodePrefix) + 1, 30) AS INT))
            FROM dbo.MedicalServices WITH (UPDLOCK, HOLDLOCK)
            WHERE ClinicId = @ClinicId AND Code LIKE @CodePrefix + N'[0-9]%'), 0);

        UPDATE @Rows SET Code = CONCAT(@CodePrefix, FORMAT(@LastNo + RowNo, '000'));

        INSERT INTO dbo.MedicalServices
            (Id, ClinicId, Code, Name, CategoryId, DurationMinutes, InvestigationTypeCode, IsActive, CreatedAt, CreatedBy)
        SELECT NewId, @ClinicId, Code, Name, @CategoryId, NULL, TypeCode, 1, GETDATE(), @CreatedBy
        FROM @Rows;

        INSERT INTO dbo.MedicalServicePrices (ClinicId, MedicalServiceId, Price, VatRateId, ValidFrom, ValidTo, CreatedAt, CreatedBy)
        SELECT @ClinicId, NewId, Price, @VatRateId, @ValidFrom, NULL, GETDATE(), @CreatedBy
        FROM @Rows
        WHERE Price IS NOT NULL;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        SELECT @ClinicId, N'MedicalService', r.NewId, N'Create', NULL,
               (SELECT r.Code AS Code, r.Name AS Name, @CategoryId AS CategoryId,
                       r.TypeCode AS InvestigationTypeCode, r.Price AS Price,
                       CASE WHEN r.Price IS NULL THEN NULL ELSE @VatRateId END AS VatRateId,
                       CASE WHEN r.Price IS NULL THEN NULL ELSE @ValidFrom END AS ValidFrom
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
               @CreatedBy
        FROM @Rows r;

        COMMIT TRANSACTION;
        SELECT COUNT(*) FROM @Rows;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
