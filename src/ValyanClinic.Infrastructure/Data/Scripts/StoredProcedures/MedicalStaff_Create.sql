-- ============================================================
-- MedicalStaff_Create — creare personal medical cu validări
-- Coduri eroare: 50401=email duplicat, 50402=departament invalid,
--   50403=supervisor invalid, 50406=titulatură invalidă
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.MedicalStaff_Create
    @ClinicId           UNIQUEIDENTIFIER,
    @DepartmentId       UNIQUEIDENTIFIER = NULL,
    @SupervisorDoctorId UNIQUEIDENTIFIER = NULL,
    @MedicalTitleId     UNIQUEIDENTIFIER = NULL,
    @FirstName          NVARCHAR(100),
    @LastName           NVARCHAR(100),
    @Email              NVARCHAR(200),
    @PhoneNumber        NVARCHAR(20)     = NULL,
    @CreatedBy          UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validare: email unic per clinică
        IF EXISTS (
            SELECT 1 FROM MedicalStaff
            WHERE Email = @Email AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50401, N'Un membru al personalului medical cu această adresă de email există deja.', 1;
        END;

        -- Validare: departament există și aparține clinicii
        IF @DepartmentId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM Departments
            WHERE Id = @DepartmentId AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50402, N'Departamentul selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Validare: supervisor (doctor) există și aparține clinicii
        IF @SupervisorDoctorId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM Doctors
            WHERE Id = @SupervisorDoctorId AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50403, N'Doctorul supervizor selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Validare: titulatura medicală există și este activă
        IF @MedicalTitleId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM MedicalTitles
            WHERE Id = @MedicalTitleId AND IsActive = 1
        )
        BEGIN
            ;THROW 50406, N'Titulatura medicală selectată nu există sau nu este activă.', 1;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO MedicalStaff (
            ClinicId, DepartmentId, SupervisorDoctorId, MedicalTitleId,
            FirstName, LastName, Email, PhoneNumber,
            IsActive, IsDeleted, CreatedAt, CreatedBy
        )
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (
            @ClinicId, @DepartmentId, @SupervisorDoctorId, @MedicalTitleId,
            @FirstName, @LastName, @Email, @PhoneNumber,
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
