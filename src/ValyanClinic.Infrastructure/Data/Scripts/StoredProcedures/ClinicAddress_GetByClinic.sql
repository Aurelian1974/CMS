SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicAddress_GetByClinic
-- Descriere: Returnează adresele unei clinici (exclusiv şterse)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicAddress_GetByClinic
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, ClinicId, AddressType, Street, City, County, PostalCode, Country, IsMain, CreatedAt, UpdatedAt
    FROM dbo.ClinicAddresses
    WHERE ClinicId = @ClinicId AND IsDeleted = 0
    ORDER BY IsMain DESC, AddressType;
END;
GO
