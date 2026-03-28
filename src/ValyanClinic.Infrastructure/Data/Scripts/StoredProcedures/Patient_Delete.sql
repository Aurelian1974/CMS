-- ============================================================
-- Patient_Delete — soft delete pacient
-- Coduri eroare: 50002=pacient negăsit
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Patient_Delete
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
            SELECT 1 FROM Patients
            WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50002, N'Pacientul nu a fost găsit.', 1;
        END;

        -- Audit: captează valorile vechi ÎNAINTE de ștergere
        DECLARE @OldValues NVARCHAR(MAX);
        SELECT @OldValues = (
            SELECT FirstName, LastName, Cnp, BirthDate, GenderId, BloodTypeId,
                   PhoneNumber, SecondaryPhone, Email, Address, City, County, PostalCode,
                   InsuranceNumber, InsuranceExpiry, IsInsured, ChronicDiseases, FamilyDoctorName,
                   Notes, IsActive
            FROM Patients WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE Patients
        SET IsDeleted = 1,
            IsActive  = 0,
            UpdatedAt = GETDATE(),
            UpdatedBy = @DeletedBy
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Patient', @Id, N'Delete', @OldValues, NULL, @DeletedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
