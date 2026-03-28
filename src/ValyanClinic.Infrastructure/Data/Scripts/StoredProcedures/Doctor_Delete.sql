-- ============================================================
-- Doctor_Delete — soft delete doctor
-- Cod eroare: 50300=not found
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Doctor_Delete
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1 FROM Doctors
            WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50300, N'Doctorul nu a fost găsit.', 1;
        END;

        -- Audit: captează valorile vechi ÎNAINTE de ștergere
        DECLARE @OldValues NVARCHAR(MAX);
        SELECT @OldValues = (
            SELECT FirstName, LastName, Email, PhoneNumber, MedicalCode, LicenseNumber,
                   LicenseExpiresAt, DepartmentId, SpecialtyId, SubspecialtyId,
                   MedicalTitleId, SupervisorDoctorId, IsActive
            FROM Doctors WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE Doctors
        SET IsDeleted = 1,
            IsActive  = 0,
            UpdatedAt = GETDATE()
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Doctor', @Id, N'Delete', @OldValues, NULL, @ClinicId);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
