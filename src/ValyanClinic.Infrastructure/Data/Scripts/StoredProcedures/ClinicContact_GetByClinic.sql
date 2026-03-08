SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicContact_GetByClinic
-- Descriere: Returnează datele de contact ale unei clinici (exclusiv şterse)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicContact_GetByClinic
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, ClinicId, ContactType, Value, Label, IsMain, CreatedAt, UpdatedAt
    FROM dbo.ClinicContacts
    WHERE ClinicId = @ClinicId AND IsDeleted = 0
    ORDER BY ContactType, IsMain DESC;
END;
GO
