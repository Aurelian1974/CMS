-- ============================================================
-- AdministrativeStaff_Delete — soft delete personal administrativ
-- Cod eroare: 50700=not found
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.AdministrativeStaff_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.AdministrativeStaff
            WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50700, N'Membrul personalului administrativ nu a fost găsit.', 1;
        END;

        UPDATE dbo.AdministrativeStaff
        SET IsDeleted = 1,
            IsActive  = 0,
            UpdatedAt = GETDATE(),
            UpdatedBy = @DeletedBy
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
