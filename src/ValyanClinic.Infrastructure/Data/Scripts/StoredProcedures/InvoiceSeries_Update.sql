SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: InvoiceSeries_Update — implicită / activă. Textul seriei și contorul nu se
-- modifică (ar rupe secvența); pentru o serie nouă se creează altă serie.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.InvoiceSeries_Update
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @IsDefault BIT,
    @IsActive  BIT,
    @UpdatedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @OldValues NVARCHAR(MAX) = (
            SELECT Series, IsDefault, IsActive FROM dbo.InvoiceSeries WITH (UPDLOCK)
            WHERE Id = @Id AND ClinicId = @ClinicId FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        IF @OldValues IS NULL
        BEGIN
            ;THROW 50629, N'Seria de facturi nu a fost găsită.', 1;
        END;

        IF @IsDefault = 1 AND @IsActive = 0
        BEGIN
            ;THROW 50628, N'Seria implicită trebuie să fie activă.', 1;
        END;

        IF @IsDefault = 1
            UPDATE dbo.InvoiceSeries SET IsDefault = 0, UpdatedAt = GETDATE(), UpdatedBy = @UpdatedBy
            WHERE ClinicId = @ClinicId AND IsDefault = 1 AND Id <> @Id;

        UPDATE dbo.InvoiceSeries
        SET IsDefault = @IsDefault, IsActive = @IsActive, UpdatedAt = GETDATE(), UpdatedBy = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'InvoiceSeries', @Id, N'Update', @OldValues,
                (SELECT Series, IsDefault, IsActive FROM dbo.InvoiceSeries WHERE Id = @Id
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @UpdatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
