-- =============================================================================
-- SP: User_Create — creare utilizator nou
-- Parola va fi deja hash-uită (BCrypt) din C# — stocăm doar hash-ul.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.User_Create
    @ClinicId       UNIQUEIDENTIFIER,
    @RoleId         UNIQUEIDENTIFIER,
    @DoctorId       UNIQUEIDENTIFIER = NULL,
    @MedicalStaffId UNIQUEIDENTIFIER = NULL,
    @Username       NVARCHAR(100),
    @Email          NVARCHAR(200),
    @PasswordHash   NVARCHAR(500),
    @FirstName      NVARCHAR(100),
    @LastName       NVARCHAR(100),
    @IsActive       BIT = 1,
    @CreatedBy      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Verificare email duplicat
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50500, N'Un utilizator cu această adresă de email există deja.', 1;
        END;

        -- Verificare username duplicat
        IF EXISTS (SELECT 1 FROM Users WHERE Username = @Username AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50508, N'Un utilizator cu acest username există deja.', 1;
        END;

        -- Verificare asociere validă (exact unul din DoctorId/MedicalStaffId trebuie să fie non-NULL)
        IF (@DoctorId IS NULL AND @MedicalStaffId IS NULL)
           OR (@DoctorId IS NOT NULL AND @MedicalStaffId IS NOT NULL)
        BEGIN
            ;THROW 50501, N'Utilizatorul trebuie asociat fie unui doctor, fie unui membru al personalului medical.', 1;
        END;

        -- Verificare doctor există (dacă e specificat)
        IF @DoctorId IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM Doctors WHERE Id = @DoctorId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50502, N'Doctorul selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Verificare MedicalStaff există (dacă e specificat)
        IF @MedicalStaffId IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM MedicalStaff WHERE Id = @MedicalStaffId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50503, N'Personalul medical selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Verificare rolul există
        IF NOT EXISTS (SELECT 1 FROM Roles WHERE Id = @RoleId AND IsActive = 1)
        BEGIN
            ;THROW 50504, N'Rolul selectat nu există sau nu este activ.', 1;
        END;

        -- Verificare că doctorul/staff-ul nu e deja asociat altui utilizator
        IF @DoctorId IS NOT NULL
           AND EXISTS (SELECT 1 FROM Users WHERE DoctorId = @DoctorId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50505, N'Acest doctor are deja un cont de utilizator asociat.', 1;
        END;

        IF @MedicalStaffId IS NOT NULL
           AND EXISTS (SELECT 1 FROM Users WHERE MedicalStaffId = @MedicalStaffId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50506, N'Acest membru al personalului medical are deja un cont de utilizator asociat.', 1;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO Users (ClinicId, RoleId, DoctorId, MedicalStaffId, Username, Email, PasswordHash,
                           FirstName, LastName, IsActive, CreatedBy, CreatedAt, IsDeleted)
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (@ClinicId, @RoleId, @DoctorId, @MedicalStaffId, @Username, @Email, @PasswordHash,
                @FirstName, @LastName, @IsActive, @CreatedBy, GETDATE(), 0);

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
