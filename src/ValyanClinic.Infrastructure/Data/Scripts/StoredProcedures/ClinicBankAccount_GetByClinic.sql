SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicBankAccount_GetByClinic
-- Descriere: Returnează conturile bancare ale unei clinici (exclusiv şterse)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicBankAccount_GetByClinic
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, ClinicId, BankName, Iban, Currency, IsMain, Notes, CreatedAt, UpdatedAt
    FROM dbo.ClinicBankAccounts
    WHERE ClinicId = @ClinicId AND IsDeleted = 0
    ORDER BY IsMain DESC, BankName;
END;
GO
