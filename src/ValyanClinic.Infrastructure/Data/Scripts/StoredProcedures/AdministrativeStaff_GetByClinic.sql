-- ============================================================
-- AdministrativeStaff_GetByClinic — listă simplă pentru dropdown-uri
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.AdministrativeStaff_GetByClinic
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        s.Id,
        s.FirstName + ' ' + s.LastName AS FullName,
        s.FirstName,
        s.LastName,
        s.Email,
        s.DepartmentId,
        dep.Name                       AS DepartmentName,
        s.PositionId,
        pos.Name                       AS PositionName
    FROM dbo.AdministrativeStaff s
    LEFT JOIN dbo.Departments             dep ON dep.Id = s.DepartmentId AND dep.IsDeleted = 0
    LEFT JOIN dbo.AdministrativePositions pos ON pos.Id = s.PositionId
    WHERE s.ClinicId  = @ClinicId
      AND s.IsDeleted = 0
      AND s.IsActive  = 1
    ORDER BY s.LastName, s.FirstName;
END;
GO
