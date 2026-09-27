SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: InvoiceSeries_Create — serie nouă. @StartNumber = primul număr emis
-- (util la continuarea unei numerotări existente, ex. din facturierul anterior).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.InvoiceSeries_Create
    @ClinicId    UNIQUEIDENTIFIER,
    @Series      NVARCHAR(10),
    @StartNumber INT = 1,
    @IsDefault   BIT = 0,
    @CreatedBy   UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        SET @Series = UPPER(LTRIM(RTRIM(@Series)));

        IF EXISTS (SELECT 1 FROM dbo.InvoiceSeries WITH (UPDLOCK, HOLDLOCK)
                   WHERE ClinicId = @ClinicId AND Series = @Series)
        BEGIN
            ;THROW 50625, N'Seria există deja.', 1;
        END;

        IF @StartNumber IS NULL OR @StartNumber < 1
        BEGIN
            ;THROW 50625, N'Numărul de start trebuie să fie cel puțin 1.', 1;
        END;

        -- Prima serie a clinicii devine automat implicită
        IF NOT EXISTS (SELECT 1 FROM dbo.InvoiceSeries WHERE ClinicId = @ClinicId AND IsDefault = 1)
            SET @IsDefault = 1;

        IF @IsDefault = 1
            UPDATE dbo.InvoiceSeries SET IsDefault = 0, UpdatedAt = GETDATE(), UpdatedBy = @CreatedBy
            WHERE ClinicId = @ClinicId AND IsDefault = 1;

        DECLARE @NewId UNIQUEIDENTIFIER = NEWID();
        INSERT INTO dbo.InvoiceSeries (Id, ClinicId, Series, LastNumber, IsDefault, IsActive, CreatedAt, CreatedBy)
        VALUES (@NewId, @ClinicId, @Series, @StartNumber - 1, @IsDefault, 1, GETDATE(), @CreatedBy);

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'InvoiceSeries', @NewId, N'Create', NULL,
                (SELECT @Series AS Series, @StartNumber AS StartNumber, @IsDefault AS IsDefault
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @CreatedBy);

        COMMIT TRANSACTION;
        SELECT @NewId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
