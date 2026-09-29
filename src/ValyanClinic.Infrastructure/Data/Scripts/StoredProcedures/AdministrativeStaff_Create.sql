-- ============================================================
-- AdministrativeStaff_Create — creare personal administrativ
-- Coduri eroare: 50701=email duplicat, 50702=departament invalid,
--   50703=funcție invalidă
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.AdministrativeStaff_Create
    @ClinicId     UNIQUEIDENTIFIER,
    @DepartmentId UNIQUEIDENTIFIER = NULL,
    @PositionId   UNIQUEIDENTIFIER = NULL,
    @FirstName    NVARCHAR(100),
    @LastName     NVARCHAR(100),
    @Email        NVARCHAR(200),
    @PhoneNumber  NVARCHAR(20)     = NULL,
    @CreatedBy    UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (
            SELECT 1 FROM dbo.AdministrativeStaff
            WHERE Email = @Email AND ClinicId = @ClinicId AND IsDeleted = 0
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

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO dbo.AdministrativeStaff (
            ClinicId, DepartmentId, PositionId,
            FirstName, LastName, Email, PhoneNumber,
            IsActive, IsDeleted, CreatedAt, CreatedBy
        )
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (
            @ClinicId, @DepartmentId, @PositionId,
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
