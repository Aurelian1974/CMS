SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE dbo.Department_Update
    @Id           UNIQUEIDENTIFIER,
    @ClinicId     UNIQUEIDENTIFIER,
    @LocationId   UNIQUEIDENTIFIER,
    @Name         NVARCHAR(200),
    @Code         NVARCHAR(20),
    @Description  NVARCHAR(500) = NULL,
    @HeadDoctorId UNIQUEIDENTIFIER = NULL,
    @IsActive     BIT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validare: departamentul trebuie să existe
        IF NOT EXISTS (SELECT 1 FROM Departments WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50220, 'Departamentul nu a fost găsit.', 1;
        END;

        -- Validare: locația trebuie să existe și să aparțină aceleiași clinici
        IF NOT EXISTS (SELECT 1 FROM ClinicLocations WHERE Id = @LocationId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50222, 'Locația selectată nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Validare: codul trebuie să fie unic per clinică (excluzând departamentul curent)
        IF EXISTS (SELECT 1 FROM Departments WHERE Code = @Code AND ClinicId = @ClinicId AND Id <> @Id AND IsDeleted = 0)
        BEGIN
            ;THROW 50221, 'Un departament cu acest cod există deja.', 1;
        END;

        -- Validare: șeful de departament trebuie să fie un doctor valid din aceeași clinică
        IF @HeadDoctorId IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM Doctors WHERE Id = @HeadDoctorId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50223, 'Doctorul selectat ca șef de departament nu există.', 1;
        END;

        UPDATE Departments
        SET LocationId    = @LocationId,
            Name          = @Name,
            Code          = @Code,
            Description   = @Description,
            HeadDoctorId  = @HeadDoctorId,
            IsActive      = @IsActive,
            UpdatedAt     = GETDATE()
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
