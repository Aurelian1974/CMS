SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicContactPerson_GetByClinic
-- Descriere: Returnează persoanele de contact ale unei clinici
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicContactPerson_GetByClinic
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, ClinicId, Name, [Function], PhoneNumber, Email, IsMain, CreatedAt, UpdatedAt
    FROM dbo.ClinicContactPersons
    WHERE ClinicId = @ClinicId AND IsDeleted = 0
    ORDER BY IsMain DESC, Name;
END;
GO
