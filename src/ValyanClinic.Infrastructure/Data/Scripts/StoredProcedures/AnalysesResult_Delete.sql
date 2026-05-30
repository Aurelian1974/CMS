SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: AnalysesResult_Delete
-- Descriere: Soft-delete header + toate liniile detaliu.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.AnalysesResult_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.AnalysesResults
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
    )
    BEGIN
        ;THROW 50401, N'Buletinul de analize nu a fost gasit.', 1;
    END;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Soft-delete detalii
        UPDATE dbo.AnalysesResultDetails SET IsDeleted = 1
        WHERE ResultId = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        -- Soft-delete header
        UPDATE dbo.AnalysesResults SET
            IsDeleted = 1,
            UpdatedAt = SYSDATETIME(),
            UpdatedBy = @DeletedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
