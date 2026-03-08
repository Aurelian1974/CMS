SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicBankAccount_Create
-- Descriere: Adaugă un cont bancar pentru o clinică
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicBankAccount_Create
    @ClinicId UNIQUEIDENTIFIER,
    @BankName NVARCHAR(100),
    @Iban     NVARCHAR(34),
    @Currency NVARCHAR(3)   = 'RON',
    @IsMain   BIT           = 0,
    @Notes    NVARCHAR(500) = NULL
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

        -- Dacă noul cont e principal, resetează celelalte
        IF @IsMain = 1
        BEGIN
            UPDATE dbo.ClinicBankAccounts
            SET IsMain = 0, UpdatedAt = GETDATE()
            WHERE ClinicId = @ClinicId AND IsMain = 1 AND IsDeleted = 0;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO dbo.ClinicBankAccounts (ClinicId, BankName, Iban, Currency, IsMain, Notes)
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (@ClinicId, @BankName, @Iban, @Currency, @IsMain, @Notes);

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
