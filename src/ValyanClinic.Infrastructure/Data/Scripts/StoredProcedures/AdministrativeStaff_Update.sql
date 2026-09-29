-- ============================================================
-- AdministrativeStaff_Update — actualizare personal administrativ
-- Coduri eroare: 50700=not found, 50701=email duplicat,
--   50702=departament invalid, 50703=funcție invalidă
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.AdministrativeStaff_Update
    @Id           UNIQUEIDENTIFIER,
    @ClinicId     UNIQUEIDENTIFIER,
    @DepartmentId UNIQUEIDENTIFIER = NULL,
    @PositionId   UNIQUEIDENTIFIER = NULL,
    @FirstName    NVARCHAR(100),
    @LastName     NVARCHAR(100),
    @Email        NVARCHAR(200),
    @PhoneNumber  NVARCHAR(20)     = NULL,
    @IsActive     BIT,
    @UpdatedBy    UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.AdministrativeStaff
            WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50700, N'Membrul personalului administrativ nu a fost găsit.', 1;
        END;

        IF EXISTS (
            SELECT 1 FROM dbo.AdministrativeStaff
            WHERE Email = @Email AND ClinicId = @ClinicId AND Id <> @Id AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50701, N'Un membru al personalului administrativ cu această adresă de email există deja.', 1;
        END;

        IF @DepartmentId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM dbo.Departments
            WHERE Id = @DepartmentId AND ClinicId = @ClinicId AND IsDeleted = 0
        )
        BEGIN
            ;THROW 50702, N'Departamentul selectat nu există sau nu aparține acestei clinici.', 1;
        END;

        IF @PositionId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM dbo.AdministrativePositions
            WHERE Id = @PositionId AND IsActive = 1
        )
        BEGIN
            ;THROW 50703, N'Funcția selectată nu există sau nu este activă.', 1;
        END;

        UPDATE dbo.AdministrativeStaff
        SET DepartmentId = @DepartmentId,
            PositionId   = @PositionId,
            FirstName    = @FirstName,
            LastName     = @LastName,
            Email        = @Email,
            PhoneNumber  = @PhoneNumber,
            IsActive     = @IsActive,
            UpdatedAt    = GETDATE(),
            UpdatedBy    = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
