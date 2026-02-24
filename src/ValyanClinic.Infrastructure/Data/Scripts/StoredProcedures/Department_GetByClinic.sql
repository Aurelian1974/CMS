SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE dbo.Department_GetByClinic
    @ClinicId   UNIQUEIDENTIFIER,
    @IsActive   BIT              = NULL,
    @LocationId UNIQUEIDENTIFIER = NULL
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
           NULL           AS HeadDoctorName,   -- TODO: JOIN Doctors când tabelul există
           d.IsActive,
           d.CreatedAt,
           d.UpdatedAt
    FROM Departments d
    INNER JOIN ClinicLocations cl ON cl.Id = d.LocationId AND cl.IsDeleted = 0
    WHERE d.ClinicId = @ClinicId
      AND d.IsDeleted = 0
      AND (@IsActive IS NULL OR d.IsActive = @IsActive)
      AND (@LocationId IS NULL OR d.LocationId = @LocationId)
    ORDER BY d.Name;
END;
GO
