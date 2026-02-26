-- ============================================================
-- Patient_Create — creare pacient cu validări business
-- Coduri eroare: 50001=CNP duplicat
-- Returnează: Id-ul pacientului nou creat
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Patient_Create
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
    @CreatedBy        UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validare: CNP unic per clinică (dacă e furnizat)
        IF @Cnp IS NOT NULL AND LTRIM(RTRIM(@Cnp)) <> '' AND EXISTS (
            SELECT 1 FROM Patients
            WHERE Cnp = @Cnp AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50001, N'Un pacient cu acest CNP există deja.', 1;
        END;

        -- Generare PatientCode din secvență
        DECLARE @SeqVal INT = NEXT VALUE FOR dbo.PatientCodeSeq;
        DECLARE @PatientCode NVARCHAR(20) = N'PACIENT' + RIGHT('00000000' + CAST(@SeqVal AS NVARCHAR), 8);

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO Patients (
            ClinicId, PatientCode, FirstName, LastName, Cnp, BirthDate, GenderId, BloodTypeId,
            PhoneNumber, SecondaryPhone, Email, Address, City, County, PostalCode,
            InsuranceNumber, InsuranceExpiry, IsInsured,
            ChronicDiseases, FamilyDoctorName, Notes,
            IsActive, IsDeleted, CreatedAt, CreatedBy
        )
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (
            @ClinicId, @PatientCode, @FirstName, @LastName,
            CASE WHEN LTRIM(RTRIM(@Cnp)) = '' THEN NULL ELSE @Cnp END,
            @BirthDate, @GenderId, @BloodTypeId,
            @PhoneNumber, @SecondaryPhone, @Email, @Address, @City, @County, @PostalCode,
            @InsuranceNumber, @InsuranceExpiry, @IsInsured,
            @ChronicDiseases, @FamilyDoctorName, @Notes,
            1, 0, GETDATE(), @CreatedBy
        );

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
