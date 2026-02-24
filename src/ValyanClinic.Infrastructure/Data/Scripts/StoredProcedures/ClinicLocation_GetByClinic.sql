SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicLocation_GetByClinic
-- Descriere: Returnează toate locațiile unei clinici
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicLocation_GetByClinic
    @ClinicId UNIQUEIDENTIFIER,
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT cl.Id, cl.ClinicId, cl.Name, cl.Address, cl.City, cl.County,
           cl.PostalCode, cl.PhoneNumber, cl.Email,
           cl.IsPrimary, cl.IsActive, cl.CreatedAt, cl.UpdatedAt
    FROM ClinicLocations cl
    WHERE cl.ClinicId = @ClinicId
      AND cl.IsDeleted = 0
      AND (@IsActive IS NULL OR cl.IsActive = @IsActive)
    ORDER BY cl.IsPrimary DESC, cl.Name;
END;
GO
