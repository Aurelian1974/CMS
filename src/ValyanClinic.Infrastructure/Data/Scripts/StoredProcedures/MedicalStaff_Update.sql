-- ============================================================
-- MedicalStaff_Update — actualizare personal medical cu validări
-- Coduri eroare: 50400=not found, 50401=email duplicat,
--   50402=departament invalid, 50403=supervisor invalid,
--   50406=titulatură invalidă
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.MedicalStaff_Update
    @Id                 UNIQUEIDENTIFIER,
    @ClinicId           UNIQUEIDENTIFIER,
    @DepartmentId       UNIQUEIDENTIFIER = NULL,
    @SupervisorDoctorId UNIQUEIDENTIFIER = NULL,
    @MedicalTitleId     UNIQUEIDENTIFIER = NULL,
    @FirstName          NVARCHAR(100),
    @LastName           NVARCHAR(100),
    @Email              NVARCHAR(200),
    @PhoneNumber        NVARCHAR(20)     = NULL,
    @IsActive           BIT,
    @UpdatedBy          UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validare: membrul personalului medical există
        IF NOT EXISTS (
            SELECT 1 FROM MedicalStaff
            WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50400, N'Membrul personalului medical nu a fost găsit.', 1;
        END;

        -- Validare: email unic per clinică (excluzând membrul curent)
        IF EXISTS (
            SELECT 1 FROM MedicalStaff
            WHERE Email = @Email AND ClinicId = @ClinicId AND Id <> @Id AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50401, N'Un membru al personalului medical cu această adresă de email există deja.', 1;
        END;

        -- Validare: departament valid
        IF @DepartmentId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM Departments
            WHERE Id = @DepartmentId AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50402, N'Departamentul selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Validare: supervisor (doctor) valid
        IF @SupervisorDoctorId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM Doctors
            WHERE Id = @SupervisorDoctorId AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50403, N'Doctorul supervizor selectat nu existe sau nu aparține acestei clinici.', 1;
        END;

        -- Validare: titulatura medicală există și este activă
        IF @MedicalTitleId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM MedicalTitles
            WHERE Id = @MedicalTitleId AND IsActive = 1
        )
        BEGIN
            ;THROW 50406, N'Titulatura medicală selectată nu există sau nu este activă.', 1;
        END;

        UPDATE MedicalStaff
        SET DepartmentId       = @DepartmentId,
            SupervisorDoctorId = @SupervisorDoctorId,
            MedicalTitleId     = @MedicalTitleId,
            FirstName          = @FirstName,
            LastName           = @LastName,
            Email              = @Email,
            PhoneNumber        = @PhoneNumber,
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
