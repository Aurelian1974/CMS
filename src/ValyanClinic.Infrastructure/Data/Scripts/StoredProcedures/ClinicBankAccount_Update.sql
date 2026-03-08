SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicBankAccount_Update
-- Descriere: Actualizează un cont bancar
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicBankAccount_Update
    @Id       UNIQUEIDENTIFIER,
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

        IF NOT EXISTS (SELECT 1 FROM dbo.ClinicBankAccounts WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50250, N'Contul bancar nu a fost găsit.', 1;
        END;

        -- Dacă contul devine principal, resetează celelalte
        IF @IsMain = 1
        BEGIN
            UPDATE dbo.ClinicBankAccounts
            SET IsMain = 0, UpdatedAt = GETDATE()
            WHERE ClinicId = @ClinicId AND IsMain = 1 AND IsDeleted = 0 AND Id <> @Id;
        END;

        UPDATE dbo.ClinicBankAccounts
        SET BankName  = @BankName,
            Iban      = @Iban,
            Currency  = @Currency,
            IsMain    = @IsMain,
            Notes     = @Notes,
            UpdatedAt = GETDATE()
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
