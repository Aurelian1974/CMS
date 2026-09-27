SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: MedicalService_Update — date descriptive (prețul se schimbă prin
-- MedicalServicePrice_Add). Concurență optimistă prin RowVersion.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.MedicalService_Update
    @Id                    UNIQUEIDENTIFIER,
    @ClinicId              UNIQUEIDENTIFIER,
    @Code                  NVARCHAR(30),
    @Name                  NVARCHAR(200),
    @CategoryId            UNIQUEIDENTIFIER,
    @DurationMinutes       INT              = NULL,
    @InvestigationTypeCode NVARCHAR(50)     = NULL,
    @RowVersion            BINARY(8),
    @UpdatedBy             UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @CurrentVersion BINARY(8);
        SELECT @CurrentVersion = RowVersion
        FROM dbo.MedicalServices WITH (UPDLOCK)
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        IF @CurrentVersion IS NULL
        BEGIN
            ;THROW 50611, N'Serviciul nu a fost găsit.', 1;
        END;

        IF @CurrentVersion <> @RowVersion
        BEGIN
            ;THROW 50613, N'Serviciul a fost modificat între timp de alt utilizator. Reîncărcați datele.', 1;
        END;

        IF EXISTS (SELECT 1 FROM dbo.MedicalServices
                   WHERE ClinicId = @ClinicId AND Code = @Code AND Id <> @Id AND IsDeleted = 0)
        BEGIN
            ;THROW 50610, N'Există deja un serviciu cu acest cod.', 1;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.ServiceCategories WHERE Id = @CategoryId AND IsActive = 1)
        BEGIN
            ;THROW 50615, N'Categoria selectată nu este validă.', 1;
        END;

        DECLARE @OldValues NVARCHAR(MAX) = (
            SELECT Code, Name, CategoryId, DurationMinutes, InvestigationTypeCode
            FROM dbo.MedicalServices WHERE Id = @Id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        UPDATE dbo.MedicalServices SET
            Code                  = @Code,
            Name                  = @Name,
            CategoryId            = @CategoryId,
            DurationMinutes       = @DurationMinutes,
            InvestigationTypeCode = @InvestigationTypeCode,
            UpdatedAt             = GETDATE(),
            UpdatedBy             = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'MedicalService', @Id, N'Update', @OldValues,
                (SELECT Code, Name, CategoryId, DurationMinutes, InvestigationTypeCode
                 FROM dbo.MedicalServices WHERE Id = @Id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @UpdatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
