-- =============================================================================
-- SP: User_Update — actualizare utilizator (fără parolă — parola e SP separat)
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.User_Update
    @Id             UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER,
    @RoleId         UNIQUEIDENTIFIER,
    @DoctorId       UNIQUEIDENTIFIER = NULL,
    @MedicalStaffId UNIQUEIDENTIFIER = NULL,
    @AdministrativeStaffId UNIQUEIDENTIFIER = NULL,
    @Username       NVARCHAR(100),
    @Email          NVARCHAR(200),
    @FirstName      NVARCHAR(100),
    @LastName       NVARCHAR(100),
    @IsActive       BIT,
    @UpdatedBy      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Verificare utilizator există
        IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50507, N'Utilizatorul nu a fost găsit.', 1;
        END;

        -- Verificare email duplicat (exclude utilizatorul curent)
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email AND ClinicId = @ClinicId AND Id <> @Id AND IsDeleted = 0)
        BEGIN
            ;THROW 50500, N'Un utilizator cu această adresă de email există deja.', 1;
        END;

        -- Verificare username duplicat (exclude utilizatorul curent)
        IF EXISTS (SELECT 1 FROM Users WHERE Username = @Username AND ClinicId = @ClinicId AND Id <> @Id AND IsDeleted = 0)
        BEGIN
            ;THROW 50508, N'Un utilizator cu acest username există deja.', 1;
        END;

        -- Verificare asociere validă (exact unul din DoctorId/MedicalStaffId/AdministrativeStaffId)
        IF (CASE WHEN @DoctorId              IS NULL THEN 0 ELSE 1 END)
         + (CASE WHEN @MedicalStaffId        IS NULL THEN 0 ELSE 1 END)
         + (CASE WHEN @AdministrativeStaffId IS NULL THEN 0 ELSE 1 END) <> 1
        BEGIN
            ;THROW 50501, N'Utilizatorul trebuie asociat unui doctor, unui membru al personalului medical sau al personalului administrativ.', 1;
        END;

        -- Verificare doctor
        IF @DoctorId IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM Doctors WHERE Id = @DoctorId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50502, N'Doctorul selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Verificare MedicalStaff
        IF @MedicalStaffId IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM MedicalStaff WHERE Id = @MedicalStaffId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50503, N'Personalul medical selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        IF @AdministrativeStaffId IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM AdministrativeStaff WHERE Id = @AdministrativeStaffId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50509, N'Personalul administrativ selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Verificare rolul există
        IF NOT EXISTS (SELECT 1 FROM Roles WHERE Id = @RoleId AND IsActive = 1)
        BEGIN
            ;THROW 50504, N'Rolul selectat nu există sau nu este activ.', 1;
        END;

        -- Verificare că doctorul/staff-ul nu e asociat altui utilizator
        IF @DoctorId IS NOT NULL
           AND EXISTS (SELECT 1 FROM Users WHERE DoctorId = @DoctorId AND ClinicId = @ClinicId AND Id <> @Id AND IsDeleted = 0)
        BEGIN
            ;THROW 50505, N'Acest doctor are deja un cont de utilizator asociat.', 1;
        END;

        IF @MedicalStaffId IS NOT NULL
           AND EXISTS (SELECT 1 FROM Users WHERE MedicalStaffId = @MedicalStaffId AND ClinicId = @ClinicId AND Id <> @Id AND IsDeleted = 0)
        BEGIN
            ;THROW 50506, N'Acest membru al personalului medical are deja un cont de utilizator asociat.', 1;
        END;

        IF @AdministrativeStaffId IS NOT NULL
           AND EXISTS (SELECT 1 FROM Users WHERE AdministrativeStaffId = @AdministrativeStaffId AND ClinicId = @ClinicId AND Id <> @Id AND IsDeleted = 0)
        BEGIN
            ;THROW 50510, N'Acest membru al personalului administrativ are deja un cont de utilizator asociat.', 1;
        END;

        -- Audit: captează valorile vechi ÎNAINTE de update (fără PasswordHash)
        DECLARE @OldValues NVARCHAR(MAX);
        SELECT @OldValues = (
            SELECT Username, Email, FirstName, LastName, RoleId, DoctorId, MedicalStaffId, AdministrativeStaffId, IsActive
            FROM Users WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE Users
        SET RoleId         = @RoleId,
            DoctorId       = @DoctorId,
            MedicalStaffId = @MedicalStaffId,
            AdministrativeStaffId = @AdministrativeStaffId,
            Username       = @Username,
            Email          = @Email,
            FirstName      = @FirstName,
            LastName       = @LastName,
            IsActive       = @IsActive,
            UpdatedBy      = @UpdatedBy,
            UpdatedAt      = GETDATE()
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        -- Audit: captează valorile noi DUPĂ update
        DECLARE @NewValues NVARCHAR(MAX);
        SELECT @NewValues = (
            SELECT Username, Email, FirstName, LastName, RoleId, DoctorId, MedicalStaffId, AdministrativeStaffId, IsActive
            FROM Users WHERE Id = @Id AND ClinicId = @ClinicId
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'User', @Id, N'Update', @OldValues, @NewValues, @UpdatedBy);

        COMMIT TRANSACTION;
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
