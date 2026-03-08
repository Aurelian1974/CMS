SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicAddress_Update
-- Descriere: Actualizează o adresă a clinicii
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicAddress_Update
    @Id          UNIQUEIDENTIFIER,
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

        IF NOT EXISTS (SELECT 1 FROM dbo.ClinicAddresses WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50260, N'Adresa nu a fost găsită.', 1;
        END;

        -- Dacă adresa devine principală, resetează celelalte
        IF @IsMain = 1
        BEGIN
            UPDATE dbo.ClinicAddresses
            SET IsMain = 0, UpdatedAt = GETDATE()
            WHERE ClinicId = @ClinicId AND IsMain = 1 AND IsDeleted = 0 AND Id <> @Id;
        END;

        UPDATE dbo.ClinicAddresses
        SET AddressType = @AddressType,
            Street      = @Street,
            City        = @City,
            County      = @County,
            PostalCode  = @PostalCode,
            Country     = @Country,
            IsMain      = @IsMain,
            UpdatedAt   = GETDATE()
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
