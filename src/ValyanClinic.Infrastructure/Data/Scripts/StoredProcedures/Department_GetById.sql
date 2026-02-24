SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE dbo.Department_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT d.Id,
           d.ClinicId,
           d.LocationId,
           cl.Name       AS LocationName,
           d.Name,
           d.Code,
           d.Description,
           d.HeadDoctorId,
           NULL           AS HeadDoctorName,
           d.IsActive,
           d.CreatedAt,
           d.UpdatedAt
    FROM Departments d
    INNER JOIN ClinicLocations cl ON cl.Id = d.LocationId AND cl.IsDeleted = 0
    WHERE d.Id = @Id
      AND d.ClinicId = @ClinicId
      AND d.IsDeleted = 0;
END;
GO
