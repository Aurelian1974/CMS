-- =============================================================================
-- SP: User_Delete — soft delete utilizator
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.User_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50507, N'Utilizatorul nu a fost găsit.', 1;
        END;

        -- Audit: captează valorile vechi ÎNAINTE de ștergere
        DECLARE @OldValues NVARCHAR(MAX);
        SELECT @OldValues = (
            SELECT Username, Email, FirstName, LastName, RoleId, DoctorId, MedicalStaffId, IsActive
            FROM Users WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE Users
        SET IsDeleted = 1,
            IsActive  = 0,
            UpdatedBy = @DeletedBy,
            UpdatedAt = GETDATE()
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'User', @Id, N'Delete', @OldValues, NULL, @DeletedBy);

        COMMIT TRANSACTION;
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
