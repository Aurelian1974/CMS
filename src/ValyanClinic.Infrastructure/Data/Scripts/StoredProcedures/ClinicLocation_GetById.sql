SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicLocation_GetById
-- Descriere: Returnează o locație după Id
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicLocation_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT cl.Id, cl.ClinicId, cl.Name, cl.Address, cl.City, cl.County,
           cl.PostalCode, cl.PhoneNumber, cl.Email,
           cl.IsPrimary, cl.IsActive, cl.CreatedAt, cl.UpdatedAt
    FROM ClinicLocations cl
    WHERE cl.Id = @Id
      AND cl.ClinicId = @ClinicId
      AND cl.IsDeleted = 0;
END;
GO
