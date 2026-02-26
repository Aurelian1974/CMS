-- ============================================================
-- Patient_Update — actualizare date pacient cu validări
-- Coduri eroare: 50001=CNP duplicat, 50002=pacient negăsit
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Patient_Update
    @Id               UNIQUEIDENTIFIER,
    @ClinicId         UNIQUEIDENTIFIER,
    @FirstName        NVARCHAR(100),
    @LastName         NVARCHAR(100),
    @Cnp              NCHAR(13)        = NULL,
    @BirthDate        DATE             = NULL,
    @GenderId         UNIQUEIDENTIFIER = NULL,
    @BloodTypeId      UNIQUEIDENTIFIER = NULL,
    @PhoneNumber      NVARCHAR(20)     = NULL,
    @SecondaryPhone   NVARCHAR(20)     = NULL,
    @Email            NVARCHAR(200)    = NULL,
    @Address          NVARCHAR(500)    = NULL,
    @City             NVARCHAR(100)    = NULL,
    @County           NVARCHAR(100)    = NULL,
    @PostalCode       NVARCHAR(10)     = NULL,
    @InsuranceNumber  NVARCHAR(50)     = NULL,
    @InsuranceExpiry  DATE             = NULL,
    @IsInsured        BIT              = 0,
    @ChronicDiseases  NVARCHAR(MAX)    = NULL,
    @FamilyDoctorName NVARCHAR(200)    = NULL,
    @Notes            NVARCHAR(MAX)    = NULL,
    @IsActive         BIT              = 1,
    @UpdatedBy        UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validare: pacientul există
        IF NOT EXISTS (
            SELECT 1 FROM Patients
            WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50002, N'Pacientul nu a fost găsit.', 1;
        END;

        -- Validare: CNP unic per clinică (exclus el însuși)
        IF @Cnp IS NOT NULL AND LTRIM(RTRIM(@Cnp)) <> '' AND EXISTS (
            SELECT 1 FROM Patients
            WHERE Cnp = @Cnp AND ClinicId = @ClinicId AND IsDeleted = 0 AND Id <> @Id
        )
        BEGIN
            ;THROW 50001, N'Un pacient cu acest CNP există deja.', 1;
        END;

        UPDATE Patients
        SET FirstName        = @FirstName,
            LastName         = @LastName,
            Cnp              = CASE WHEN LTRIM(RTRIM(@Cnp)) = '' THEN NULL ELSE @Cnp END,
            BirthDate        = @BirthDate,
            GenderId         = @GenderId,
            BloodTypeId      = @BloodTypeId,
            PhoneNumber      = @PhoneNumber,
            SecondaryPhone   = @SecondaryPhone,
            Email            = @Email,
            Address          = @Address,
            City             = @City,
            County           = @County,
            PostalCode       = @PostalCode,
            InsuranceNumber  = @InsuranceNumber,
            InsuranceExpiry  = @InsuranceExpiry,
            IsInsured        = @IsInsured,
            ChronicDiseases  = @ChronicDiseases,
            FamilyDoctorName = @FamilyDoctorName,
            Notes            = @Notes,
            IsActive         = @IsActive,
            UpdatedAt        = GETDATE(),
            UpdatedBy        = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
