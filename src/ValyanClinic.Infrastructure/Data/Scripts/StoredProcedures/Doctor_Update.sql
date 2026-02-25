-- ============================================================
-- Doctor_Update — actualizare doctor cu validări business
-- Coduri eroare: 50300=not found, 50301=email duplicat,
--   50302=departament invalid, 50303=supervisor invalid,
--   50304=supervisor circular, 50305=subspecialitate invalidă
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Doctor_Update
    @Id                 UNIQUEIDENTIFIER,
    @ClinicId           UNIQUEIDENTIFIER,
    @DepartmentId       UNIQUEIDENTIFIER = NULL,
    @SupervisorDoctorId UNIQUEIDENTIFIER = NULL,
    @SpecialtyId        UNIQUEIDENTIFIER = NULL,
    @SubspecialtyId     UNIQUEIDENTIFIER = NULL,
    @FirstName          NVARCHAR(100),
    @LastName           NVARCHAR(100),
    @Email              NVARCHAR(200),
    @PhoneNumber        NVARCHAR(20)     = NULL,
    @MedicalCode        NVARCHAR(20)     = NULL,
    @LicenseNumber      NVARCHAR(50)     = NULL,
    @LicenseExpiresAt   DATE             = NULL,
    @IsActive           BIT,
    @UpdatedBy          UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validare: doctorul există
        IF NOT EXISTS (
            SELECT 1 FROM Doctors
            WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50300, N'Doctorul nu a fost găsit.', 1;
        END;

        -- Validare: email unic per clinică (excluzând doctorul curent)
        IF EXISTS (
            SELECT 1 FROM Doctors
            WHERE Email = @Email AND ClinicId = @ClinicId AND Id <> @Id AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50301, N'Un doctor cu această adresă de email există deja.', 1;
        END;

        -- Validare: departament valid
        IF @DepartmentId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM Departments
            WHERE Id = @DepartmentId AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50302, N'Departamentul selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Validare: supervisor valid
        IF @SupervisorDoctorId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM Doctors
            WHERE Id = @SupervisorDoctorId AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50303, N'Supervizorul selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Validare: supervisor nu poate fi el însuși
        IF @SupervisorDoctorId IS NOT NULL AND @SupervisorDoctorId = @Id
        BEGIN
            ;THROW 50304, N'Un doctor nu poate fi propriul său supervizor.', 1;
        END;

        -- Validare: subspecialitate validă
        IF @SubspecialtyId IS NOT NULL AND @SpecialtyId IS NULL
        BEGIN
            ;THROW 50305, N'Nu se poate selecta o subspecialitate fără a selecta o specializare.', 1;
        END;

        IF @SubspecialtyId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM Specialties
            WHERE Id = @SubspecialtyId
              AND [Level] = 2
              AND ParentId = @SpecialtyId
              AND IsActive = 1
        )
        BEGIN
            ;THROW 50305, N'Subspecialitatea selectată nu este validă pentru specializarea aleasă.', 1;
        END;

        UPDATE Doctors
        SET DepartmentId       = @DepartmentId,
            SupervisorDoctorId = @SupervisorDoctorId,
            SpecialtyId        = @SpecialtyId,
            SubspecialtyId     = @SubspecialtyId,
            FirstName          = @FirstName,
            LastName           = @LastName,
            Email              = @Email,
            PhoneNumber        = @PhoneNumber,
            MedicalCode        = @MedicalCode,
            LicenseNumber      = @LicenseNumber,
            LicenseExpiresAt   = @LicenseExpiresAt,
            IsActive           = @IsActive,
            UpdatedAt          = GETDATE(),
            UpdatedBy          = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
