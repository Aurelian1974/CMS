SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicAddress_Create
-- Descriere: Adaugă o adresă pentru o clinică
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicAddress_Create
    @ClinicId    UNIQUEIDENTIFIER,
    @AddressType NVARCHAR(50),
    @Street      NVARCHAR(500),
    @City        NVARCHAR(100),
    @County      NVARCHAR(100),
    @PostalCode  NVARCHAR(10)  = NULL,
    @Country     NVARCHAR(100) = N'România',
    @IsMain      BIT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.Clinics WHERE Id = @ClinicId)
        BEGIN
            ;THROW 50201, N'Clinica nu a fost găsită.', 1;
        END;

        -- Dacă noua adresă e principală, resetează celelalte
        IF @IsMain = 1
        BEGIN
            UPDATE dbo.ClinicAddresses
            SET IsMain = 0, UpdatedAt = GETDATE()
            WHERE ClinicId = @ClinicId AND IsMain = 1 AND IsDeleted = 0;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO dbo.ClinicAddresses (ClinicId, AddressType, Street, City, County, PostalCode, Country, IsMain)
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (@ClinicId, @AddressType, @Street, @City, @County, @PostalCode, @Country, @IsMain);

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
