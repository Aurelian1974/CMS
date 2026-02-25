-- ============================================================
-- Doctor_Create — creare doctor cu validări business
-- Coduri eroare: 50301=email duplicat, 50302=departament invalid,
--   50303=supervisor invalid, 50305=subspecialitate invalidă
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Doctor_Create
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
    @CreatedBy          UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validare: email unic per clinică
        IF EXISTS (
            SELECT 1 FROM Doctors
            WHERE Email = @Email AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50301, N'Un doctor cu această adresă de email există deja.', 1;
        END;

        -- Validare: departament există și aparține clinicii
        IF @DepartmentId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM Departments
            WHERE Id = @DepartmentId AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50302, N'Departamentul selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Validare: supervisor există și aparține clinicii
        IF @SupervisorDoctorId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM Doctors
            WHERE Id = @SupervisorDoctorId AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50303, N'Supervizorul selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Validare: subspecialitatea trebuie să fie copil al specializării selectate
        IF @SubspecialtyId IS NOT NULL
        BEGIN
            -- Subspecialitatea trebuie să existe, să fie Level 2 și să aibă ParentId = @SpecialtyId
            IF NOT EXISTS (
                SELECT 1 FROM Specialties
                WHERE Id = @SubspecialtyId
                  AND [Level] = 2
                  AND ParentId = @SpecialtyId
                  AND IsActive = 1
            )
            BEGIN
                ;THROW 50305, N'Subspecialitatea selectată nu este validă pentru specializarea aleasă.', 1;
            END;
        END;

        -- Validare: dacă avem subspecialitate, trebuie să avem și specialitate
        IF @SubspecialtyId IS NOT NULL AND @SpecialtyId IS NULL
        BEGIN
            ;THROW 50305, N'Nu se poate selecta o subspecialitate fără a selecta o specializare.', 1;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO Doctors (
            ClinicId, DepartmentId, SupervisorDoctorId, SpecialtyId, SubspecialtyId,
            FirstName, LastName, Email, PhoneNumber, MedicalCode, LicenseNumber,
            LicenseExpiresAt, IsActive, IsDeleted, CreatedAt, CreatedBy
        )
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (
            @ClinicId, @DepartmentId, @SupervisorDoctorId, @SpecialtyId, @SubspecialtyId,
            @FirstName, @LastName, @Email, @PhoneNumber, @MedicalCode, @LicenseNumber,
            @LicenseExpiresAt, 1, 0, GETDATE(), @CreatedBy
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
