SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicLocation_Create
-- Descriere: Creează o locație nouă pentru o clinică
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicLocation_Create
    @ClinicId    UNIQUEIDENTIFIER,
    @Name        NVARCHAR(200),
    @Address     NVARCHAR(500),
    @City        NVARCHAR(100),
    @County      NVARCHAR(100),
    @PostalCode  NVARCHAR(10)  = NULL,
    @PhoneNumber NVARCHAR(20)  = NULL,
    @Email       NVARCHAR(200) = NULL,
    @IsPrimary   BIT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Clinics WHERE Id = @ClinicId)
        BEGIN
            ;THROW 50201, N'Clinica nu a fost găsită.', 1;
        END;

        -- Dacă noua locație e primară, resetează celelalte
        IF @IsPrimary = 1
        BEGIN
            UPDATE ClinicLocations
            SET IsPrimary = 0, UpdatedAt = GETDATE()
            WHERE ClinicId = @ClinicId AND IsPrimary = 1 AND IsDeleted = 0;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO ClinicLocations (ClinicId, Name, Address, City, County,
                                     PostalCode, PhoneNumber, Email, IsPrimary)
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (@ClinicId, @Name, @Address, @City, @County,
                @PostalCode, @PhoneNumber, @Email, @IsPrimary);

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
